/** Endless campaign: twelve roomy authored levels followed by unique procedural goals. */

import { KINDS } from './config.ts';

/** Reach a target score. */
export interface ScoreGoal { type: 'score'; target: number }
/** Clear `count` gems of a given kind. */
export interface CollectGoal { type: 'collect'; kind: number; count: number }
export type Goal = ScoreGoal | CollectGoal;

/** One playable campaign level. */
export interface Level {
  moves: number;
  goal: Goal;
  /** Number of gem colours used on the board. */
  colors: number;
  /** Final-score thresholds for [1★, 2★, 3★]. */
  stars: [number, number, number];
}

const INTRO: readonly Level[] = [
  { moves: 28, goal: { type: 'score', target: 1100 }, colors: 4, stars: [1100, 1850, 2700] },
  { moves: 28, goal: { type: 'collect', kind: 0, count: 14 }, colors: 4, stars: [1000, 1650, 2450] },
  { moves: 27, goal: { type: 'score', target: 1700 }, colors: 4, stars: [1700, 2550, 3550] },
  { moves: 27, goal: { type: 'collect', kind: 3, count: 17 }, colors: 4, stars: [1300, 2050, 2950] },
  { moves: 27, goal: { type: 'score', target: 2400 }, colors: 5, stars: [2400, 3400, 4650] },
  { moves: 26, goal: { type: 'collect', kind: 2, count: 19 }, colors: 5, stars: [1600, 2450, 3450] },
  { moves: 26, goal: { type: 'score', target: 3100 }, colors: 5, stars: [3100, 4300, 5700] },
  { moves: 26, goal: { type: 'collect', kind: 4, count: 21 }, colors: 5, stars: [1900, 2850, 3900] },
  { moves: 25, goal: { type: 'score', target: 3700 }, colors: 5, stars: [3700, 5050, 6600] },
  { moves: 25, goal: { type: 'collect', kind: 1, count: 23 }, colors: 5, stars: [2150, 3150, 4300] },
  { moves: 25, goal: { type: 'score', target: 4300 }, colors: 6, stars: [4300, 5800, 7500] },
  { moves: 25, goal: { type: 'collect', kind: 5, count: 24 }, colors: 6, stars: [2350, 3450, 4700] },
];

/** Fetch a fair campaign level for any non-negative index. */
export function getLevel(index: number): Level {
  const i = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  if (i < INTRO.length) return INTRO[i];

  const n = i - INTRO.length;
  const colors = Math.min(6, 5 + Math.floor(n / 24));
  if (i % 2 === 0) {
    const ordinal = Math.floor(n / 2);
    const moves = 27 + Math.floor(ordinal / 18);
    const target = 4600 + ordinal * 100;
    return { moves, colors, goal: { type: 'score', target }, stars: scoreStars(target) };
  }

  const ordinal = Math.floor(n / 2);
  const early = ordinal < 12;
  const kind = early ? ordinal % 5 : (ordinal - 12) % 6;
  const count = early ? 25 + Math.floor(ordinal / 5) : 28 + Math.floor((ordinal - 12) / 6);
  const moves = Math.max(27, Math.ceil(count / 2.15) + 15);
  const base = round50(2450 + ordinal * 82);
  return {
    moves,
    colors,
    goal: { type: 'collect', kind, count },
    stars: [base, round50(base * 1.48), round50(base * 2.05)],
  };
}

function round50(value: number): number { return Math.round(value / 50) * 50; }

function scoreStars(target: number): [number, number, number] {
  return [target, round50(target * 1.42), round50(target * 1.9)];
}

/** How many stars a final score earns on a given level (0–3). */
export function starsFor(level: Level, score: number): number {
  return level.stars.reduce((total, threshold) => total + (score >= threshold ? 1 : 0), 0);
}

/** Human-readable one-liner for a campaign goal. */
export function goalLabel(goal: Goal): string {
  return goal.type === 'score' ? `Score ${goal.target}` : `Collect ${KINDS[goal.kind].name} ×${goal.count}`;
}
