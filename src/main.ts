/** Boots the Phaser game and mounts it into #game. */
import Phaser from 'phaser';
import { GAME_W, GAME_H } from './game/config';
import { GameScene } from './scenes/GameScene';

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
  scene: [GameScene],
});
