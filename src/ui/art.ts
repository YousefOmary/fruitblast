/** Shared procedural fruit marks and geometric UI icons. No font glyphs or platform emoji. */
import Phaser from 'phaser';

export type IconName =
  | 'back' | 'calendar' | 'check' | 'copy' | 'endless' | 'help' | 'home'
  | 'loss' | 'music' | 'new' | 'next' | 'pause' | 'play' | 'restart'
  | 'settings' | 'soundOff' | 'soundOn' | 'streak' | 'target' | 'timer';

export const fruitTexture = (kind: number): string => `fruit-mark-${kind}`;
export const iconTexture = (name: IconName): string => `fruit-icon-${name}`;

export function ensureFruitTextures(scene: Phaser.Scene): void {
  for (let kind = 0; kind < 6; kind++) {
    const key = fruitTexture(kind);
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 72;
    canvas.height = 72;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    drawFruit(ctx, kind, 36, 37, 60);
    scene.textures.addCanvas(key, canvas)?.refresh();
  }
}

export function ensureIconTextures(scene: Phaser.Scene): void {
  const names: IconName[] = [
    'back', 'calendar', 'check', 'copy', 'endless', 'help', 'home', 'loss', 'music', 'new',
    'next', 'pause', 'play', 'restart', 'settings', 'soundOff', 'soundOn', 'streak', 'target', 'timer',
  ];
  for (const name of names) {
    const key = iconTexture(name);
    if (scene.textures.exists(key)) continue;
    const canvas = document.createElement('canvas');
    canvas.width = 64;
    canvas.height = 64;
    const ctx = canvas.getContext('2d');
    if (!ctx) continue;
    drawIcon(ctx, name);
    scene.textures.addCanvas(key, canvas)?.refresh();
  }
}

/** Draw one fruit at any Canvas 2D scale using a shared upper-left highlight. */
export function drawFruit(ctx: CanvasRenderingContext2D, kind: number, cx: number, cy: number, size: number): void {
  ctx.save();
  ctx.translate(cx, cy);
  ctx.scale(size / 64, size / 64);
  ctx.lineJoin = 'round';
  ctx.lineCap = 'round';
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#241238';

  if (kind === 0) drawStrawberry(ctx);
  else if (kind === 1) drawOrange(ctx);
  else if (kind === 2) drawLemon(ctx);
  else if (kind === 3) drawKiwi(ctx);
  else if (kind === 4) drawBlueberries(ctx);
  else drawGrapes(ctx);
  ctx.restore();
}

function drawStrawberry(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath();
  ctx.moveTo(0, 25); ctx.bezierCurveTo(-25, 8, -25, -17, -10, -20);
  ctx.bezierCurveTo(-4, -22, 0, -17, 0, -17); ctx.bezierCurveTo(0, -17, 5, -22, 11, -20);
  ctx.bezierCurveTo(26, -16, 24, 8, 0, 25); ctx.closePath();
  ctx.fillStyle = '#e82758'; ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#72c84b';
  ctx.beginPath(); ctx.moveTo(-17, -18); ctx.lineTo(-5, -27); ctx.lineTo(0, -17); ctx.lineTo(7, -29); ctx.lineTo(10, -17); ctx.lineTo(22, -19); ctx.lineTo(12, -9); ctx.lineTo(-12, -9); ctx.closePath(); ctx.fill(); ctx.stroke();
  ctx.fillStyle = '#ffe8a3';
  for (const [x, y] of [[-11,-5],[8,-5],[-6,7],[5,10],[0,18]] as const) { ctx.beginPath(); ctx.ellipse(x, y, 1.6, 3, 0, 0, Math.PI * 2); ctx.fill(); }
  fruitHighlight(ctx, -11, -11);
}

function drawOrange(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath(); ctx.arc(0, 2, 24, 0, Math.PI * 2); ctx.fillStyle = '#ff8b18'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(1, -22); ctx.quadraticCurveTo(6, -32, 18, -27); ctx.quadraticCurveTo(11, -18, 1, -19); ctx.fillStyle = '#69ba43'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.moveTo(0, -21); ctx.lineTo(2, -29); ctx.strokeStyle = '#5a4a28'; ctx.stroke();
  fruitHighlight(ctx, -10, -10);
  ctx.strokeStyle = 'rgba(255,232,173,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 2, 17, -1.2, -.15); ctx.stroke();
}

function drawLemon(ctx: CanvasRenderingContext2D): void {
  ctx.save(); ctx.rotate(-0.22);
  ctx.beginPath(); ctx.moveTo(-29, 0); ctx.quadraticCurveTo(-22, -4, -20, -11); ctx.bezierCurveTo(-8, -25, 15, -19, 22, -6); ctx.quadraticCurveTo(25, -2, 30, 0); ctx.quadraticCurveTo(24, 4, 22, 9); ctx.bezierCurveTo(10, 24, -13, 19, -21, 7); ctx.quadraticCurveTo(-23, 3, -29, 0); ctx.closePath();
  ctx.fillStyle = '#ffd53e'; ctx.fill(); ctx.stroke();
  ctx.restore();
  fruitHighlight(ctx, -8, -8);
  ctx.strokeStyle = 'rgba(255,255,220,.7)'; ctx.lineWidth = 2; ctx.beginPath(); ctx.arc(0, 0, 15, -2.6, -1.2); ctx.stroke();
}

