/**
 * Defeat overlay, launched over the paused GameScene when moves hit 0 with the
 * goal unmet. Shows the goal that was missed and how far the player got, then
 * offers Retry (restart the same level fresh) or Home.
 *
 * Launched via scene.launch('lose', data) with GameScene paused underneath.
 */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { afterFadeOut, fadeIn } from '../ui/transitions';

/** Payload from GameScene: which level, and the goal-progress readout at defeat. */
interface LoseData {
  level: number;
  goalText: string;
  progressText: string;
}

export class LoseScene extends Phaser.Scene {
  private level = 0;
  private goalText = '';
  private progressText = '';

  constructor() {
    super('lose');
  }

  init(data: LoseData): void {
    this.level = data.level ?? 0;
    this.goalText = data.goalText ?? '';
    this.progressText = data.progressText ?? '';
  }

  create(): void {
    fadeIn(this);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.68).setInteractive();

    const pw = 560, ph = 620, px = GAME_W / 2, py = GAME_H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.98);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);

    this.add.text(px, py - ph / 2 + 90, 'Out of moves', {
      fontFamily: 'system-ui, sans-serif', fontSize: '54px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000088', 8);

    this.add.text(px, py - 60, '😔', { fontSize: '86px' }).setOrigin(0.5);

    this.add.text(px, py + 40, `${this.goalText}\n${this.progressText}`, {
      fontFamily: 'system-ui', fontSize: '32px', fontStyle: '700', color: '#e7dcff',
      align: 'center', lineSpacing: 10,
    }).setOrigin(0.5);

    makeButton(this, px, py + ph / 2 - 150, '↻  Retry', () => {
      // Fresh restart of the same level — GameScene.create() re-inits all state.
      afterFadeOut(this, () => {
        this.scene.stop('game');
        this.scene.start('game', { level: this.level });
        this.scene.stop();
      });
    }, { width: 360, height: 96, fontSize: 42, bg: COLORS.primary });

    makeButton(this, px, py + ph / 2 - 50, '⌂  Home', () => {
      afterFadeOut(this, () => {
        this.scene.stop('game');
        this.scene.start('menu');
        this.scene.stop();
      });
    }, { width: 360, height: 84 });
  }
}
