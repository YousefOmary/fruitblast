import assert from 'node:assert/strict';
import test from 'node:test';
import { SWIPE_THRESHOLD, swipeTarget } from '../src/game/config.ts';

test('resolves swipes in all four directions', () => {
  assert.deepEqual(swipeTarget(3, 3, SWIPE_THRESHOLD + 1, 0), { r: 3, c: 4 });
  assert.deepEqual(swipeTarget(3, 3, -SWIPE_THRESHOLD - 1, 0), { r: 3, c: 2 });
  assert.deepEqual(swipeTarget(3, 3, 0, SWIPE_THRESHOLD + 1), { r: 4, c: 3 });
  assert.deepEqual(swipeTarget(3, 3, 0, -SWIPE_THRESHOLD - 1), { r: 2, c: 3 });
});

test('keeps movement below the threshold as a tap', () => {
  assert.equal(swipeTarget(3, 3, SWIPE_THRESHOLD - 1, 0), null);
  assert.equal(swipeTarget(3, 3, 8, 9), null);
});

test('uses one dominant axis for diagonal drags', () => {
  assert.deepEqual(swipeTarget(3, 3, 50, 35), { r: 3, c: 4 });
  assert.deepEqual(swipeTarget(3, 3, -30, -55), { r: 2, c: 3 });
  assert.deepEqual(swipeTarget(3, 3, -45, 45), { r: 3, c: 2 });
});

test('returns null for targets beyond every board edge', () => {
  assert.equal(swipeTarget(0, 3, 0, -50), null);
  assert.equal(swipeTarget(7, 3, 0, 50), null);
  assert.equal(swipeTarget(3, 0, -50, 0), null);
  assert.equal(swipeTarget(3, 7, 50, 0), null);
});