function drawKiwi(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath(); ctx.ellipse(0, 1, 26, 23, -0.12, 0, Math.PI * 2); ctx.fillStyle = '#7b4c2c'; ctx.fill(); ctx.stroke();
  ctx.beginPath(); ctx.ellipse(0, 1, 21, 18, -0.12, 0, Math.PI * 2); ctx.fillStyle = '#6fd44c'; ctx.fill();
  ctx.beginPath(); ctx.ellipse(0, 1, 6, 12, -0.12, 0, Math.PI * 2); ctx.fillStyle = '#f5efbf'; ctx.fill();
  ctx.fillStyle = '#251b2b';
  for (let i = 0; i < 12; i++) { const a = (i / 12) * Math.PI * 2; ctx.beginPath(); ctx.ellipse(Math.cos(a) * 13, 1 + Math.sin(a) * 10, 1.2, 2.2, a, 0, Math.PI * 2); ctx.fill(); }
  fruitHighlight(ctx, -11, -8);
}

function drawBlueberries(ctx: CanvasRenderingContext2D): void {
  for (const [x, y, r] of [[-12,7,15],[12,8,15],[0,-8,17]] as const) { ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.fillStyle = y < 0 ? '#4777db' : '#3764c5'; ctx.fill(); ctx.stroke(); }
  ctx.fillStyle = '#223d86';
  for (const [x,y] of [[0,-8],[-12,7],[12,8]] as const) { ctx.beginPath(); for (let i=0;i<8;i++) { const a=i*Math.PI/4; const rr=i%2?3:7; const px=x+Math.cos(a)*rr, py=y+Math.sin(a)*rr; i===0?ctx.moveTo(px,py):ctx.lineTo(px,py); } ctx.closePath(); ctx.fill(); }
  fruitHighlight(ctx, -7, -15);
}

function drawGrapes(ctx: CanvasRenderingContext2D): void {
  ctx.beginPath(); ctx.moveTo(-3,-22); ctx.quadraticCurveTo(5,-33,18,-27); ctx.quadraticCurveTo(11,-18,1,-16); ctx.fillStyle='#68bd49'; ctx.fill(); ctx.stroke();
  const berries: Array<[number,number]> = [[-10,-10],[5,-11],[16,-3],[-16,2],[-2,3],[11,10],[-10,15],[2,22]];
  for (const [x,y] of berries) { ctx.beginPath(); ctx.arc(x,y,10,0,Math.PI*2); ctx.fillStyle = y > 8 ? '#7544c7' : '#8b52df'; ctx.fill(); ctx.stroke(); }
  fruitHighlight(ctx, -10, -13);
}

function fruitHighlight(ctx: CanvasRenderingContext2D, x: number, y: number): void {
  ctx.beginPath(); ctx.ellipse(x, y, 4, 8, -0.8, 0, Math.PI * 2); ctx.fillStyle = 'rgba(255,255,255,.46)'; ctx.fill();
}

