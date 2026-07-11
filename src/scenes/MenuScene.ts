/** Main hub for campaign continuation, fresh starts and alternate game modes. */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS, paintBackground } from '../ui/theme';
import { makeButton } from '../ui/Button';
import {
  getBest, getDailyBest, getDailyStreak, getLastCampaign, getModeBest,
  hasCampaignProgress, resetCampaign, setLastCampaign, setLastMode,
} from '../game/storage';
import { dailyDate, type GameMode } from '../game/modes';
import { fadeIn, startSceneWithFade } from '../ui/transitions';

export class MenuScene extends Phaser.Scene {
  private overlay: Phaser.GameObjects.Container | null = null;

  constructor() { super('menu'); }

  create(): void {
    this.overlay = null;
    paintBackground(this);
    fadeIn(this);

    this.add.text(GAME_W / 2, 92, '🍓 🍊 🍋 🥝 🫐 🍇', { fontSize: '38px' })
      .setOrigin(0.5).setAlpha(0.9);
    const title = this.add.text(GAME_W / 2, 190, 'FRUIT BLAST', {
      fontFamily: 'system-ui, sans-serif', fontSize: '70px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 5, '#00000077', 10);
    this.tweens.add({ targets: title, scale: { from: 1, to: 1.035 }, yoyo: true, repeat: -1, duration: 1500, ease: 'Sine.easeInOut' });

    const today = dailyDate();
    this.add.text(GAME_W / 2, 285,
      `Best ${getBest()}   •   Time ${getModeBest('time')}   •   Daily ${getDailyBest(today)}\n🔥 Daily streak: ${getDailyStreak()}`,
      { fontFamily: 'system-ui', fontSize: '25px', fontStyle: '700', color: '#ffd23f', align: 'center', lineSpacing: 8 },
    ).setOrigin(0.5);

    const hasProgress = hasCampaignProgress();
    const campaignY = hasProgress ? 440 : 470;
    if (hasProgress) {
      const level = getLastCampaign();
      makeButton(this, GAME_W / 2, campaignY, `▶  CONTINUE  •  Level ${level + 1}`,
        () => this.launch('campaign', level),
        { width: 500, height: 100, fontSize: 37, bg: COLORS.primary, radius: 26 });
    }

    makeButton(this, GAME_W / 2, hasProgress ? 555 : campaignY, '✦  NEW GAME', () => {
      if (hasProgress) this.showResetConfirm();
      else this.startFreshCampaign();
    }, { width: 500, height: 88, fontSize: 34, bg: COLORS.secondary });

    const modesY = hasProgress ? 650 : 585;
    this.add.text(GAME_W / 2, modesY, 'CHOOSE A MODE', {
      fontFamily: 'system-ui', fontSize: '27px', fontStyle: '800', color: '#b9a7e6',
    }).setOrigin(0.5);

    makeButton(this, GAME_W / 2, modesY + 88, '∞  Endless / Zen', () => this.launch('endless'),
      { width: 500, height: 78, fontSize: 30 });
    makeButton(this, GAME_W / 2, modesY + 180, '⏱  Time Attack  •  60s', () => this.launch('time'),
      { width: 500, height: 78, fontSize: 30 });
    makeButton(this, GAME_W / 2, modesY + 272, '📅  Daily Challenge  •  20 moves', () => this.launch('daily'),
      { width: 500, height: 78, fontSize: 29 });

    makeButton(this, 205, 1125, '⚙  Settings', () => this.scene.launch('settings'),
      { width: 280, height: 72, fontSize: 27 });
    makeButton(this, 515, 1125, '?  How to play', () => this.toggleHowTo(),
      { width: 280, height: 72, fontSize: 27 });
  }

  private launch(mode: GameMode, level = 0): void {
    setLastMode(mode);
    if (mode === 'campaign') setLastCampaign(level);
    startSceneWithFade(this, 'game', { mode, level });
  }

  private startFreshCampaign(): void {
    resetCampaign();
    this.launch('campaign', 0);
  }

  private showResetConfirm(): void {
    if (this.overlay) return;
    const { container, panel, dim } = this.makePanel(520, 390);
    const heading = this.add.text(GAME_W / 2, 500, 'Reset progress?', {
      fontFamily: 'system-ui', fontSize: '46px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);
    const body = this.add.text(GAME_W / 2, 590, 'Campaign levels and stars will reset.\nYour best scores stay safe.', {
      fontFamily: 'system-ui', fontSize: '27px', fontStyle: '600', color: '#e7dcff', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);
    const reset = makeButton(this, GAME_W / 2, 700, 'Reset & Start', () => this.startFreshCampaign(),
      { width: 330, height: 80, fontSize: 31, bg: COLORS.primary });
    const cancel = makeButton(this, GAME_W / 2, 790, 'Cancel', () => this.closeOverlay(),
      { width: 260, height: 66, fontSize: 27 });
    container.add([dim, panel, heading, body, reset, cancel]);
    this.overlay = container;
  }

  private toggleHowTo(): void {
    if (this.overlay) { this.closeOverlay(); return; }
    const { container, panel, dim } = this.makePanel(600, 590);
    const heading = this.add.text(GAME_W / 2, 410, 'How to play', {
      fontFamily: 'system-ui', fontSize: '46px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);
    const rules = this.add.text(GAME_W / 2, 635,
      'Swipe or tap two touching fruit.\nMatch 3+ to clear them.\n\n4 in a row  →  line rocket\n5 in a row  →  colour bomb\n\nCampaign has goals. Zen has no limit.\nTime Attack lasts 60 seconds.\nDaily gives everyone the same puzzle.',
      { fontFamily: 'system-ui', fontSize: '27px', fontStyle: '600', color: '#e7dcff', align: 'center', lineSpacing: 8 },
    ).setOrigin(0.5);
    const close = makeButton(this, GAME_W / 2, 885, 'Got it!', () => this.closeOverlay(),
      { width: 240, height: 72, bg: COLORS.primary });
    container.add([dim, panel, heading, rules, close]);
    this.overlay = container;
  }

  private makePanel(width: number, height: number): {
    container: Phaser.GameObjects.Container; panel: Phaser.GameObjects.Graphics; dim: Phaser.GameObjects.Rectangle;
  } {
    const dim = this.add.rectangle(GAME_W / 2, GAME_H / 2, GAME_W, GAME_H, 0x000000, 0.66).setInteractive();
    const panel = this.add.graphics();
    panel.fillStyle(COLORS.panel, 0.99);
    panel.fillRoundedRect((GAME_W - width) / 2, (GAME_H - height) / 2, width, height, 28);
    panel.lineStyle(3, 0xffffff, 0.14);
    panel.strokeRoundedRect((GAME_W - width) / 2, (GAME_H - height) / 2, width, height, 28);
    return { container: this.add.container(0, 0).setDepth(50), panel, dim };
  }

  private closeOverlay(): void { this.overlay?.destroy(); this.overlay = null; }
}
