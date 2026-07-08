/**
 * Settings overlay, launched from the menu. Sound toggle is functional now;
 * Music toggle only persists the preference (actual playback lands in Phase 5 —
 * see TODO). Both settings survive a page reload via game/storage.
 */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { getMuted, setMuted } from '../game/sound';
import { getMusic, setMusic } from '../game/storage';

export class SettingsScene extends Phaser.Scene {
  constructor() {
    super('settings');
  }

  create(): void {
    // Dimmer blocks taps from reaching the menu buttons underneath.
    this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.62).setInteractive();

    const pw = 560, ph = 620, px = GAME_W / 2, py = GAME_H / 2;
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.98);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 30);

    this.add.text(px, py - ph / 2 + 70, 'SETTINGS', {
      fontFamily: 'system-ui, sans-serif', fontSize: '56px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 4, '#00000088', 8);

    const sound = makeButton(this, px, py - 70, this.soundLabel(), () => {
      setMuted(!getMuted());
      sound.setLabel(this.soundLabel());
    }, { width: 420, height: 92, fontSize: 36 });

    // TODO(Phase 5): start/stop the background music track when this flips.
    const music = makeButton(this, px, py + 50, this.musicLabel(), () => {
      setMusic(!getMusic());
      music.setLabel(this.musicLabel());
    }, { width: 420, height: 92, fontSize: 36 });

    makeButton(this, px, py + ph / 2 - 70, 'Back', () => this.scene.stop(),
      { width: 260, height: 80, bg: COLORS.primary });
  }

  private soundLabel(): string {
    return getMuted() ? '🔇  Sound: Off' : '🔊  Sound: On';
  }

  private musicLabel(): string {
    return getMusic() ? '🎵  Music: On' : '🎵  Music: Off';
  }
}
