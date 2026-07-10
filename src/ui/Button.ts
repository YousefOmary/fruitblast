/**
 * A reusable rounded-rect button: a fixed hit-area Container around a separately
 * tweened Graphics pill + centred Text, with hover and press-shrink feedback.
 * Returns a Button (a Container augmented with setLabel) so callers can retitle
 * toggles like "Sound: On" ↔ "Sound: Off" in place.
 */

import Phaser from 'phaser';
import { COLORS } from './theme';
import { sfxSelect } from '../game/sound';

/** Look/size overrides for a single button. */
export interface ButtonOpts {
  width?: number;
  height?: number;
  fontSize?: number;
  bg?: number;
  textColor?: string;
  radius?: number;
}

/** A Container that also lets you swap its label text (used by toggles). */
export interface Button extends Phaser.GameObjects.Container {
  setLabel(text: string): void;
}

/**
 * Build an interactive button at (x, y). `onClick` fires on pointer-down. The
 * outer container carries an unscaled hit area, so visual feedback never changes
 * where it can be pressed and global scene input remains independent.
 */
export function makeButton(
  scene: Phaser.Scene,
  x: number,
  y: number,
  label: string,
  onClick: () => void,
  opts: ButtonOpts = {},
): Button {
  const w = opts.width ?? 300;
  const h = opts.height ?? 84;
  const r = opts.radius ?? 20;
  const bg = opts.bg ?? COLORS.secondary;
  const fs = opts.fontSize ?? 34;

  const g = scene.add.graphics();
  g.fillStyle(bg, 1);
  g.fillRoundedRect(-w / 2, -h / 2, w, h, r);
  g.lineStyle(3, 0xffffff, 0.18);
  g.strokeRoundedRect(-w / 2, -h / 2, w, h, r);

  const txt = scene.add.text(0, 0, label, {
    fontFamily: 'system-ui, sans-serif', fontSize: `${fs}px`, fontStyle: '800',
    color: opts.textColor ?? '#ffffff',
  }).setOrigin(0.5).setShadow(0, 2, '#00000055', 4);

  // Phaser normalizes input coordinates by a Container's display origin before
  // invoking its hit-area callback. With setSize(w, h), the correct custom
  // rectangle is therefore 0..w / 0..h, even though centered children draw at
  // -w/2..w/2. Keep that input owner at scale 1 and tween only `visual` so the
  // tappable bounds never shrink, grow, or move during feedback animation.
  const visual = scene.add.container(0, 0, [g, txt]);
  const c = scene.add.container(x, y, [visual]);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(0, 0, w, h), Phaser.Geom.Rectangle.Contains);

  c.on('pointerover', () => scene.tweens.add({ targets: visual, scale: 1.05, duration: 120, ease: 'Quad.easeOut' }));
  c.on('pointerout', () => scene.tweens.add({ targets: visual, scale: 1, duration: 120, ease: 'Quad.easeOut' }));
  // Fire on pointerDOWN for instant touch response (pointerup feels laggy on
  // mobile). A guard stops an accidental double-fire within the same tap.
  let firing = false;
  c.on('pointerdown', () => {
    if (firing) return;
    firing = true;
    scene.tweens.add({
      targets: visual, scale: 0.94, duration: 70, ease: 'Quad.easeOut',
      yoyo: true, onComplete: () => scene.tweens.add({ targets: visual, scale: 1, duration: 90 }),
    });
    sfxSelect();
    onClick();
    scene.time.delayedCall(220, () => { firing = false; });
  });

  const btn = c as Button;
  btn.setLabel = (text: string): void => { txt.setText(text); };
  return btn;
}
