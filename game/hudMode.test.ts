import assert from 'node:assert/strict';
import test from 'node:test';
import { cardCueTier, comboCueTier, resolveHudMode, type HudModeInput } from './hudMode.ts';

const base: HudModeInput = {
  editing: false, entranceActive: false, finished: false, storyActive: false,
  phase: 'PLAYER_TURN', choosingCombo: false, cueActive: false,
};

test('el HUD sigue la fase real del combate', () => {
  assert.equal(resolveHudMode(base), 'player');
  assert.equal(resolveHudMode({ ...base, phase: 'OPPONENT_TURN' }), 'rival');
  assert.equal(resolveHudMode({ ...base, phase: 'TURN_BANNER' }), 'handoff');
  assert.equal(resolveHudMode({ ...base, phase: 'COIN_TOSS' }), 'coin');
  assert.equal(resolveHudMode({ ...base, phase: 'INIT' }), 'coin');
});

test('anuncios y selector de combo tienen prioridad sobre el turno', () => {
  assert.equal(resolveHudMode({ ...base, cueActive: true }), 'cue');
  assert.equal(resolveHudMode({ ...base, phase: 'OPPONENT_TURN', cueActive: true }), 'cue');
  assert.equal(resolveHudMode({ ...base, choosingCombo: true, cueActive: true }), 'combo-choice');
});

test('ceremonias y resultado mandan sobre cualquier estado de turno', () => {
  assert.equal(resolveHudMode({ ...base, entranceActive: true, phase: 'COIN_TOSS' }), 'entrance');
  assert.equal(resolveHudMode({ ...base, finished: true, phase: 'VICTORY', cueActive: true }), 'result');
  assert.equal(resolveHudMode({ ...base, storyActive: true }), 'story');
  // El diálogo de victoria de campaña ocurre con la partida ya terminada.
  assert.equal(resolveHudMode({ ...base, finished: true, storyActive: true }), 'result');
});

test('DRStudio conserva todas las piezas visibles', () => {
  assert.equal(resolveHudMode({ ...base, editing: true, entranceActive: true, finished: true }), 'studio');
});

test('cuatro niveles de presentación', () => {
  assert.equal(cardCueTier('ATTACK'), 'normal');
  assert.equal(cardCueTier('DEFENSE'), 'normal');
  assert.equal(cardCueTier('ORDER'), 'normal');
  assert.equal(cardCueTier('IMPACT'), 'special');
  assert.equal(cardCueTier('MYSTIC'), 'special');
  assert.equal(comboCueTier(2), 'combo2');
  assert.equal(comboCueTier(3), 'combo3');
});
