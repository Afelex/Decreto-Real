import assert from 'node:assert/strict';
import { test } from 'node:test';
import type { CardType } from '../types';
import { resolveDecreeFX } from './decreeFxMapping.ts';

function effect(type: CardType, isPlayer = true, rank?: number) {
  return resolveDecreeFX({ type, rank }, isPlayer);
}

test('G3: las facciones tienen tajos distintos', () => {
  assert.equal(effect('ATTACK'), 'A01');
  assert.equal(effect('ATTACK', false), 'A02');
});
test('G3: defensa y orden tienen sus efectos', () => {
  assert.equal(effect('DEFENSE'), 'A03');
  assert.equal(effect('ORDER'), 'A09');
});
test('G3: los cuatro sellos de Impacto mantienen sus rangos', () => {
  assert.deepEqual([1, 2, 3, 4].map(rank => effect('IMPACT', true, rank)), ['A05', 'A06', 'A07', 'A08']);
  assert.equal(effect('IMPACT', false, 4), 'A08');
  assert.equal(effect('IMPACT'), 'A05');
});
test('G3: las místicas tienen plantilla visual', () => {
  assert.equal(effect('MYSTIC'), 'D07');
});
