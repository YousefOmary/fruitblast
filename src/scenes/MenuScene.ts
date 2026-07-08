/**
 * The landing scene: big title, tagline, PLAY (→ game), a persisted best-score
 * readout, Settings (→ overlay) and a toggleable "How to play" panel. Rebuilt
 * from scratch on every entry, so the Best readout is always fresh after a run.
 */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS, paintBackground } from '../ui/theme';
import { makeButton } from '../ui/Button';
import { getBest, getUnlocked } from '../game/storage';
import { LEVEL_COUNT } from '../game/levels';

export class MenuScene extends Phaser.Scene {
  /** The How-to-play panel while open, so we can toggle it off. */
  private howto: Phaser.GameObjects.Container | null = null;

  constructor() {
    super('menu');
  }

  create(): void {
    this.howto = null;
    paintBackground(this);

    // Decorative fruit row up top for a splash of juice.
    this.add.text(GAME_W / 2, 150, '🍓 🍊 🍋 🥝 🫐 🍇', { fontSize: '46px' })
      .setOrigin(0.5).setAlpha(0.9);

    const title = this.add.text(GAME_W / 2, 320, 'FRUIT BLAST', {
      fontFamily: 'system-ui, sans-serif', fontSize: '78px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 5, '#00000077', 10);
    // Gentle breathing pulse on the title.
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.04 }, yoyo: true, repeat: -1, duration: 1400, ease: 'Sine.easeInOut' });

    this.add.text(GAME_W / 2, 402, 'Match 3+ to blast the fruit!', {
      fontFamily: 'system-ui', fontSize: '30px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);

    this.add.text(GAME_W / 2, 500, `Best: ${getBest()}`, {
      fontFamily: 'system-ui', fontSize: '40px', fontStyle: '800', color: '#ffd23f',
    }).setOrigin(0.5);

    // PLAY resumes at the furthest unlocked level (clamped to the last one once
    // the whole campaign is cleared, so it never points past the end).
    const startLevel = Math.min(getUnlocked(), LEVEL_COUNT - 1);
    this.add.text(GAME_W / 2, 560, `Level ${startLevel + 1} of ${LEVEL_COUNT}`, {
      fontFamily: 'system-ui', fontSize: '28px', fontStyle: '700', color: '#b9a7e6',
    }).setOrigin(0.5);

    makeButton(this, GAME_W / 2, 700, `▶  PLAY  (Lvl ${startLevel + 1})`, () => this.scene.start('game', { level: startLevel }),
      { width: 400, height: 116, fontSize: 44, bg: COLORS.primary, radius: 28 });

    makeButton(this, GAME_W / 2, 870, '⚙  Settings', () => this.scene.launch('settings'),
      { width: 320, height: 84 });

    makeButton(this, GAME_W / 2, 984, '?  How to play', () => this.toggleHowTo(),
      { width: 320, height: 72, fontSize: 28 });
  }

  /** Show or hide the rules overlay. */
  private toggleHowTo(): void {
    if (this.howto) {
      this.howto.destroy();
      this.howto = null;
      return;
    }

    // Full-screen interactive dimmer swallows taps so nothing behind reacts.
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.6)
      .setInteractive();

    const panel = this.add.graphics();
    const pw = 600, ph = 560, px = GAME_W / 2, py = GAME_H / 2;
    panel.fillStyle(COLORS.panel, 0.98);
    panel.fillRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 28);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect(px - pw / 2, py - ph / 2, pw, ph, 28);

    const heading = this.add.text(px, py - ph / 2 + 60, 'How to play', {
      fontFamily: 'system-ui, sans-serif', fontSize: '46px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);

    const rules = this.add.text(px, py - 20,
      'Swap two touching gems to\nline up 3 or more of a kind.\n\n' +
      '🍬  4 in a row  →  ROCKET\n(clears a whole line)\n\n' +
      '💥  5 in a row  →  COLOR BOMB\n(clears every gem of one colour)',
      {
        fontFamily: 'system-ui', fontSize: '30px', fontStyle: '600', color: '#e7dcff',
        align: 'center', lineSpacing: 8,
      }).setOrigin(0.5);

    const close = makeButton(this, px, py + ph / 2 - 60, 'Got it!', () => this.toggleHowTo(),
      { width: 240, height: 74, bg: COLORS.primary });

    this.howto = this.add.container(0, 0, [dim, panel, heading, rules, close]).setDepth(50);
  }
}
