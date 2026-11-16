import assert from 'node:assert/strict';
import { test } from 'node:test';
import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
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

test('G3: el recurso publicado incluye las 34 definiciones originales', () => {
  const bundle = readFileSync(new URL('../public/fx-g3/decreto-real-fx-g3.bundle.js', import.meta.url), 'utf8');
  const sandbox: { window: { DecretoFX?: { defs: Map<string, unknown> } }; console: Console } = {
    window: {}, console,
  };
  runInNewContext(bundle, sandbox, { timeout: 10_000 });
  // runInNewContext muta sandbox dinámicamente; el compilador no puede inferirlo.
  const runtime = (sandbox.window as Record<string, unknown>).DecretoFX as
    | { defs: Map<string, unknown> } | undefined;
  assert.ok(runtime);
  assert.equal(runtime.defs.size, 34);
  for (const id of ['A01', 'A02', 'A03', 'A05', 'A06', 'A07', 'A08', 'A09', 'D07']) {
    assert.ok(runtime.defs.has(id), 'Efecto G3 ausente: ' + id);
  }
});
