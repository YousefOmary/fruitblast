/** Endless campaign level generation: eight gentle authored levels followed by a mild curve. */

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
  { moves: 20, goal: { type: 'score', target: 900 }, colors: 4, stars: [900, 1450, 2100] },
  { moves: 20, goal: { type: 'collect', kind: 0, count: 12 }, colors: 4, stars: [800, 1350, 2000] },
  { moves: 19, goal: { type: 'score', target: 1500 }, colors: 4, stars: [1500, 2200, 3100] },
  { moves: 19, goal: { type: 'collect', kind: 3, count: 16 }, colors: 4, stars: [1100, 1800, 2600] },
  { moves: 19, goal: { type: 'score', target: 2200 }, colors: 5, stars: [2200, 3100, 4200] },
  { moves: 18, goal: { type: 'collect', kind: 2, count: 18 }, colors: 5, stars: [1400, 2200, 3100] },
  { moves: 18, goal: { type: 'score', target: 2900 }, colors: 5, stars: [2900, 4000, 5300] },
  { moves: 18, goal: { type: 'collect', kind: 4, count: 20 }, colors: 5, stars: [1700, 2600, 3600] },
];

/** Fetch a fair campaign level for any non-negative index. */
export function getLevel(index: number): Level {
  const i = Math.max(0, Math.floor(Number.isFinite(index) ? index : 0));
  if (i < INTRO.length) return INTRO[i];

  const n = i - INTRO.length;
  const colors = Math.min(6, 5 + Math.floor(n / 12));
  // Budgets tighten only twice and never below 16. Square-root target growth
  // leaves specials/cascades ample headroom even at very high levels.
  const moves = Math.max(16, 18 - Math.floor(n / 16));
  if (i % 2 === 0) {
    const target = round50(3200 + Math.sqrt(n) * 550);
    return { moves, colors, goal: { type: 'score', target }, stars: scoreStars(target) };
  }

  const count = Math.min(38, Math.round(21 + Math.sqrt(n) * 1.55));
  const base = round50(1800 + Math.sqrt(n) * 330);
  return {
    moves,
    colors,
    goal: { type: 'collect', kind: (i * 5 + 1) % colors, count },
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
  return goal.type === 'score' ? `Score ${goal.target}` : `Collect ${KINDS[goal.kind].glyph} ×${goal.count}`;
}
