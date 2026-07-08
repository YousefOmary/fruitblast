/**
 * Level definitions — the campaign curve. Pure data + tiny lookup helpers, so
 * GameScene stays the only place that knows how to *play* a level.
 *
 * A level pairs a move budget with a goal and three ascending score thresholds
 * for the 1/2/3-star rating. Two goal shapes ship:
 *   - 'score'   : reach a target score before moves run out.
 *   - 'collect' : clear `count` gems of a specific `kind` (index into KINDS).
 * Stars are always scored off the *final score*, regardless of goal type, so
 * every level rewards big cascades.
 */

import { KINDS } from './config';

/** Reach a target score. */
export interface ScoreGoal {
  type: 'score';
  target: number;
}
/** Clear `count` gems of a given kind (index into config KINDS). */
export interface CollectGoal {
  type: 'collect';
  kind: number;
  count: number;
}
export type Goal = ScoreGoal | CollectGoal;

/** One playable level. */
export interface Level {
  moves: number;
  goal: Goal;
  /** Final-score thresholds for [1★, 2★, 3★], strictly ascending. */
  stars: [number, number, number];
}

/**
 * ~10 levels, alternating goal shapes with a rising difficulty curve: fewer
 * moves, higher targets, larger collect quotas as you climb.
 */
export const LEVELS: Level[] = [
  { moves: 20, goal: { type: 'score', target: 1000 }, stars: [1000, 1800, 2800] },
  { moves: 18, goal: { type: 'collect', kind: 0, count: 15 }, stars: [900, 1600, 2500] },
  { moves: 18, goal: { type: 'score', target: 2500 }, stars: [2500, 4000, 6000] },
  { moves: 16, goal: { type: 'collect', kind: 4, count: 20 }, stars: [1500, 2800, 4200] },
  { moves: 16, goal: { type: 'score', target: 4000 }, stars: [4000, 6000, 8500] },
  { moves: 15, goal: { type: 'collect', kind: 2, count: 24 }, stars: [2200, 3800, 5500] },
  { moves: 15, goal: { type: 'score', target: 6000 }, stars: [6000, 8500, 11000] },
  { moves: 14, goal: { type: 'collect', kind: 5, count: 28 }, stars: [2600, 4400, 6400] },
  { moves: 14, goal: { type: 'score', target: 8000 }, stars: [8000, 11000, 14000] },
  { moves: 13, goal: { type: 'collect', kind: 3, count: 32 }, stars: [3000, 5200, 7600] },
];

/** Total number of levels in the campaign. */
export const LEVEL_COUNT = LEVELS.length;

/** Fetch a level by index, clamped into range so a bad index can never crash. */
export function getLevel(index: number): Level {
  const i = Math.max(0, Math.min(LEVEL_COUNT - 1, index));
  return LEVELS[i];
}

/** How many stars a final score earns on a given level (0–3). */
export function starsFor(level: Level, score: number): number {
  let s = 0;
  for (const t of level.stars) if (score >= t) s++;
  return s;
}

/** Human-readable one-liner for a level's goal, e.g. "Score 2500" or "Collect 🍓 ×15". */
export function goalLabel(goal: Goal): string {
  if (goal.type === 'score') return `Score ${goal.target}`;
  return `Collect ${KINDS[goal.kind].glyph} ×${goal.count}`;
}
