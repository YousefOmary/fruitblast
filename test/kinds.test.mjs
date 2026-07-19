import assert from 'node:assert/strict';
import test from 'node:test';
import { KINDS } from '../src/game/config.ts';

test('six fruit identities use unique names and colors without platform glyph data', () => {
  assert.equal(KINDS.length, 6);
  assert.equal(new Set(KINDS.map((kind) => kind.name)).size, 6);
  assert.equal(new Set(KINDS.map((kind) => kind.color)).size, 6);
  assert.ok(KINDS.every((kind) => !('glyph' in kind)));
});
