/** Boots the Phaser game and mounts it into #game. Menu is the first scene. */
import Phaser from 'phaser';
import { GAME_W, GAME_H } from './game/config';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { WinScene } from './scenes/WinScene';
import { LoseScene } from './scenes/LoseScene';
import { ResultScene } from './scenes/ResultScene';
import { startMusic } from './game/music';

async function loadLocalFont(): Promise<void> {
  if (!('FontFace' in window)) return;
  const url = new URL('./assets/manrope-latin.woff2', import.meta.url).href;
  const face = new FontFace('Fruit Sans', `url(${url}) format('woff2')`, { weight: '200 800', style: 'normal' });
  const load = face.load().then((loaded) => { document.fonts.add(loaded); });
  await Promise.race([load, new Promise<void>((resolve) => window.setTimeout(resolve, 1200))]).catch(() => undefined);
}

async function boot(): Promise<void> {
  await loadLocalFont();
  const game = new Phaser.Game({
    type: Phaser.AUTO,
    parent: 'game',
    backgroundColor: '#140a24',
    render: { powerPreference: 'high-performance', roundPixels: true },
    fps: { target: 60, forceSetTimeOut: false },
    scale: {
      mode: Phaser.Scale.FIT,
      autoCenter: Phaser.Scale.CENTER_BOTH,
      width: GAME_W,
      height: GAME_H,
    },
    scene: [MenuScene, GameScene, PauseScene, SettingsScene, WinScene, LoseScene, ResultScene],
  });

  // Music may only begin inside a user gesture. Calling this on every primary
  // pointerdown is safe: startMusic() is idempotent and checks preferences.
  document.getElementById('game')?.addEventListener('pointerdown', startMusic);
  const preventNativeGesture = (event: TouchEvent): void => event.preventDefault();
  game.canvas.addEventListener('touchstart', preventNativeGesture, { passive: false });
  game.canvas.addEventListener('touchmove', preventNativeGesture, { passive: false });
}

void boot();
