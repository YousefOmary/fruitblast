import Phaser from 'phaser';

const FADE_MS = 170;
const FADE_COLOR = { red: 20, green: 10, blue: 36 };

/** Give a newly-created scene a short, consistent soft entrance. */
export function fadeIn(scene: Phaser.Scene): void {
  scene.cameras.main.fadeIn(FADE_MS, FADE_COLOR.red, FADE_COLOR.green, FADE_COLOR.blue);
}

/** Fade the current scene, then run a navigation action exactly once. */
export function afterFadeOut(scene: Phaser.Scene, action: () => void): void {
  scene.input.enabled = false;
  scene.cameras.main.once('camerafadeoutcomplete', action);
  scene.cameras.main.fadeOut(FADE_MS, FADE_COLOR.red, FADE_COLOR.green, FADE_COLOR.blue);
}

/** Fade from the current scene into another Phaser scene. */
export function startSceneWithFade(scene: Phaser.Scene, key: string, data?: object): void {
  afterFadeOut(scene, () => scene.scene.start(key, data));
}
