/** Boots the Phaser game and mounts it into #game. Menu is the first scene. */
import Phaser from 'phaser';
import { GAME_W, GAME_H } from './game/config';
import { MenuScene } from './scenes/MenuScene';
import { GameScene } from './scenes/GameScene';
import { PauseScene } from './scenes/PauseScene';
import { SettingsScene } from './scenes/SettingsScene';

new Phaser.Game({
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
  scene: [MenuScene, GameScene, PauseScene, SettingsScene],
});
