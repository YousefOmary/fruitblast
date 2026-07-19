import assert from 'node:assert/strict';
import test from 'node:test';
import { createGrid } from '../src/game/matchLogic.ts';
import { dailySeed, hashString, modeConfig, seededRandom } from '../src/game/modes.ts';

test('fixed Daily date produces the same seed and board', () => {
  const seed = dailySeed('2026-07-11');
  assert.equal(seed, dailySeed('2026-07-11'));
  assert.deepEqual(createGrid(seededRandom(seed), 5), createGrid(seededRandom(seed), 5));
});

test('different dates produce different deterministic sequences', () => {
  const a = seededRandom(dailySeed('2026-07-11'));
  const b = seededRandom(dailySeed('2026-07-12'));
  assert.notDeepEqual(Array.from({ length: 12 }, a), Array.from({ length: 12 }, b));
  assert.notEqual(hashString('2026-07-11'), hashString('2026-07-12'));
});

test('fixed-length modes have expanded play budgets', () => {
  assert.equal(modeConfig('time').seconds, 120);
  assert.equal(modeConfig('daily').moves, 30);
});
