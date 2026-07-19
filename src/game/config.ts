/** Board dimensions, tile kinds, and the candy palette. Pure data. */

/** Portrait design resolution; Phaser scales it to fit any screen. */
export const GAME_W = 720;
export const GAME_H = 1280;

export const COLS = 8;
export const ROWS = 8;
export const TILE = 78;
export const BOARD_W = COLS * TILE;
export const BOARD_H = ROWS * TILE;
export const BOARD_X = (GAME_W - BOARD_W) / 2;
export const BOARD_Y = 360;

/** Minimum drag distance that distinguishes a swipe from a slightly wobbly tap. */
export const SWIPE_THRESHOLD = TILE * 0.35;

/**
 * Resolve a board drag to exactly one orthogonal neighbour.
 *
 * Short drags remain taps, the dominant axis wins for diagonal drags, and a
 * swipe that points beyond the board returns null.
 */
export function swipeTarget(
  fromR: number,
  fromC: number,
  dx: number,
  dy: number,
): { r: number; c: number } | null {
  if (Math.hypot(dx, dy) < SWIPE_THRESHOLD) return null;

  const target = Math.abs(dx) >= Math.abs(dy)
    ? { r: fromR, c: fromC + Math.sign(dx) }
    : { r: fromR + Math.sign(dy), c: fromC };

  return target.r >= 0 && target.r < ROWS && target.c >= 0 && target.c < COLS
    ? target
    : null;
}

/** One matchable kind: a vibrant identifier colour plus an accessible fruit name. */
export interface TileKind {
  color: number;
  name: string;
}

/** Six kinds — the standard match-3 count for a fair difficulty. */
export const KINDS: TileKind[] = [
  { color: 0xff3b6b, name: 'Strawberries' },
  { color: 0xff9f1c, name: 'Oranges' },
  { color: 0xffd23f, name: 'Lemons' },
  { color: 0x33d9a6, name: 'Kiwis' },
  { color: 0x5b8cff, name: 'Blueberries' },
  { color: 0xb06bff, name: 'Grapes' },
];

export const KIND_COUNT = KINDS.length;

/**
 * A power-up carried by a tile. 'none' is an ordinary gem; 'lineH'/'lineV'
 * clear a full row/column when detonated; 'bomb' clears every tile of one
 * colour. Specials live on the scene (see GameScene.specials) in lock-step
 * with the pure kind grid — matchLogic never sees them.
 */
export type Special = 'none' | 'lineH' | 'lineV' | 'bomb';

/** Points per tile cleared (multiplied by the cascade step). */
export const TILE_POINTS = 20;

/** Bonus awarded for forging a special tile from a 4+ match. */
export const SPECIAL_CREATE_POINTS = 60;

/** Bonus awarded each time a special tile detonates. */
export const SPECIAL_DETONATE_POINTS = 50;

/** Central gameplay motion tuning. Simple swaps resolve in roughly 0.8 seconds. */
export const ANIM = {
  initialFall: 380,
  fall: 350,
  swap: 205,
  pop: 175,
  specialForge: 250,
  cascadeBeat: 75,
  selectionPulse: 420,
  invalidShake: 120,
  beam: 340,
  bombFlash: 420,
  bombRing: 480,
  scoreCount: 300,
  scorePulse: 260,
  comboIn: 220,
  comboHold: 550,
  comboOut: 350,
  fallEase: 'Back.easeOut',
  swapEase: 'Sine.easeInOut',
  popEase: 'Quad.easeOut',
} as const;

/** Pixel centre of the cell at (row, col). */
export function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + col * TILE + TILE / 2,
    y: BOARD_Y + row * TILE + TILE / 2,
  };
}
