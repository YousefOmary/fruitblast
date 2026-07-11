/** Result overlay for fixed-length Time Attack and Daily Challenge runs. */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import type { GameMode } from '../game/modes';
import { COLORS } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { afterFadeOut, fadeIn } from '../ui/transitions';

interface ResultData {
  mode: Extract<GameMode, 'time' | 'daily'>;
  score: number;
  best: number;
  streak?: number;
  title: string;
  subtitle: string;
}

/** Shows a score summary while keeping the settled board visible underneath. */
export class ResultScene extends Phaser.Scene {
  private dataValue: ResultData = {
    mode: 'time', score: 0, best: 0, title: 'RUN COMPLETE', subtitle: '',
  };

  constructor() { super('result'); }

  init(data: ResultData): void { this.dataValue = data; }

  create(): void {
    const data = this.dataValue;
    fadeIn(this);
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.7).setInteractive();
    const px = GAME_W / 2, py = GAME_H / 2, pw = 570, ph = 720;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.99);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);

    this.add.text(px, py - 280, data.title, {
      fontFamily: 'system-ui', fontSize: '48px', fontStyle: '800', color: '#ffffff', align: 'center',
    }).setOrigin(0.5).setShadow(0, 4, '#00000088', 8);
    this.add.text(px, py - 180, 'SCORE', {
      fontFamily: 'system-ui', fontSize: '24px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);
    const score = this.add.text(px, py - 105, '0', {
      fontFamily: 'system-ui', fontSize: '76px', fontStyle: '800', color: '#ffd23f',
    }).setOrigin(0.5);
    this.tweens.addCounter({
      from: 0, to: data.score, duration: 850, ease: 'Cubic.easeOut',
      onUpdate: (t) => score.setText(String(Math.floor(t.getValue() ?? 0))),
    });

    const details = data.mode === 'daily'
      ? `Today's best: ${data.best}   •   🔥 ${data.streak ?? 1}\n\n${data.subtitle}`
      : `Best: ${data.best}\n${data.subtitle}`;
    this.add.text(px, py + 30, details, {
      fontFamily: 'system-ui', fontSize: '27px', fontStyle: '700', color: '#e7dcff',
      align: 'center', lineSpacing: 8, wordWrap: { width: 490 },
    }).setOrigin(0.5);

    if (data.mode === 'daily') {
      const share = makeButton(this, px, py + 155, '📋  Copy result', () => {
        void navigator.clipboard?.writeText(data.subtitle).then(
          () => share.setLabel('✓  Copied!'),
          () => share.setLabel('Result shown above'),
        );
      }, { width: 350, height: 76, fontSize: 29, bg: COLORS.secondary });
    }

    makeButton(this, px, py + 255, '↻  Play again', () => this.restart(),
      { width: 360, height: 86, fontSize: 34, bg: COLORS.primary });
    makeButton(this, px, py + 345, '⌂  Home', () => this.home(),
      { width: 360, height: 74, fontSize: 30 });
  }

  private restart(): void {
    afterFadeOut(this, () => {
      this.scene.stop('game');
      this.scene.start('game', { mode: this.dataValue.mode });
      this.scene.stop();
    });
  }

  private home(): void {
    afterFadeOut(this, () => {
      this.scene.stop('game');
      this.scene.start('menu');
      this.scene.stop();
    });
  }
}
