/** Boots the Phaser game and mounts it into #game. Menu is the first scene. */
import Phaser from 'phaser';
import { GAME_W, GAME_H } from './game/config';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';
import { WinScene } from './scenes/WinScene';
import { LoseScene } from './scenes/LoseScene';
import { startMusic } from './game/music';

const game = new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  backgroundColor: '#140a24',
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_W,
    height: GAME_H,
  },
  // MenuScene boots first; the rest are started/launched on demand.
  scene: [MenuScene, GameScene, PauseScene, SettingsScene, WinScene, LoseScene],
});

// Music may only begin inside a user gesture. Calling this on every primary
// pointerdown is safe: startMusic() is idempotent and checks both preferences.
document.getElementById('game')?.addEventListener('pointerdown', startMusic);

// Keep board drags inside the canvas on mobile: no page scroll, refresh or
// browser gesture should steal the touch sequence from Phaser.
const preventNativeGesture = (event: TouchEvent): void => event.preventDefault();
game.canvas.addEventListener('touchstart', preventNativeGesture, { passive: false });
game.canvas.addEventListener('touchmove', preventNativeGesture, { passive: false });
