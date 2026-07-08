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

/** One matchable kind: a vibrant gem colour plus a fruit glyph. */
export interface TileKind {
  color: number;
  glyph: string;
}

/** Six kinds — the standard match-3 count for a fair difficulty. */
export const KINDS: TileKind[] = [
  { color: 0xff3b6b, glyph: '🍓' },
  { color: 0xff9f1c, glyph: '🍊' },
  { color: 0xffd23f, glyph: '🍋' },
  { color: 0x33d9a6, glyph: '🥝' },
  { color: 0x5b8cff, glyph: '🫐' },
  { color: 0xb06bff, glyph: '🍇' },
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

/** Pixel centre of the cell at (row, col). */
export function cellCenter(row: number, col: number): { x: number; y: number } {
  return {
    x: BOARD_X + col * TILE + TILE / 2,
    y: BOARD_Y + row * TILE + TILE / 2,
  };
}