function drawIcon(ctx: CanvasRenderingContext2D, name: IconName): void {
  ctx.save(); ctx.translate(32, 32); ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'; ctx.lineWidth = 4; ctx.lineCap = 'round'; ctx.lineJoin = 'round';
  const circle = (r: number): void => { ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.stroke(); };
  if (name === 'play' || name === 'next') { ctx.beginPath(); ctx.moveTo(-9,-15); ctx.lineTo(16,0); ctx.lineTo(-9,15); ctx.closePath(); ctx.stroke(); if (name === 'next') { ctx.beginPath(); ctx.moveTo(19,-15); ctx.lineTo(19,15); ctx.stroke(); } }
  else if (name === 'pause') { ctx.beginPath(); ctx.moveTo(-9,-15); ctx.lineTo(-9,15); ctx.moveTo(9,-15); ctx.lineTo(9,15); ctx.stroke(); }
  else if (name === 'home') { ctx.beginPath(); ctx.moveTo(-20,-2); ctx.lineTo(0,-19); ctx.lineTo(20,-2); ctx.moveTo(-15,-5); ctx.lineTo(-15,18); ctx.lineTo(15,18); ctx.lineTo(15,-5); ctx.moveTo(-5,18); ctx.lineTo(-5,5); ctx.lineTo(5,5); ctx.lineTo(5,18); ctx.stroke(); }
  else if (name === 'calendar') { ctx.strokeRect(-19,-16,38,35); ctx.beginPath(); ctx.moveTo(-19,-6); ctx.lineTo(19,-6); ctx.moveTo(-10,-22); ctx.lineTo(-10,-11); ctx.moveTo(10,-22); ctx.lineTo(10,-11); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-7,6); ctx.lineTo(-1,12); ctx.lineTo(11,0); ctx.stroke(); }
  else if (name === 'restart') { ctx.beginPath(); ctx.arc(1,1,18,-2.7,2.2); ctx.stroke(); ctx.beginPath(); ctx.moveTo(-18,-15); ctx.lineTo(-19,-2); ctx.lineTo(-7,-7); ctx.stroke(); }
  else if (name === 'back') { ctx.beginPath(); ctx.moveTo(8,-17); ctx.lineTo(-10,0); ctx.lineTo(8,17); ctx.stroke(); }
  else if (name === 'copy') { ctx.strokeRect(-12,-18,26,30); ctx.strokeRect(-19,-10,25,29); }
  else if (name === 'target') { circle(19); circle(10); ctx.beginPath(); ctx.moveTo(0,-24); ctx.lineTo(0,24); ctx.moveTo(-24,0); ctx.lineTo(24,0); ctx.stroke(); }
  else if (name === 'timer') { circle(18); ctx.beginPath(); ctx.moveTo(-7,-23); ctx.lineTo(7,-23); ctx.moveTo(0,-23); ctx.lineTo(0,-18); ctx.moveTo(0,0); ctx.lineTo(8,-9); ctx.stroke(); }
  else if (name === 'help') { circle(20); ctx.beginPath(); ctx.arc(0,-5,7,Math.PI,Math.PI*2.2); ctx.lineTo(0,7); ctx.moveTo(0,16); ctx.lineTo(0,17); ctx.stroke(); }
  else if (name === 'check') { ctx.beginPath(); ctx.moveTo(-18,1); ctx.lineTo(-5,14); ctx.lineTo(19,-14); ctx.stroke(); }
  else if (name === 'endless') { ctx.beginPath(); ctx.moveTo(-1,0); ctx.bezierCurveTo(-10,-18,-25,-13,-24,0); ctx.bezierCurveTo(-23,14,-8,17,1,0); ctx.bezierCurveTo(10,-17,25,-14,24,0); ctx.bezierCurveTo(23,13,10,18,-1,0); ctx.stroke(); }
  else if (name === 'soundOn' || name === 'soundOff') { ctx.beginPath(); ctx.moveTo(-20,-7); ctx.lineTo(-10,-7); ctx.lineTo(2,-18); ctx.lineTo(2,18); ctx.lineTo(-10,7); ctx.lineTo(-20,7); ctx.closePath(); ctx.stroke(); if (name === 'soundOn') { ctx.beginPath(); ctx.arc(3,0,12,-.8,.8); ctx.moveTo(6,-19); ctx.arc(6,0,20,-1.25,1.25); ctx.stroke(); } else { ctx.beginPath(); ctx.moveTo(9,-11); ctx.lineTo(24,11); ctx.moveTo(24,-11); ctx.lineTo(9,11); ctx.stroke(); } }
  else if (name === 'music') { ctx.beginPath(); ctx.moveTo(-6,11); ctx.lineTo(-6,-15); ctx.lineTo(17,-20); ctx.lineTo(17,6); ctx.moveTo(-6,-6); ctx.lineTo(17,-11); ctx.stroke(); ctx.beginPath(); ctx.ellipse(-13,13,8,6,-.25,0,Math.PI*2); ctx.ellipse(10,8,8,6,-.25,0,Math.PI*2); ctx.fill(); }
  else if (name === 'settings') { circle(8); for (let i=0;i<8;i++) { const a=i*Math.PI/4; ctx.beginPath(); ctx.moveTo(Math.cos(a)*15,Math.sin(a)*15); ctx.lineTo(Math.cos(a)*23,Math.sin(a)*23); ctx.stroke(); } }
  else if (name === 'streak') { ctx.beginPath(); ctx.moveTo(2,23); ctx.bezierCurveTo(-18,18,-20,2,-7,-11); ctx.bezierCurveTo(-6,-2,-1,1,2,4); ctx.bezierCurveTo(0,-10,9,-15,12,-23); ctx.bezierCurveTo(22,-5,22,15,2,23); ctx.stroke(); }
  else if (name === 'new') { ctx.strokeRect(-18,-17,25,31); ctx.strokeRect(-7,-10,25,31); ctx.beginPath(); ctx.moveTo(15,-22); ctx.lineTo(15,-13); ctx.moveTo(10,-17.5); ctx.lineTo(20,-17.5); ctx.stroke(); }
  else if (name === 'loss') { circle(20); ctx.beginPath(); ctx.moveTo(-10,9); ctx.quadraticCurveTo(0,-1,10,9); ctx.moveTo(-10,-7); ctx.lineTo(-5,-4); ctx.moveTo(10,-7); ctx.lineTo(5,-4); ctx.stroke(); }
  ctx.restore();
}
