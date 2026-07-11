/**
 * Pure match-3 grid logic — no Phaser, no DOM. grid[row][col] holds a kind
 * index 0..KIND_COUNT-1, or -1 for an empty cell. Kept separate so it can be
 * unit-tested and reasoned about independently of the animated view.
 */

import { COLS, ROWS, KIND_COUNT } from './config.ts';

export type Grid = number[][];

/** A straight run of 3+ identical tiles (horizontal or vertical). */
export interface Run {
  kind: number;
  cells: Array<[number, number]>;
  /** True for a left-right run (clears a row), false for a top-bottom run. */
  horizontal: boolean;
}

/** Build a full board with NO pre-existing runs, so the first move is the player's. */
export function createGrid(random: () => number = Math.random, kindCount = KIND_COUNT): Grid {
  const colors = Math.max(3, Math.min(KIND_COUNT, Math.floor(kindCount)));
  const randKind = (): number => Math.floor(random() * colors);
  const grid: Grid = Array.from({ length: ROWS }, () => Array<number>(COLS).fill(-1));
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      let k = randKind();
      // Re-roll while it would complete a run of 3 with the two cells left/above.
      while (
        (c >= 2 && grid[r][c - 1] === k && grid[r][c - 2] === k) ||
        (r >= 2 && grid[r - 1][c] === k && grid[r - 2][c] === k)
      ) {
        k = randKind();
      }
      grid[r][c] = k;
    }
  }
  return grid;
}

/** Every horizontal and vertical run of 3+ identical, non-empty tiles. */
export function findRuns(grid: Grid): Run[] {
  const runs: Run[] = [];
  const scan = (line: Array<[number, number]>, horizontal: boolean): void => {
    let start = 0;
    for (let i = 1; i <= line.length; i++) {
      const [r0, c0] = line[start];
      const kind = grid[r0][c0];
      const same =
        i < line.length && kind >= 0 && grid[line[i][0]][line[i][1]] === kind;
      if (same) continue;
      if (i - start >= 3 && kind >= 0) runs.push({ kind, cells: line.slice(start, i), horizontal });
      start = i;
    }
  };
  for (let r = 0; r < ROWS; r++) {
    scan(Array.from({ length: COLS }, (_, c) => [r, c] as [number, number]), true);
  }
  for (let c = 0; c < COLS; c++) {
    scan(Array.from({ length: ROWS }, (_, r) => [r, c] as [number, number]), false);
  }
  return runs;
}

/** True if swapping (r1,c1)↔(r2,c2) would create at least one run. Non-mutating. */
export function swapMakesRun(grid: Grid, r1: number, c1: number, r2: number, c2: number): boolean {
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  const made = findRuns(grid).length > 0;
  [grid[r1][c1], grid[r2][c2]] = [grid[r2][c2], grid[r1][c1]];
  return made;
}

/** True if any adjacent swap on the board would create a run (a move exists). */
export function hasAnyMove(grid: Grid): boolean {
  for (let r = 0; r < ROWS; r++) {
    for (let c = 0; c < COLS; c++) {
      if (c + 1 < COLS && swapMakesRun(grid, r, c, r, c + 1)) return true;
      if (r + 1 < ROWS && swapMakesRun(grid, r, c, r + 1, c)) return true;
    }
  }
  return false;
}

/** Orthogonally adjacent test. */
export function adjacent(r1: number, c1: number, r2: number, c2: number): boolean {
  return Math.abs(r1 - r2) + Math.abs(c1 - c2) === 1;
}
