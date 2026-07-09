/**
 * The playable board: renders the grid as gem tiles, handles swap input, and
 * runs the animated match → clear → gravity → cascade loop with particles,
 * screen shake, combo scoring and sound. This is the "juice" layer; all the
 * pure rules live in game/matchLogic.ts.
 *
 * Phase 2 adds special tiles (line-clearers + colour bombs). Specials are held
 * in a `specials[][]` grid kept in lock-step with `grid` (kinds) and `tiles`
 * (containers) across every mutation: swap, clear, collapse and reshuffle. All
 * three arrays are always indexed the same way — if you touch one at [r][c] you
 * must touch the others, or specials will silently desync from their gems.
 */

import Phaser from 'phaser';
import {
  BOARD_X, BOARD_Y, BOARD_W, BOARD_H, COLS, ROWS, TILE, KINDS, TILE_POINTS,
  SPECIAL_CREATE_POINTS, SPECIAL_DETONATE_POINTS, GAME_W, SWIPE_THRESHOLD,
  cellCenter, swipeTarget, type Special,
} from '../game/config';
import { createGrid, findRuns, swapMakesRun, hasAnyMove, adjacent, type Grid, type Run } from '../game/matchLogic';
import {
  sfxSelect, sfxSwap, sfxInvalid, sfxMatch, sfxSpecialCreate, sfxRocket, sfxBomb,
} from '../game/sound';
import { getBest, setBest, getUnlocked, setUnlocked, setStars } from '../game/storage';
import { getLevel, starsFor, goalLabel, LEVEL_COUNT, type Level } from '../game/levels';
import { makeButton } from '../ui/Button';
import { COLORS } from '../ui/theme';
import { fadeIn } from '../ui/transitions';

type Tile = Phaser.GameObjects.Container;
/** A board coordinate. */
interface Cell { r: number; c: number }
/** One primary-pointer gesture captured on the board. */
interface DownGesture extends Cell { x: number; y: number; pointerId: number }
/** One special firing, recorded during detonation so we can play its VFX. */
interface Detonation { type: Special; r: number; c: number; color: number }
/** Optional inputs for one resolve pass (only honoured on the first cascade step). */
interface ResolveOpts {
  /** Preferred pivot cells when a swap forges a special (the two swapped cells). */
  pivotHints?: Cell[];
  /** Specials to detonate unconditionally, e.g. one swapped into place with no run. */
  forcedSeeds?: Cell[];
  /** Overrides the colour a specific bomb (by "r,c" key) clears — used for bomb+normal swaps. */
  bombColorFor?: Map<string, number>;
}

export class GameScene extends Phaser.Scene {
  private grid: Grid = [];
  private tiles: (Tile | null)[][] = [];
  private specials: Special[][] = [];
  private selected: { r: number; c: number } | null = null;
  private busy = true;
  private score = 0;
  private shown = 0;
  private best = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private ring!: Phaser.GameObjects.Graphics;
  /** One reused particle emitter per gem colour — pooled so a big cascade never
   * allocates/destroys dozens of emitters in a frame (the main source of jank). */
  private emitters!: Map<number, Phaser.GameObjects.Particles.ParticleEmitter>;
  private downGesture: DownGesture | null = null;

  // ---- Phase 4: level / goal / moves state ----
  /** Index of the level being played (0-based). Set in init(). */
  private levelIndex = 0;
  /** The active level's config (moves / goal / star thresholds). */
  private level: Level = getLevel(0);
  /** Moves remaining; decremented only on a committed swap. */
  private movesLeft = 0;
  /** Gems of the goal kind cleared so far (for 'collect' goals). */
  private collected = 0;
  /** True once win/lose has fired, so no further swaps or end-checks run. */
  private ended = false;
  private levelText!: Phaser.GameObjects.Text;
  private movesText!: Phaser.GameObjects.Text;
  private goalText!: Phaser.GameObjects.Text;

  constructor() {
    super('game');
  }

  /**
   * Selects which level to play. Called by Phaser before create(): from the
   * menu ('Play (Level N)'), from Win→Next and Lose→Retry, or with no data on a
   * bare scene.start('game') — in which case we fall back to the furthest
   * unlocked level. The index is clamped so it can never fall out of range.
   */
  init(data: { level?: number }): void {
    const requested = typeof data?.level === 'number' ? data.level : getUnlocked();
    this.levelIndex = Math.max(0, Math.min(LEVEL_COUNT - 1, requested));
  }

