import Phaser from 'phaser';
import { REDUCED_MOTION } from './motion';

const FADE_MS = 170;
const FADE_COLOR = { red: 20, green: 10, blue: 36 };

/** Give a newly-created scene a short, consistent soft entrance. */
export function fadeIn(scene: Phaser.Scene): void {
  // Phaser reuses scene instances, so a scene that faded out earlier can come
  // back with input still disabled — always re-enable it on entry.
  scene.input.enabled = true;
  if (!REDUCED_MOTION) scene.cameras.main.fadeIn(FADE_MS, FADE_COLOR.red, FADE_COLOR.green, FADE_COLOR.blue);
}

/** Fade the current scene, then run a navigation action exactly once. */
export function afterFadeOut(scene: Phaser.Scene, action: () => void): void {
  scene.input.enabled = false;
  if (REDUCED_MOTION) { action(); return; }
  let done = false;
  const run = (): void => { if (done) return; done = true; action(); };
  scene.cameras.main.once('camerafadeoutcomplete', run);
  // Fallback: if the fade-complete event never fires (already-faded camera,
  // interrupted tween, etc.), run anyway so input/navigation can't get stuck.
  scene.time.delayedCall(FADE_MS + 90, run);
  scene.cameras.main.fadeOut(FADE_MS, FADE_COLOR.red, FADE_COLOR.green, FADE_COLOR.blue);
}

/** Fade from the current scene into another Phaser scene. */
export function startSceneWithFade(scene: Phaser.Scene, key: string, data?: object): void {
  afterFadeOut(scene, () => scene.scene.start(key, data));
}
