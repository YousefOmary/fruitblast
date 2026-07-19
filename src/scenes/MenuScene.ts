/** Main hub for campaign continuation, fresh starts and alternate game modes. */

import Phaser from 'phaser';
import { GAME_W, GAME_H } from '../game/config';
import { COLORS, FONT_UI, paintBackground } from '../ui/theme';
import { makeButton } from '../ui/Button';
import {
  getBest, getDailyBest, getDailyStreak, getLastCampaign, getModeBest,
  hasCampaignProgress, resetCampaign, setLastCampaign, setLastMode,
} from '../game/storage';
import { dailyDate, type GameMode } from '../game/modes';
import { fadeIn, startSceneWithFade } from '../ui/transitions';
import { ensureFruitTextures, ensureIconTextures, fruitTexture, iconTexture } from '../ui/art';
import { REDUCED_MOTION } from '../ui/motion';

export class MenuScene extends Phaser.Scene {
  private overlay: Phaser.GameObjects.Container | null = null;

  constructor() { super('menu'); }

  create(): void {
    this.overlay = null;
    paintBackground(this);
    fadeIn(this);
    ensureFruitTextures(this);
    ensureIconTextures(this);

    for (let kind = 0; kind < 6; kind++) {
      this.add.image(190 + kind * 68, 92, fruitTexture(kind)).setDisplaySize(52, 52);
    }
    const title = this.add.text(GAME_W / 2, 190, 'FRUIT BLAST', {
      fontFamily: FONT_UI, fontSize: '70px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5).setShadow(0, 5, '#00000077', 10);
    if (!REDUCED_MOTION) this.tweens.add({ targets: title, scale: { from: 1, to: 1.025 }, yoyo: true, repeat: -1, duration: 1800, ease: 'Sine.easeInOut' });

    const today = dailyDate();
    this.add.text(GAME_W / 2, 270,
      `BEST ${getBest()}   ·   TIME ${getModeBest('time')}   ·   DAILY ${getDailyBest(today)}`,
      { fontFamily: FONT_UI, fontSize: '24px', fontStyle: '700', color: '#ffd23f', align: 'center' },
    ).setOrigin(0.5);
    this.add.image(285, 316, iconTexture('streak')).setDisplaySize(30, 30).setTint(0xffd23f);
    this.add.text(312, 316, `${getDailyStreak()}-DAY DAILY STREAK`, {
      fontFamily: FONT_UI, fontSize: '22px', fontStyle: '700', color: '#e7dcff',
    }).setOrigin(0, 0.5);

    const hasProgress = hasCampaignProgress();
    const campaignY = hasProgress ? 440 : 470;
    if (hasProgress) {
      const level = getLastCampaign();
      makeButton(this, GAME_W / 2, campaignY, `CONTINUE  ·  Level ${level + 1}`,
        () => this.launch('campaign', level),
        { width: 500, height: 100, fontSize: 36, bg: COLORS.primary, radius: 26, icon: 'play' });
    }

    makeButton(this, GAME_W / 2, hasProgress ? 555 : campaignY, 'NEW CAMPAIGN', () => {
      if (hasProgress) this.showResetConfirm();
      else this.startFreshCampaign();
    }, { width: 500, height: 88, fontSize: 33, bg: COLORS.secondary, icon: 'new' });

    const modesY = hasProgress ? 650 : 585;
    this.add.text(GAME_W / 2, modesY, 'CHOOSE A MODE', {
      fontFamily: FONT_UI, fontSize: '27px', fontStyle: '800', color: '#b9a7e6',
    }).setOrigin(0.5);

    makeButton(this, GAME_W / 2, modesY + 88, 'Endless / Zen', () => this.launch('endless'),
      { width: 500, height: 78, fontSize: 30, icon: 'endless' });
    makeButton(this, GAME_W / 2, modesY + 180, 'Time Attack  ·  120s', () => this.launch('time'),
      { width: 500, height: 78, fontSize: 30, icon: 'timer' });
    makeButton(this, GAME_W / 2, modesY + 272, 'Daily Challenge  ·  30 moves', () => this.launch('daily'),
      { width: 500, height: 78, fontSize: 28, icon: 'calendar' });

    makeButton(this, 205, 1125, 'Settings', () => this.scene.launch('settings'),
      { width: 280, height: 72, fontSize: 27, icon: 'settings' });
    makeButton(this, 515, 1125, 'How to play', () => this.toggleHowTo(),
      { width: 280, height: 72, fontSize: 27, icon: 'help' });
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
      fontFamily: FONT_UI, fontSize: '46px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);
    const body = this.add.text(GAME_W / 2, 590, 'Campaign levels and stars will reset.\nYour best scores stay safe.', {
      fontFamily: FONT_UI, fontSize: '27px', fontStyle: '600', color: '#e7dcff', align: 'center', lineSpacing: 8,
    }).setOrigin(0.5);
    const reset = makeButton(this, GAME_W / 2, 700, 'Reset & Start', () => this.startFreshCampaign(),
      { width: 330, height: 80, fontSize: 31, bg: COLORS.primary, icon: 'new' });
    const cancel = makeButton(this, GAME_W / 2, 790, 'Cancel', () => this.closeOverlay(),
      { width: 260, height: 66, fontSize: 27, icon: 'back' });
    container.add([dim, panel, heading, body, reset, cancel]);
    this.overlay = container;
  }

  private toggleHowTo(): void {
    if (this.overlay) { this.closeOverlay(); return; }
    const { container, panel, dim } = this.makePanel(600, 590);
    const heading = this.add.text(GAME_W / 2, 410, 'How to play', {
      fontFamily: FONT_UI, fontSize: '46px', fontStyle: '800', color: '#ffffff',
    }).setOrigin(0.5);
    const rules = this.add.text(GAME_W / 2, 635,
      'Swipe or tap two touching fruit.\nMatch 3+ to clear them.\n\n4 in a row makes a line rocket.\n5 in a row makes a colour bomb.\n\nCampaign has roomy, unique goals. Zen has no limit.\nTime Attack lasts 120 seconds.\nDaily gives everyone the same 30-move puzzle.',
      { fontFamily: FONT_UI, fontSize: '26px', fontStyle: '600', color: '#e7dcff', align: 'center', lineSpacing: 8 },
    ).setOrigin(0.5);
    const close = makeButton(this, GAME_W / 2, 885, 'Got it!', () => this.closeOverlay(),
      { width: 240, height: 72, bg: COLORS.primary, icon: 'check' });
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