  create(): void {
    // Phaser reuses one scene instance across restarts, so field initialisers
    // only run once — reset ALL mutable state here so every boot (and Restart)
    // starts truly fresh: no stale busy=true, no leftover selection or score.
    this.selected = null;
    this.downGesture = null;
    this.busy = true;
    this.score = 0;
    this.shown = 0;
    this.best = getBest();

    // Fresh level state for this boot (Retry / Next / Restart all land here).
    this.level = getLevel(this.levelIndex);
    this.movesLeft = this.level.moves;
    this.collected = 0;
    this.ended = false;

    this.buildBackground();
    fadeIn(this);
    this.buildHud();
    this.buildTopBar();
    this.makeSparkTexture();
    this.buildEmitters();

    // Seed the HUD with this level's number, goal and move budget.
    this.levelText.setText(`LEVEL ${this.levelIndex + 1}`);
    this.updateHud();

    this.ring = this.add.graphics().setDepth(5).setVisible(false);
    this.ring.lineStyle(5, 0xffffff, 0.95);
    this.ring.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 16);
    this.tweens.add({ targets: this.ring, scale: { from: 1, to: 1.08 }, yoyo: true, repeat: -1, duration: 420 });

    this.grid = createGrid();
    this.tiles = Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null));
    this.specials = Array.from({ length: ROWS }, () => Array<Special>(COLS).fill('none'));
    this.spawnInitialTiles();

    // Scene-scoped input: Phaser clears these listeners on shutdown, so a
    // Menu→Game→Menu→Game loop never double-binds (no ghost/duplicate taps).
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointerDown(p));
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => this.onPointerUp(p));
  }

  /** Top bar: a Pause button that freezes the board and raises the pause overlay. */
  private buildTopBar(): void {
    makeButton(this, GAME_W - 70, 60, '⏸', () => {
      // Hand the current level to Pause so its Restart restarts THIS level.
      this.scene.launch('pause', { level: this.levelIndex });
      this.scene.pause();
    }, { width: 84, height: 84, fontSize: 40, bg: COLORS.secondary, radius: 22 });
  }

  // ---------- scenery ----------
  private buildBackground(): void {
    const g = this.add.graphics();
    g.fillGradientStyle(0x241245, 0x241245, 0x120826, 0x120826, 1);
    g.fillRect(0, 0, GAME_W, this.scale.height);
    const frame = this.add.graphics();
    frame.fillStyle(0x000000, 0.28);
    frame.fillRoundedRect(BOARD_X - 12, BOARD_Y - 12, BOARD_W + 24, BOARD_H + 24, 24);
  }

  private buildHud(): void {
    // Level number, big and centred up top.
    this.levelText = this.add.text(GAME_W / 2, 48, 'LEVEL 1', {
      fontFamily: 'system-ui, sans-serif', fontSize: '44px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000066', 8);

    // Two stat columns: SCORE (left) and MOVES (right).
    this.add.text(210, 126, 'SCORE', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);
    this.scoreText = this.add.text(210, 180, '0', {
      fontFamily: 'system-ui', fontSize: '58px', fontStyle: '800', color: '#ffd23f',
    }).setOrigin(0.5);

    this.add.text(510, 126, 'MOVES', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);
    this.movesText = this.add.text(510, 180, '0', {
      fontFamily: 'system-ui', fontSize: '58px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);

    // Goal readout spanning the width, just above the board.
    this.goalText = this.add.text(GAME_W / 2, 292, '', {
      fontFamily: 'system-ui', fontSize: '34px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 3, '#00000066', 6);

    this.comboText = this.add.text(GAME_W / 2, BOARD_Y + BOARD_H / 2, '', {
      fontFamily: 'system-ui', fontSize: '72px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setDepth(20).setAlpha(0).setShadow(0, 4, '#000000aa', 10);
  }

  /** Refresh the live HUD readouts: moves (turns red when low) and goal progress. */
  private updateHud(): void {
    this.movesText.setText(String(Math.max(0, this.movesLeft)));
    this.movesText.setColor(this.movesLeft <= 3 ? '#ff5b6b' : '#ffffff');

    const g = this.level.goal;
    if (g.type === 'score') {
      this.goalText.setText(`🎯  ${Math.min(this.score, g.target)} / ${g.target}`);
    } else {
      this.goalText.setText(`${KINDS[g.kind].glyph}  ${Math.min(this.collected, g.count)} / ${g.count}`);
    }
    this.goalText.setColor(this.goalMet() ? '#33d9a6' : '#ffffff');
  }

  /** True once the active level's goal is satisfied. */
  private goalMet(): boolean {
    const g = this.level.goal;
    return g.type === 'score' ? this.score >= g.target : this.collected >= g.count;
  }

  private makeSparkTexture(): void {
    if (this.textures.exists('spark')) return; // persists across restarts
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 9, 9);
    g.generateTexture('spark', 18, 18);
    g.destroy();
  }

  // ---------- tiles ----------
  /**
   * Build a tile container. `special` decorates it: line tiles get a bright
   * stripe + ↔/↕, the bomb gets a dark gem with a colour core + ✦ and a pulsing
   * glow so the colour it will clear stays readable.
   */
  private makeTile(r: number, c: number, kind: number, startY: number, special: Special = 'none'): Tile {
    const { x } = cellCenter(r, c);
    const { color, glyph } = KINDS[kind];
    const children: Phaser.GameObjects.GameObject[] = [];

    const gem = this.add.graphics();
    if (special === 'bomb') {
      gem.fillStyle(0x1b1030, 1);
      gem.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, TILE - 10, 18);
      gem.fillStyle(color, 0.92); // colour core: which colour this bomb clears
      gem.fillCircle(0, 0, 17);
      gem.lineStyle(4, color, 1);
      gem.strokeRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, TILE - 10, 18);
    } else {
      gem.fillStyle(color, 1);
      gem.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, TILE - 10, 16);
      gem.fillStyle(0xffffff, 0.22);
      gem.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, (TILE - 10) / 2, 16);
    }
    children.push(gem);

    if (special === 'lineH' || special === 'lineV') {
      const stripe = this.add.graphics();
      stripe.fillStyle(0xffffff, 0.85);
      if (special === 'lineH') stripe.fillRoundedRect(-TILE / 2 + 6, -6, TILE - 12, 12, 6);
      else stripe.fillRoundedRect(-6, -TILE / 2 + 6, 12, TILE - 12, 6);
      children.push(stripe);
      children.push(this.add.text(0, special === 'lineH' ? -20 : 22,
        special === 'lineH' ? '↔' : '↕',
        { fontSize: '24px', fontStyle: '800', color: '#ffffff' }).setOrigin(0.5));
      children.push(this.add.text(0, special === 'lineH' ? 18 : -20, glyph, { fontSize: '28px' }).setOrigin(0.5));
    } else if (special === 'bomb') {
      children.push(this.add.text(0, 0, '✦', { fontSize: '40px', fontStyle: '800', color: '#ffffff' }).setOrigin(0.5));
    } else {
      children.push(this.add.text(0, 2, glyph, { fontSize: '40px' }).setOrigin(0.5));
    }

    if (special !== 'none') {
      const glow = this.add.graphics();
      glow.lineStyle(3, 0xffffff, 1);
      glow.strokeRoundedRect(-TILE / 2 + 3, -TILE / 2 + 3, TILE - 6, TILE - 6, 18);
      children.push(glow);
      this.tweens.add({ targets: glow, alpha: { from: 0.9, to: 0.15 }, yoyo: true, repeat: -1, duration: 520 });
    }

    const tile = this.add.container(x, startY, children);
    tile.setData('kind', kind);
    tile.setData('special', special);
    return tile;
  }

  private spawnInitialTiles(): void {
    const proms: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      for (let r = 0; r < ROWS; r++) {
        const startY = cellCenter(r, c).y - BOARD_H - 120;
        const tile = this.makeTile(r, c, this.grid[r][c], startY);
        this.tiles[r][c] = tile;
        proms.push(this.moveTile(tile, cellCenter(r, c).y, 60 + r * 45, 'Bounce.easeOut'));
      }
    }
    Promise.all(proms).then(() => { this.busy = false; });
  }

  private moveTile(tile: Tile, y: number, delay = 0, ease = 'Cubic.easeIn'): Promise<void> {
    return new Promise((res) => {
      this.tweens.add({ targets: tile, y, duration: 320, delay, ease, onComplete: () => res() });
    });
  }
  private slideTile(tile: Tile, x: number, y: number): Promise<void> {
    return new Promise((res) => {
      this.tweens.add({ targets: tile, x, y, duration: 180, ease: 'Quad.easeInOut', onComplete: () => res() });
    });
  }

  /** Kill any tweens on a tile and its children before destroying it (stops orphaned glow pulses). */
  private killTileTweens(tile: Tile): void {
    this.tweens.killTweensOf(tile);
    for (const child of tile.getAll()) this.tweens.killTweensOf(child);
  }

  // ---------- input ----------
  private cellAt(x: number, y: number): { r: number; c: number } | null {
    const c = Math.floor((x - BOARD_X) / TILE);
    const r = Math.floor((y - BOARD_Y) / TILE);
    return r >= 0 && r < ROWS && c >= 0 && c < COLS ? { r, c } : null;
  }

  private isPrimaryPointer(pointer: Phaser.Input.Pointer): boolean {
    const native = pointer.event as PointerEvent | undefined;
    return typeof native?.isPrimary !== 'boolean' || native.isPrimary;
  }

  private onPointerDown(pointer: Phaser.Input.Pointer): void {
    if (this.busy || this.ended || !this.isPrimaryPointer(pointer) || this.downGesture) return;
    const cell = this.cellAt(pointer.x, pointer.y);
    if (!cell) return;
    this.downGesture = { ...cell, x: pointer.x, y: pointer.y, pointerId: pointer.id };
  }

  private onPointerUp(pointer: Phaser.Input.Pointer): void {
    if (!this.isPrimaryPointer(pointer)) return;
    const down = this.downGesture;
    if (!down || pointer.id !== down.pointerId) return;
    this.downGesture = null;
    if (this.busy || this.ended) return;

    const dx = pointer.x - down.x;
    const dy = pointer.y - down.y;
    const target = swipeTarget(down.r, down.c, dx, dy);
    if (target) {
      this.deselect();
      void this.attemptSwap(down, target);
      return;
    }

    // A long drag with no target was a swipe toward a board edge, not a tap.
    if (Math.hypot(dx, dy) >= SWIPE_THRESHOLD) {
      this.deselect();
      return;
    }

    this.handleTap({ r: down.r, c: down.c });
  }

  /** Preserve the original select-then-select input alongside swipe gestures. */
  private handleTap(cell: Cell): void {
    if (!this.selected) { this.select(cell); sfxSelect(); return; }
    if (this.selected.r === cell.r && this.selected.c === cell.c) { this.deselect(); return; }
    if (adjacent(this.selected.r, this.selected.c, cell.r, cell.c)) {
      const from = this.selected; this.deselect();
      void this.attemptSwap(from, cell);
    } else { this.select(cell); sfxSelect(); }
  }

  private select(cell: { r: number; c: number }): void {
    this.selected = cell;
    const { x, y } = cellCenter(cell.r, cell.c);
    this.ring.setPosition(x, y).setVisible(true);
  }
  private deselect(): void {
    this.selected = null;
    this.ring.setVisible(false);
  }

  private async attemptSwap(a: { r: number; c: number }, b: { r: number; c: number }): Promise<void> {
    this.busy = true;
    try {
      const ta = this.tiles[a.r][a.c]!, tb = this.tiles[b.r][b.c]!;
      const pa = cellCenter(a.r, a.c), pb = cellCenter(b.r, b.c);
      sfxSwap();

      // A swap involving a special is always legal, even with no matching run.
      const specialInvolved = this.specials[a.r][a.c] !== 'none' || this.specials[b.r][b.c] !== 'none';
      const makesRun = swapMakesRun(this.grid, a.r, a.c, b.r, b.c);

      if (!makesRun && !specialInvolved) {
        sfxInvalid();
        await Promise.all([this.slideTile(ta, pb.x, pb.y), this.slideTile(tb, pa.x, pa.y)]);
        await Promise.all([this.slideTile(ta, pa.x, pa.y), this.slideTile(tb, pb.x, pb.y)]);
        this.cameras.main.shake(120, 0.006);
        return;
      }

      // Commit the swap across all three parallel arrays.
      [this.grid[a.r][a.c], this.grid[b.r][b.c]] = [this.grid[b.r][b.c], this.grid[a.r][a.c]];
      [this.specials[a.r][a.c], this.specials[b.r][b.c]] = [this.specials[b.r][b.c], this.specials[a.r][a.c]];
      this.tiles[a.r][a.c] = tb; this.tiles[b.r][b.c] = ta;
      await Promise.all([this.slideTile(ta, pb.x, pb.y), this.slideTile(tb, pa.x, pa.y)]);

      // Force-detonate any special that took part in the swap (post-swap positions).
      const forcedSeeds: Cell[] = [];
      const bombColorFor = new Map<string, number>();
      const spA = this.specials[a.r][a.c], spB = this.specials[b.r][b.c];
      if (spA === 'bomb' && spB === 'bomb') {
        // Bomb + bomb: clear the whole board.
        for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) forcedSeeds.push({ r, c });
      } else {
        if (spA !== 'none') {
          forcedSeeds.push({ r: a.r, c: a.c });
          if (spA === 'bomb' && spB === 'none') bombColorFor.set(`${a.r},${a.c}`, this.grid[b.r][b.c]);
        }
        if (spB !== 'none') {
          forcedSeeds.push({ r: b.r, c: b.c });
          if (spB === 'bomb' && spA === 'none') bombColorFor.set(`${b.r},${b.c}`, this.grid[a.r][a.c]);
        }
      }

      // A committed swap (normal or special-involving) spends exactly one move.
      // Invalid swaps returned above, before this, so they never cost a move.
      this.movesLeft--;
      this.updateHud();

      await this.resolve({ pivotHints: [a, b], forcedSeeds, bombColorFor });

      // resolve() loops to a fixed point, so the board is FULLY settled here —
      // all cascades and special detonations are done. Only now do we judge the
      // outcome, in priority order:
      //   1) goal met  → win immediately (early-win, even with moves to spare)
      //   2) moves gone → loss
      //   3) otherwise, if the board has no legal swap, reshuffle (never a loss,
      //      never costs a move) and play on.
      if (this.goalMet()) { this.win(); return; }
      if (this.movesLeft <= 0) { this.lose(); return; }
      if (!hasAnyMove(this.grid)) await this.reshuffle();
    } finally {
      this.busy = false;
    }
  }

  /** Goal reached: unlock the next level, bank stars, celebrate. */
  private win(): void {
    if (this.ended) return;
    this.ended = true;
    const stars = starsFor(this.level, this.score);
    setUnlocked(this.levelIndex + 1); // open the next level (clamped by menu)
    setStars(this.levelIndex, stars); // keep the best rating for this level
    this.scene.launch('win', { level: this.levelIndex, score: this.score, stars });
    this.scene.pause();
  }

  /** Out of moves with the goal unmet: show the defeat overlay. */
  private lose(): void {
    if (this.ended) return;
    this.ended = true;
    const g = this.level.goal;
    const progress = g.type === 'score'
      ? `You reached ${this.score} / ${g.target}`
      : `Collected ${this.collected} / ${g.count}`;
    this.scene.launch('lose', {
      level: this.levelIndex,
      goalText: goalLabel(g),
      progressText: progress,
    });
    this.scene.pause();
  }

  // ---------- match resolution ----------
  /**
   * Run the match → clear → collapse cascade to a fixed point. On the first
   * step it also honours any forced special detonations from a swap, and forges
   * a new special for every run of 4+.
   */
  private async resolve(opts: ResolveOpts = {}): Promise<void> {
    for (let step = 0; ; step++) {
      const runs = findRuns(this.grid);
      const forced = step === 0 ? (opts.forcedSeeds ?? []) : [];
      if (runs.length === 0 && forced.length === 0) break;

      // 1) A run of 4+ forges a special at a pivot cell; that cell survives.
      const newSpecials = new Map<string, { special: Special; kind: number }>();
      for (const run of runs) {
        if (run.cells.length < 4) continue;
        const special: Special = run.cells.length >= 5 ? 'bomb' : (run.horizontal ? 'lineH' : 'lineV');
        const [pr, pc] = this.choosePivot(run, step === 0 ? opts.pivotHints : undefined);
        newSpecials.set(`${pr},${pc}`, { special, kind: run.kind });
      }

      // 2) Seed the clear with every run cell (minus surviving pivots) plus forced detonations.
      const seeds: Cell[] = [];
      for (const run of runs) for (const [r, c] of run.cells) {
        if (!newSpecials.has(`${r},${c}`)) seeds.push({ r, c });
      }
      for (const f of forced) seeds.push(f);

      // 3) Expand through any specials caught in the blast (recursive, visited-guarded).
      const { toClear, detonations } = this.computeDetonation(seeds, step === 0 ? opts.bombColorFor : undefined);

      // 4) Never clear a cell that is about to become a fresh special.
      for (const key of newSpecials.keys()) toClear.delete(key);

      // 5) Score, sound, camera and combo feedback.
      const base = toClear.size * TILE_POINTS * (step + 1);
      const bonus = newSpecials.size * SPECIAL_CREATE_POINTS + detonations.length * SPECIAL_DETONATE_POINTS;
      this.addScore(base + bonus);
      this.playFeedback(step, detonations, newSpecials.size);

      // 6) Detonation VFX (beams / flashes) before the tiles vanish.
      for (const d of detonations) {
        if (d.type === 'lineH') this.beam(true, d.r, d.c, d.color);
        else if (d.type === 'lineV') this.beam(false, d.r, d.c, d.color);
        else this.bombFlash(cellCenter(d.r, d.c).x, cellCenter(d.r, d.c).y, d.color);
      }

      // 7) Clear tiles, keeping grid / specials / tiles in sync.
      const goal = this.level.goal;
      const pops: Promise<void>[] = [];
      for (const key of toClear) {
        const [r, c] = key.split(',').map(Number);
        // Count toward a 'collect' goal by the tile's own kind, before it clears.
        if (goal.type === 'collect' && this.grid[r][c] === goal.kind) this.collected++;
        const tile = this.tiles[r][c];
        if (tile) { this.burst(tile.x, tile.y, KINDS[this.grid[r][c]].color); pops.push(this.popTile(tile)); }
        this.tiles[r][c] = null;
        this.grid[r][c] = -1;
        this.specials[r][c] = 'none';
      }
      this.updateHud(); // reflect new score / collected progress live

      // 8) Forge the new specials in place (grid kind stays; only the visual + specials flag change).
      for (const [key, { special, kind }] of newSpecials) {
        const [r, c] = key.split(',').map(Number);
        const old = this.tiles[r][c];
        if (old) { this.killTileTweens(old); old.destroy(); }
        const tile = this.makeTile(r, c, kind, cellCenter(r, c).y, special);
        tile.setScale(0.2);
        this.tweens.add({ targets: tile, scale: 1, duration: 260, ease: 'Back.easeOut' });
        this.tiles[r][c] = tile;
        this.specials[r][c] = special;
        this.grid[r][c] = kind;
      }
      if (newSpecials.size > 0) sfxSpecialCreate();

      await Promise.all(pops);
      await this.collapse();
    }
  }

  /**
   * Grow a clear set from `seeds`, detonating every special it touches and
   * chaining into whatever those clear. A `fired` guard makes each special
   * detonate exactly once, so bomb→bomb→line chains always terminate.
   */
  private computeDetonation(seeds: Cell[], bombColorFor?: Map<string, number>): {
    toClear: Set<string>; detonations: Detonation[];
  } {
    const toClear = new Set<string>();
    const fired = new Set<string>();
    const detonations: Detonation[] = [];
    const queue: Cell[] = [...seeds];

    while (queue.length > 0) {
      const { r, c } = queue.pop()!;
      if (r < 0 || r >= ROWS || c < 0 || c >= COLS) continue;
      if (this.grid[r][c] < 0) continue; // already empty
      const key = `${r},${c}`;
      toClear.add(key);

      const sp = this.specials[r][c];
      if (sp === 'none' || fired.has(key)) continue;
      fired.add(key);
      const kind = this.grid[r][c];
      if (sp === 'lineH') {
        detonations.push({ type: 'lineH', r, c, color: KINDS[kind].color });
        for (let cc = 0; cc < COLS; cc++) queue.push({ r, c: cc });
      } else if (sp === 'lineV') {
        detonations.push({ type: 'lineV', r, c, color: KINDS[kind].color });
        for (let rr = 0; rr < ROWS; rr++) queue.push({ r: rr, c });
      } else if (sp === 'bomb') {
        const target = bombColorFor?.get(key) ?? kind;
        detonations.push({ type: 'bomb', r, c, color: KINDS[target].color });
        for (let rr = 0; rr < ROWS; rr++) for (let cc = 0; cc < COLS; cc++) {
          if (this.grid[rr][cc] === target) queue.push({ r: rr, c: cc });
        }
      }
    }
    return { toClear, detonations };
  }

  /** Pick the cell a new special is forged at: a swapped cell if it's in the run, else the middle. */
  private choosePivot(run: Run, hints?: Cell[]): [number, number] {
    if (hints) {
      for (const h of hints) {
        if (run.cells.some(([r, c]) => r === h.r && c === h.c)) return [h.r, h.c];
      }
    }
    return run.cells[Math.floor(run.cells.length / 2)];
  }

  /** Sound + combo text for one clear step, called out by the biggest special involved. */
  private playFeedback(step: number, detonations: Detonation[], created: number): void {
    const hasBomb = detonations.some((d) => d.type === 'bomb');
    const hasLine = detonations.some((d) => d.type === 'lineH' || d.type === 'lineV');
    if (hasBomb) sfxBomb();
    else if (hasLine) sfxRocket();
    else sfxMatch(step);

    const shakeAmt = Math.min(0.004 + (hasBomb ? 0.012 : hasLine ? 0.008 : 0), 0.02);
    this.cameras.main.shake(hasBomb ? 240 : hasLine ? 180 : 140, shakeAmt || 0.004);

    if (hasBomb) this.popCombo(0, 'BOOM!');
    else if (hasLine) this.popCombo(0, 'ROCKET!');
    else if (created > 0) this.popCombo(0, 'POWER-UP!');
    else if (step >= 1) this.popCombo(step + 1);
  }

  private popTile(tile: Tile): Promise<void> {
    this.killTileTweens(tile);
    return new Promise((res) => {
      this.tweens.add({
        targets: tile, scale: 1.4, alpha: 0, duration: 200, ease: 'Back.easeIn',
        onComplete: () => { tile.destroy(); res(); },
      });
    });
  }

  /** Build one reusable emitter per gem colour (called once per scene start). */
  private buildEmitters(): void {
    this.emitters = new Map();
    for (const kind of KINDS) {
      const e = this.add.particles(0, 0, 'spark', {
        speed: { min: 60, max: 240 }, lifespan: 360, scale: { start: 0.85, end: 0 },
        quantity: 1, emitting: false, tint: kind.color, blendMode: 'ADD',
      }).setDepth(15);
      this.emitters.set(kind.color, e);
    }
  }

  private burst(x: number, y: number, color: number): void {
    // Reuse the pooled emitter for this colour — no per-tile allocation.
    this.emitters.get(color)?.explode(10, x, y);
  }

  /** A bright beam sweeping a full row (horizontal) or column, then fading. */
  private beam(horizontal: boolean, r: number, c: number, color: number): void {
    const g = this.add.graphics().setDepth(16).setBlendMode(Phaser.BlendModes.ADD);
    const thick = TILE * 0.5;
    g.fillStyle(0xffffff, 0.9);
    if (horizontal) {
      const y = cellCenter(r, 0).y;
      g.fillRoundedRect(BOARD_X, y - thick / 2, BOARD_W, thick, thick / 2);
    } else {
      const x = cellCenter(0, c).x;
      g.fillRoundedRect(x - thick / 2, BOARD_Y, thick, BOARD_H, thick / 2);
    }
    this.tweens.add({ targets: g, alpha: 0, duration: 340, ease: 'Cubic.easeOut', onComplete: () => g.destroy() });
    // Coloured spark trail along the line.
    const line = horizontal
      ? Array.from({ length: COLS }, (_, i) => cellCenter(r, i))
      : Array.from({ length: ROWS }, (_, i) => cellCenter(i, c));
    for (const p of line) this.burst(p.x, p.y, color);
  }

  /** Radial flash for a colour-bomb blast. */
  private bombFlash(x: number, y: number, color: number): void {
    const flash = this.add.graphics().setPosition(x, y).setDepth(16).setBlendMode(Phaser.BlendModes.ADD);
    flash.fillStyle(0xffffff, 0.9);
    flash.fillCircle(0, 0, TILE * 0.6);
    this.tweens.add({ targets: flash, scale: 3.2, alpha: 0, duration: 420, ease: 'Cubic.easeOut', onComplete: () => flash.destroy() });
    const ring = this.add.graphics().setPosition(x, y).setDepth(16).setBlendMode(Phaser.BlendModes.ADD);
    ring.lineStyle(6, color, 0.9);
    ring.strokeCircle(0, 0, TILE * 0.6);
    this.tweens.add({ targets: ring, scale: 4, alpha: 0, duration: 480, ease: 'Cubic.easeOut', onComplete: () => ring.destroy() });
  }

  /** Drop surviving tiles into gaps and spawn new ones from above. */
  private async collapse(): Promise<void> {
    const proms: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] < 0) continue;
        if (r !== write) {
          // Move kind, special and container together so the three stay aligned.
          this.grid[write][c] = this.grid[r][c]; this.grid[r][c] = -1;
          this.specials[write][c] = this.specials[r][c]; this.specials[r][c] = 'none';
          const tile = this.tiles[r][c]!; this.tiles[write][c] = tile; this.tiles[r][c] = null;
          proms.push(this.moveTile(tile, cellCenter(write, c).y, 0, 'Bounce.easeOut'));
        }
        write--;
      }
      for (let r = write; r >= 0; r--) {
        const kind = Math.floor(Math.random() * KINDS.length);
        this.grid[r][c] = kind;
        this.specials[r][c] = 'none';
        const startY = cellCenter(0, c).y - (write - r + 1) * TILE - 40;
        const tile = this.makeTile(r, c, kind, startY);
        this.tiles[r][c] = tile;
        proms.push(this.moveTile(tile, cellCenter(r, c).y, 0, 'Bounce.easeOut'));
      }
    }
    await Promise.all(proms);
  }

  private async reshuffle(): Promise<void> {
    this.popCombo(0, 'No moves — reshuffling!');
    this.grid = createGrid();
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      const old = this.tiles[r][c];
      if (old) { this.killTileTweens(old); old.destroy(); }
      this.specials[r][c] = 'none';
      this.tiles[r][c] = this.makeTile(r, c, this.grid[r][c], cellCenter(r, c).y - BOARD_H - 100);
    }
    const proms: Promise<void>[] = [];
    for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) {
      proms.push(this.moveTile(this.tiles[r][c]!, cellCenter(r, c).y, r * 30, 'Bounce.easeOut'));
    }
    await Promise.all(proms);
  }

  // ---------- score & combo ----------
  private addScore(points: number): void {
    this.score += points;
    // Persist a new personal best the moment it's beaten (survives reloads).
    if (this.score > this.best) {
      this.best = this.score;
      setBest(this.best);
    }
    this.tweens.addCounter({
      from: this.shown, to: this.score, duration: 300,
      onUpdate: (t) => { this.shown = Math.floor(t.getValue() ?? 0); this.scoreText.setText(String(this.shown)); },
    });
    this.tweens.add({ targets: this.scoreText, scale: { from: 1.35, to: 1 }, duration: 260, ease: 'Back.easeOut' });
  }

  private popCombo(mult: number, text?: string): void {
    this.comboText.setText(text ?? `COMBO x${mult}!`);
    this.comboText.setScale(0.4).setAlpha(1);
    this.tweens.add({ targets: this.comboText, scale: 1.15, duration: 220, ease: 'Back.easeOut' });
    this.tweens.add({ targets: this.comboText, alpha: 0, delay: 550, duration: 350 });
  }
}
