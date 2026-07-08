/**
 * A reusable rounded-rect button: a Graphics pill + centred Text in a Container,
 * with hover-lift and press-shrink feedback consistent with the in-game buttons.
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
 * Build an interactive button at (x, y). `onClick` fires on pointer-up. The
 * container carries its own hit area, so it works whether the owning scene reads
 * input globally (GameScene) or per-object (menu/overlays).
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

  const c = scene.add.container(x, y, [g, txt]);
  c.setSize(w, h);
  c.setInteractive(new Phaser.Geom.Rectangle(-w / 2, -h / 2, w, h), Phaser.Geom.Rectangle.Contains);

  c.on('pointerover', () => scene.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Quad.easeOut' }));
  c.on('pointerout', () => scene.tweens.add({ targets: c, scale: 1, duration: 120, ease: 'Quad.easeOut' }));
  c.on('pointerdown', () => scene.tweens.add({ targets: c, scale: 0.94, duration: 80, ease: 'Quad.easeOut' }));
  c.on('pointerup', () => {
    scene.tweens.add({ targets: c, scale: 1.05, duration: 120, ease: 'Back.easeOut' });
    sfxSelect();
    onClick();
  });

  const btn = c as Button;
  btn.setLabel = (text: string): void => { txt.setText(text); };
  return btn;
}
