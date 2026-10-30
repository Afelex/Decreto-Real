import assert from 'node:assert/strict';
import test from 'node:test';
import { drawFromPile, nextComboStreak, resolveAttack, resolveImpact } from './rules.ts';

test('attack damage passes through shield and reports remaining values', () => {
  assert.deepEqual(resolveAttack(5, 3), {
    damageDealt: 2,
    damageBlocked: 3,
    remainingShield: 0,
  });
});

test('attack clamps negative damage and shield to zero', () => {
  assert.deepEqual(resolveAttack(-2, -4, -1), {
    damageDealt: 0,
    damageBlocked: 0,
    remainingShield: 0,
  });
});

test('non-final impact seals one, heals one and damages the opponent', () => {
  assert.deepEqual(resolveImpact(1, 12), {
    seals: 2,
    health: 13,
    damage: 1,
    wins: false,
  });
});

test('impact healing never exceeds maximum health', () => {
  assert.equal(resolveImpact(0, 20).health, 20);
});

test('fourth impact wins without applying non-final damage or healing', () => {
  assert.deepEqual(resolveImpact(3, 8), {
    seals: 4,
    health: 8,
    damage: 0,
    wins: true,
  });
});

test('three consecutive matching cards trigger and reset a combo', () => {
  assert.deepEqual(nextComboStreak('attack', 2, 'attack'), { count: 0, triggered: true });
  assert.deepEqual(nextComboStreak('attack', 2, 'defense'), { count: 1, triggered: false });
});

test('draw respects hand limit and preserves all undrawn cards', () => {
  const result = drawFromPile(['a', 'b', 'c', 'd', 'e'], ['f', 'g'], 2, 6);
  assert.deepEqual(result, { drawn: ['f'], hand: ['a', 'b', 'c', 'd', 'e', 'f'], drawPile: ['g'] });
});

test('draw from an empty pile or full hand is a no-op', () => {
  assert.deepEqual(drawFromPile(['a'], [], 1, 6), { drawn: [], hand: ['a'], drawPile: [] });
  assert.deepEqual(drawFromPile(['a', 'b'], ['c'], 1, 2), { drawn: [], hand: ['a', 'b'], drawPile: ['c'] });
});

test('a support-card draw uses the hand after the played card leaves it', () => {
  const handAfterPlayingSupport = ['a', 'b', 'c', 'd', 'e'];
  const result = drawFromPile(handAfterPlayingSupport, ['f'], 1, 6);
  assert.deepEqual(result.hand, ['a', 'b', 'c', 'd', 'e', 'f']);
  assert.deepEqual(result.drawPile, []);
});
