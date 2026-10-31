import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCombatAction, createCombat, invalidAction, type CombatAction, type CombatEvent, type CombatState } from './combatEngine.ts';
import { battleCue } from './combatPresentation.ts';

const from = (action: CombatAction, events: CombatEvent[]): CombatState => ({
  ...createCombat(42), journal: [{ action, events }],
});
const event = (type: CombatEvent['type'], data: CombatEvent['data']): CombatEvent =>
  ({ type, turn: 1, data });

test('event-driven cue reports the actual damage after mitigation', () => {
  assert.deepEqual(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('attack', { side: 'player', damageDealt: 2, absorbed: 3 })])),
    { side: 'player', kind: 'attack', value: 2, label: '−2 vida' },
  );
  assert.equal(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('attack', { side: 'player', damageDealt: 0 })]))?.label,
    'Bloqueado',
  );
});

test('shield, impact and support cues use canonical event data', () => {
  assert.deepEqual(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('shield', { side: 'player', gained: 3 })])),
    { side: 'player', kind: 'shield', value: 3, label: '+3 escudo' },
  );
  assert.deepEqual(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('impact', { side: 'player', seals: 2 })])),
    { side: 'player', kind: 'impact', value: 2, label: 'Impacto 2/4' },
  );
  assert.deepEqual(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('draw', { requested: 2, ids: ['a'] })])),
    { side: 'player', kind: 'draw', value: 1, label: '+1 cartas' },
  );
  assert.equal(
    battleCue(from({ type: 'play', cardId: 'test' }, [event('draw', { requested: 2, ids: [] })]))?.label,
    'Mazo sin cartas',
  );
});

test('rival attack displays as rival and automatic redraw never masquerades as a support card', () => {
  assert.deepEqual(
    battleCue(from({ type: 'resolve_rival' }, [event('attack', { side: 'rival', damageDealt: 4 })])),
    { side: 'rival', kind: 'attack', value: 4, label: '−4 vida' },
  );
  assert.equal(battleCue(from({ type: 'resolve_rival' }, [event('draw', { requested: 1, ids: ['a'] })])), null);
});

test('pause, end turn, difficulty and empty journal produce no fake combat animation', () => {
  assert.equal(battleCue(createCombat(42)), null);
  assert.equal(battleCue(from({ type: 'end_turn' }, [event('turn', { phase: 'rival' })])), null);
  assert.equal(battleCue(from({ type: 'pause' }, [event('pause', { paused: true })])), null);
  assert.equal(battleCue(from({ type: 'difficulty', value: 'Aprendiz' }, [event('difficulty', { value: 'Aprendiz' })])), null);
});

test('an accepted real card action generates a cue while an illegal action does not', () => {
  let state = createCombat(42);
  const card = state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }))!;
  const next = applyCombatAction(state, { type: 'play', cardId: card.id });
  assert.equal(next.error, null);
  state = next.state;
  assert.ok(battleCue(state));
  const invalid = applyCombatAction(state, { type: 'play', cardId: card.id });
  assert.ok(invalid.error);
  assert.strictEqual(invalid.state, state);
  assert.deepEqual(battleCue(invalid.state), battleCue(state));
});
