/**
 * The in-game pause overlay. Launched with scene.launch('pause') while the game
 * scene is scene.pause()'d — so the board's tweens, timers and input are all
 * frozen underneath. Offers Resume, Restart (full reset), Home and a live Sound
 * toggle. A full-screen interactive dimmer blocks any tap from leaking through.
 */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { getMuted, setMuted } from '../game/sound';

export class PauseScene extends Phaser.Scene {
  constructor() {
    super('pause');
  }

  create(): void {
    // Dimmer swallows every pointer event so the paused board never sees a tap.
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.62).setInteractive();

    const pw = 540, ph = 720, px = GAME_W / 2, py = GAME_H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.98);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);

    this.add.text(px, py - ph / 2 + 70, 'PAUSED', {
      fontFamily: 'system-ui, sans-serif', fontSize: '58px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000088', 8);

    makeButton(this, px, py - 150, '▶  Resume', () => {
      this.scene.resume('game');
      this.scene.stop();
    }, { width: 380, height: 96, fontSize: 40, bg: COLORS.primary });

    makeButton(this, px, py - 30, '↻  Restart', () => {
      // Full reset: stop the paused game and boot it fresh (create() re-inits all state).
      this.scene.stop('game');
      this.scene.start('game');
      this.scene.stop();
    }, { width: 380, height: 88 });

    makeButton(this, px, py + 80, '⌂  Home', () => {
      this.scene.stop('game');
      this.scene.start('menu');
      this.scene.stop();
    }, { width: 380, height: 88 });

    const sound = makeButton(this, px, py + ph / 2 - 80, this.soundLabel(), () => {
      setMuted(!getMuted());
      sound.setLabel(this.soundLabel());
    }, { width: 380, height: 84 });
  }

  private soundLabel(): string {
    return getMuted() ? '🔇  Sound: Off' : '🔊  Sound: On';
  }
}
