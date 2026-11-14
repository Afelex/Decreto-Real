import assert from 'node:assert/strict';
import test from 'node:test';
import { cardEffectCue, comboEffectCue, DECREE_BANNER_DURATION_MS, DECREE_EFFECT_DURATION_MS, syncCueVideoRate } from './effectCues.ts';

test('card activation clips map to correct art; Impact keeps its existing sequence', () => {
  assert.equal(cardEffectCue('ATTACK').file, 'efectos/ataque.webm');
  assert.equal(cardEffectCue('DEFENSE').durationMs, 1000);
  assert.equal(cardEffectCue('ORDER').file, 'efectos/orden.webm');
  assert.equal(cardEffectCue('IMPACT').file, null);
});

test('combo effects play according to choice and multiplier', () => {
  assert.deepEqual([
    comboEffectCue('DAMAGE', 2).file,
    comboEffectCue('DAMAGE', 3).file,
    comboEffectCue('HEAL', 2).file,
    comboEffectCue('HEAL', 3).file,
  ], [
    'efectos/combo-ataque-x2.webm',
    'efectos/combo-ataque-x3.webm',
    'efectos/combo-defensa-x2.webm',
    'efectos/combo-defensa-x3.webm',
  ]);
  assert.equal(comboEffectCue('HEAL', 2).durationMs, 1167);
  assert.equal(comboEffectCue('DAMAGE', 3).durationMs, 1680);
});

test('cada fase de anuncio, efecto y combo tiene 1500 ms sin alterar clips originales', () => {
  assert.equal(DECREE_BANNER_DURATION_MS, 1500);
  assert.equal(DECREE_EFFECT_DURATION_MS, 1500);
  const video = { duration: 1, playbackRate: 1 } as HTMLVideoElement;
  syncCueVideoRate(video, DECREE_EFFECT_DURATION_MS);
  assert.ok(Math.abs(video.playbackRate - 2 / 3) < 0.001);
  video.duration = 1.68;
  syncCueVideoRate(video, DECREE_EFFECT_DURATION_MS);
  assert.ok(Math.abs(video.playbackRate - 1.12) < 0.001);
});
