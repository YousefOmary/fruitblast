/**
 * Victory overlay, launched over the paused GameScene when a level's goal is
 * met. Celebrates with raining multi-colour confetti, a staggered star reveal,
 * a score count-up and the win fanfare, then offers Next (advance a level) or
 * Home. The campaign is endless, so Next is always available.
 *
 * Launched via scene.launch('win', data) with GameScene paused underneath, so
 * the settled board stays visible behind the dimmer.
 */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { sfxWin } from '../game/sound';
import { afterFadeOut, fadeIn } from '../ui/transitions';

/** Payload from GameScene describing the level just cleared. */
interface WinData {
  level: number;
  score: number;
  stars: number;
}

const STAR_COLOR = 0xffd23f;

export class WinScene extends Phaser.Scene {
  private level = 0;
  private score = 0;
  private stars = 0;

  constructor() {
    super('win');
  }

  init(data: WinData): void {
    this.level = data.level ?? 0;
    this.score = data.score ?? 0;
    this.stars = Phaser.Math.Clamp(data.stars ?? 0, 0, 3);
  }

  create(): void {
    fadeIn(this);

    // Dimmer swallows taps so the frozen board can't be poked.
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.68).setInteractive();

    const pw = 560, ph = 760, px = GAME_W / 2, py = GAME_H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.98);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);

    this.add.text(px, py - ph / 2 + 80, 'Level Complete!', {
      fontFamily: 'system-ui, sans-serif', fontSize: '54px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000088', 8);

    // ----- star reveal: three sockets, then pop earned stars in one-by-one -----
    this.buildStars(px, py - 150);

    // ----- score count-up -----
    this.add.text(px, py + 30, 'SCORE', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);
    const scoreText = this.add.text(px, py + 84, '0', {
      fontFamily: 'system-ui', fontSize: '68px', fontStyle: '800', color: '#ffd23f',
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: this.score, duration: 900, delay: 300, ease: 'Cubic.easeOut',
      onUpdate: (t) => scoreText.setText(String(Math.floor(t.getValue() ?? 0))),
    });

    // ----- buttons -----
    makeButton(this, px, py + ph / 2 - 150, '▶  Next', () => {
      afterFadeOut(this, () => {
        this.scene.stop('game');
        this.scene.start('game', { mode: 'campaign', level: this.level + 1 });
        this.scene.stop();
      });
    }, { width: 360, height: 96, fontSize: 42, bg: COLORS.primary });

    makeButton(this, px, py + ph / 2 - 50, '⌂  Home', () => this.goHome(),
      { width: 360, height: 84 });

    // ----- celebration: fanfare + confetti -----
    sfxWin();
    this.rainConfetti();
  }

  private goHome(): void {
    afterFadeOut(this, () => {
      this.scene.stop('game');
      this.scene.start('menu');
      this.scene.stop();
    });
  }

  /** Three star sockets centred on (cx, cy); earned ones pop in on a stagger. */
  private buildStars(cx: number, cy: number): void {
    const gap = 130, size = 46;
    for (let i = 0; i < 3; i++) {
      const x = cx + (i - 1) * gap;
      // Dim socket always visible so the player sees what they missed.
      this.add.text(x, cy, '★', { fontSize: `${size + 12}px`, color: '#3a2568' }).setOrigin(0.5);
      if (i >= this.stars) continue;
      const star = this.add.text(x, cy, '★', { fontSize: `${size + 12}px`, color: '#ffd23f' })
        .setOrigin(0.5).setScale(0).setShadow(0, 3, '#00000088', 6);
      this.tweens.add({
        targets: star, scale: 1, duration: 380, delay: 450 + i * 260, ease: 'Back.easeOut',
        onStart: () => this.starPop(x, cy),
      });
    }
  }

  /** A little burst behind a star as it lands. */
  private starPop(x: number, y: number): void {
    if (!this.textures.exists('spark')) return;
    const e = this.add.particles(0, 0, 'spark', {
      speed: { min: 80, max: 220 }, lifespan: 520, scale: { start: 0.9, end: 0 },
      quantity: 1, emitting: false, tint: STAR_COLOR, blendMode: 'ADD',
    }).setDepth(30);
    e.explode(16, x, y);
    this.time.delayedCall(560, () => e.destroy());
  }

  /** Multi-colour confetti raining from above the panel for a few seconds. */
  private rainConfetti(): void {
    if (!this.textures.exists('spark')) return;
    const tints = [0xff3b6b, 0xff9f1c, 0xffd23f, 0x33d9a6, 0x5b8cff, 0xb06bff];
    const e = this.add.particles(0, -20, 'spark', {
      x: { min: 0, max: GAME_W },
      speedY: { min: 180, max: 340 },
      speedX: { min: -60, max: 60 },
      lifespan: 2600,
      scale: { min: 0.5, max: 1.1 },
      rotate: { min: 0, max: 360 },
      gravityY: 120,
      quantity: 4,
      frequency: 40,
      tint: tints,
    }).setDepth(40);
    // Rain for a burst, then stop emitting and clean up once the last falls out.
    this.time.delayedCall(1800, () => e.stop());
    this.time.delayedCall(1800 + 2700, () => e.destroy());
  }
}
