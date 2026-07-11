import assert from 'node:assert/strict';
import test from 'node:test';
import { getLevel, starsFor } from '../src/game/levels.ts';

test('generates valid, fair-looking levels at arbitrary indices', () => {
  for (const index of [0, 1, 7, 8, 25, 100, 1000]) {
    const level = getLevel(index);
    assert.ok(level.moves >= 16 && level.moves <= 20);
    assert.ok(level.colors >= 4 && level.colors <= 6);
    assert.ok(level.stars[0] < level.stars[1] && level.stars[1] < level.stars[2]);
    if (level.goal.type === 'score') {
      assert.ok(level.goal.target / level.moves < 1500, `level ${index} score target stays reachable-ish`);
      assert.equal(level.stars[0], level.goal.target);
    } else {
      assert.ok(level.goal.count / level.moves < 2.5, `level ${index} collect quota stays reachable-ish`);
      assert.ok(level.goal.kind < level.colors);
    }
  }
});

test('procedural difficulty rises smoothly within each alternating goal type', () => {
  let previousScore = 0;
  let previousCollect = 0;
  for (let index = 8; index < 120; index++) {
    const level = getLevel(index);
    if (level.goal.type === 'score') {
      assert.ok(level.goal.target >= previousScore);
      previousScore = level.goal.target;
    } else {
      assert.ok(level.goal.count >= previousCollect);
      previousCollect = level.goal.count;
    }
  }
});

test('star ratings use generated thresholds', () => {
  const level = getLevel(25);
  assert.equal(starsFor(level, level.stars[0] - 1), 0);
  assert.equal(starsFor(level, level.stars[0]), 1);
  assert.equal(starsFor(level, level.stars[2]), 3);
});
