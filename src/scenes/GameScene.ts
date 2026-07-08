/**
 * The playable board: renders the grid as gem tiles, handles swap input, and
 * runs the animated match → clear → gravity → cascade loop with particles,
 * screen shake, combo scoring and sound. This is the "juice" layer; all the
 * rules live in game/matchLogic.ts.
 */

import Phaser from 'phaser';
import {
  BOARD_X, BOARD_Y, BOARD_W, BOARD_H, COLS, ROWS, TILE, KINDS, TILE_POINTS,
  GAME_W, cellCenter,
} from '../game/config';
import { createGrid, findRuns, swapMakesRun, hasAnyMove, adjacent, type Grid } from '../game/matchLogic';
import { sfxSelect, sfxSwap, sfxInvalid, sfxMatch } from '../game/sound';

type Tile = Phaser.GameObjects.Container;

export class GameScene extends Phaser.Scene {
  private grid: Grid = [];
  private tiles: (Tile | null)[][] = [];
  private selected: { r: number; c: number } | null = null;
  private busy = true;
  private score = 0;
  private shown = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private comboText!: Phaser.GameObjects.Text;
  private ring!: Phaser.GameObjects.Graphics;

  constructor() {
    super('game');
  }

  create(): void {
    this.buildBackground();
    this.buildHud();
    this.makeSparkTexture();

    this.ring = this.add.graphics().setDepth(5).setVisible(false);
    this.ring.lineStyle(5, 0xffffff, 0.95);
    this.ring.strokeRoundedRect(-TILE / 2, -TILE / 2, TILE, TILE, 16);
    this.tweens.add({ targets: this.ring, scale: { from: 1, to: 1.08 }, yoyo: true, repeat: -1, duration: 420 });

    this.grid = createGrid();
    this.tiles = Array.from({ length: ROWS }, () => Array<Tile | null>(COLS).fill(null));
    this.spawnInitialTiles();

    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => this.onPointer(p.x, p.y));
    (window as unknown as { __scene: GameScene }).__scene = this;
  }

  /** Debug snapshot (temporary). */
  debugInfo(): Record<string, unknown> {
    return {
      busy: this.busy,
      row0y: this.tiles[0][0]?.y,
      row7y: this.tiles[7][0]?.y,
      expectedRow0: cellCenter(0, 0).y,
      expectedRow7: cellCenter(7, 0).y,
      activeTweens: this.tweens.getTweens().length,
    };
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
    this.add.text(GAME_W / 2, 90, 'FRUIT BLAST', {
      fontFamily: 'system-ui, sans-serif', fontSize: '58px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000066', 8);
    this.add.text(GAME_W / 2, 176, 'SCORE', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);
    this.scoreText = this.add.text(GAME_W / 2, 230, '0', {
      fontFamily: 'system-ui', fontSize: '64px', fontStyle: '800', color: '#ffd23f',
    }).setOrigin(0.5);
    this.comboText = this.add.text(GAME_W / 2, BOARD_Y + BOARD_H / 2, '', {
      fontFamily: 'system-ui', fontSize: '72px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setDepth(20).setAlpha(0).setShadow(0, 4, '#000000aa', 10);
  }

  private makeSparkTexture(): void {
    const g = this.add.graphics();
    g.fillStyle(0xffffff, 1);
    g.fillCircle(9, 9, 9);
    g.generateTexture('spark', 18, 18);
    g.destroy();
  }

  // ---------- tiles ----------
  private makeTile(r: number, c: number, kind: number, startY: number): Tile {
    const { x } = cellCenter(r, c);
    const { color, glyph } = KINDS[kind];
    const gem = this.add.graphics();
    gem.fillStyle(color, 1);
    gem.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, TILE - 10, 16);
    gem.fillStyle(0xffffff, 0.22);
    gem.fillRoundedRect(-TILE / 2 + 5, -TILE / 2 + 5, TILE - 10, (TILE - 10) / 2, 16);
    const label = this.add.text(0, 2, glyph, { fontSize: '40px' }).setOrigin(0.5);
    const tile = this.add.container(x, startY, [gem, label]);
    tile.setData('kind', kind);
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

  // ---------- input ----------
  private cellAt(x: number, y: number): { r: number; c: number } | null {
    const c = Math.floor((x - BOARD_X) / TILE);
    const r = Math.floor((y - BOARD_Y) / TILE);
    return r >= 0 && r < ROWS && c >= 0 && c < COLS ? { r, c } : null;
  }

  private onPointer(x: number, y: number): void {
    if (this.busy) return;
    const cell = this.cellAt(x, y);
    if (!cell) return;
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
    const ta = this.tiles[a.r][a.c]!, tb = this.tiles[b.r][b.c]!;
    const pa = cellCenter(a.r, a.c), pb = cellCenter(b.r, b.c);
    sfxSwap();
    if (swapMakesRun(this.grid, a.r, a.c, b.r, b.c)) {
      [this.grid[a.r][a.c], this.grid[b.r][b.c]] = [this.grid[b.r][b.c], this.grid[a.r][a.c]];
      this.tiles[a.r][a.c] = tb; this.tiles[b.r][b.c] = ta;
      await Promise.all([this.slideTile(ta, pb.x, pb.y), this.slideTile(tb, pa.x, pa.y)]);
      await this.resolve();
      if (!hasAnyMove(this.grid)) await this.reshuffle();
    } else {
      sfxInvalid();
      await Promise.all([this.slideTile(ta, pb.x, pb.y), this.slideTile(tb, pa.x, pa.y)]);
      await Promise.all([this.slideTile(ta, pa.x, pa.y), this.slideTile(tb, pb.x, pb.y)]);
      this.cameras.main.shake(120, 0.006);
    }
    this.busy = false;
  }

  // ---------- match resolution ----------
  private async resolve(): Promise<void> {
    for (let step = 0; ; step++) {
      const runs = findRuns(this.grid);
      if (runs.length === 0) break;
      const cleared = new Set<string>();
      for (const run of runs) for (const [r, c] of run.cells) cleared.add(`${r},${c}`);

      this.addScore(cleared.size * TILE_POINTS * (step + 1));
      if (step >= 1) this.popCombo(step + 1);
      sfxMatch(step);
      this.cameras.main.shake(140, Math.min(0.004 + cleared.size * 0.0006, 0.02));

      const pops: Promise<void>[] = [];
      for (const key of cleared) {
        const [r, c] = key.split(',').map(Number);
        const tile = this.tiles[r][c];
        if (tile) { this.burst(tile.x, tile.y, KINDS[this.grid[r][c]].color); pops.push(this.popTile(tile)); }
        this.tiles[r][c] = null;
        this.grid[r][c] = -1;
      }
      await Promise.all(pops);
      await this.collapse();
    }
  }

  private popTile(tile: Tile): Promise<void> {
    return new Promise((res) => {
      this.tweens.add({
        targets: tile, scale: 1.4, alpha: 0, duration: 200, ease: 'Back.easeIn',
        onComplete: () => { tile.destroy(); res(); },
      });
    });
  }

  private burst(x: number, y: number, color: number): void {
    const e = this.add.particles(0, 0, 'spark', {
      speed: { min: 70, max: 260 }, lifespan: 460, scale: { start: 1, end: 0 },
      quantity: 1, emitting: false, tint: color, blendMode: 'ADD',
    }).setDepth(15);
    e.explode(14, x, y);
    this.time.delayedCall(500, () => e.destroy());
  }

  /** Drop surviving tiles into gaps and spawn new ones from above. */
  private async collapse(): Promise<void> {
    const proms: Promise<void>[] = [];
    for (let c = 0; c < COLS; c++) {
      let write = ROWS - 1;
      for (let r = ROWS - 1; r >= 0; r--) {
        if (this.grid[r][c] < 0) continue;
        if (r !== write) {
          this.grid[write][c] = this.grid[r][c]; this.grid[r][c] = -1;
          const tile = this.tiles[r][c]!; this.tiles[write][c] = tile; this.tiles[r][c] = null;
          proms.push(this.moveTile(tile, cellCenter(write, c).y, 0, 'Bounce.easeOut'));
        }
        write--;
      }
      for (let r = write; r >= 0; r--) {
        const kind = Math.floor(Math.random() * KINDS.length);
        this.grid[r][c] = kind;
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
      this.tiles[r][c]?.destroy();
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
