/**
 * Shared visual language for the shell scenes (menu / pause / settings) so they
 * match the in-game dark-purple-gradient + vibrant look. Pure Phaser Graphics &
 * Text — no image files.
 */

import Phaser from 'phaser';
import { GAME_W } from '../game/config';

/** The palette every scene draws from. Mirrors the gem/HUD colours in-game. */
export const COLORS = {
  bgTop: 0x241245,
  bgBottom: 0x120826,
  accent: 0xffd23f, // score yellow
  subtitle: 0xb9a7e6, // muted lilac label
  primary: 0xff3b6b, // strawberry — the PLAY call-to-action
  secondary: 0x3a2568, // muted purple — normal buttons
  panel: 0x1b1030, // overlay panel fill (same as bomb gem)
} as const;

/** Loaded locally before Phaser boots; fallbacks never require a network request. */
export const FONT_UI = "'Fruit Sans', system-ui, sans-serif";

/** Paint the full-screen purple gradient used by every scene. */
export function paintBackground(scene: Phaser.Scene): void {
  const g = scene.add.graphics();
  g.fillGradientStyle(COLORS.bgTop, COLORS.bgTop, COLORS.bgBottom, COLORS.bgBottom, 1);
  g.fillRect(0, 0, GAME_W, scene.scale.height);
}
