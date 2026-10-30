import assert from 'node:assert/strict';
import test from 'node:test';
import { applyCombatAction, createCombat, exportCombat, invalidAction, replayCombat, type CombatAction, type CombatState } from './combatEngine.ts';

function act(state: CombatState, action: CombatAction) {
  const result = applyCombatAction(state, action);
  assert.equal(result.error, null);
  assert.ok(result.events.length);
  return result.state;
}
function withCard(kind: string, rank?: number) {
  const state = createCombat(42);
  const cards = [...state.hand, ...state.drawPile];
  const card = cards.find(c => c.kind === kind && (rank === undefined || c.effect.type === 'impact' && c.effect.rank === rank))!;
  state.hand = [card]; state.drawPile = cards.filter(c => c.id !== card.id);
  return { state, card };
}
function rejected(state: CombatState, action: CombatAction) {
  const before = structuredClone(state);
  const result = applyCombatAction(state, action);
  assert.ok(result.error); assert.strictEqual(result.state, state);
  assert.deepEqual(result.events, []); assert.deepEqual(state, before);
}

test('seed reproduces deck order, IDs and initial RNG, including seed zero', () => {
  assert.deepEqual(createCombat(0), createCombat(0));
  assert.notDeepEqual(createCombat(0).hand, createCombat(1).hand);
  const fresh = createCombat(9);
  const snapshot = structuredClone(fresh);
  if (fresh.hand[0].effect.type === 'impact') fresh.hand[0].effect.rank = 999;
  else fresh.hand[0].effect.amount = 999;
  assert.deepEqual(createCombat(9), snapshot);
  assert.throws(() => createCombat(-1)); assert.throws(() => createCombat(2 ** 32));
});

test('rejects missing cards, invalid actions and insufficient mando without mutations', () => {
  const { state, card } = withCard('attack');
  rejected(state, { type: 'play', cardId: 'foreign' });
  rejected(state, { type: 'unknown' } as unknown as CombatAction);
  rejected(state, { type: 'difficulty', value: 'invalid' } as unknown as CombatAction);
  rejected(state, { type: 'resolve_rival' });
  rejected({ ...state, version: 'future' }, { type: 'end_turn' });
  state.mana = 0; rejected(state, { type: 'play', cardId: card.id });
});

test('playing a card is atomic and cannot play the same instance twice', () => {
  const { state, card } = withCard('attack');
  const before = structuredClone(state);
  const next = act(state, { type: 'play', cardId: card.id });
  assert.deepEqual(state, before); assert.equal(next.mana, 3 - card.cost);
  assert.equal(next.hand.length, 0); assert.equal(next.discard[0].id, card.id);
  assert.ok(next.enemyHp < state.enemyHp);
  rejected(next, { type: 'play', cardId: card.id });
});

test('Impact requires order and only one per player turn', () => {
  const { state, card } = withCard('impact', 2);
  rejected(state, { type: 'play', cardId: card.id });
  state.seals = 1; state.impactPlayed = true;
  rejected(state, { type: 'play', cardId: card.id });
  state.impactPlayed = false;
  const next = act(state, { type: 'play', cardId: card.id });
  assert.equal(next.seals, 2); assert.equal(next.impactPlayed, true);
});

test('end turn rejects player actions until one rival response restores mando and draws', () => {
  const initial = createCombat(1); initial.mana = 0; initial.impactPlayed = true;
  const rival = act(initial, { type: 'end_turn' });
  rejected(rival, { type: 'play', cardId: initial.hand[0].id });
  rejected(rival, { type: 'end_turn' });
  const next = act(rival, { type: 'resolve_rival' });
  assert.equal(next.turn, 2); assert.equal(next.mana, 3); assert.equal(next.impactPlayed, false);
  assert.equal(next.hand.length, 5); assert.equal(next.drawPile.length, 19);
  rejected(next, { type: 'resolve_rival' });
});

test('pause blocks resolution without consuming RNG, resume restores the same phase', () => {
  let state = act(createCombat(17), { type: 'end_turn' });
  state = act(state, { type: 'pause' });
  const rng = state.rng;
  rejected(state, { type: 'resolve_rival' }); rejected(state, { type: 'pause' });
  state = act(state, { type: 'resume' });
  assert.equal(state.rng, rng); assert.equal(state.phase, 'rival');
  assert.equal(act(state, { type: 'resolve_rival' }).turn, 2);
});

test('player wins by damage and by fourth Impact; finished games reject further actions', () => {
  for (const kind of ['attack', 'impact']) {
    const { state, card } = withCard(kind, kind === 'impact' ? 4 : undefined);
    if (kind === 'impact') state.seals = 3;
    else state.enemyHp = 1;
    const result = applyCombatAction(state, { type: 'play', cardId: card.id });
    assert.equal(result.state.phase, 'finished'); assert.equal(result.state.winner, 'player');
    assert.ok(result.events.some(e => e.type === 'result' && e.data.winner === 'player'));
    rejected(result.state, { type: 'end_turn' });
  }
});

test('rival wins by lethal damage or fourth Impact', () => {
  for (const finalImpact of [false, true]) {
    const state = createCombat(4);
    state.phase = 'rival'; state.playerHp = 1;
    if (finalImpact) state.enemySeals = 3;
    const result = act(state, { type: 'resolve_rival' });
    assert.equal(result.phase, 'finished'); assert.equal(result.winner, 'rival');
    rejected(result, { type: 'resolve_rival' });
  }
});

test('support draws after freeing a slot; empty deck has no fatigue or new effects', () => {
  const { state, card } = withCard('support');
  state.hand.push(...state.drawPile.splice(0, 5));
  const next = act(state, { type: 'play', cardId: card.id });
  assert.equal(next.hand.length, 6); assert.equal(next.drawPile.length, state.drawPile.length - 1);
  const empty = createCombat(5); empty.hand = []; empty.drawPile = []; empty.phase = 'rival';
  const result = applyCombatAction(empty, { type: 'resolve_rival' });
  assert.deepEqual(result.state.hand, []);
  assert.deepEqual(result.events.find(e => e.type === 'draw')?.data.ids, []);
  assert.equal(result.events.filter(e => e.type === 'attack' || e.type === 'impact').length <= 1, true);
});

test('JSON logs replay complete legal sequences with identical states and events over 40 seeds', () => {
  for (let seed = 0; seed < 40; seed++) {
    let state = createCombat(seed, seed % 2 ? 'Maestro' : 'Aprendiz');
    const originalIds = [...state.hand, ...state.drawPile].map(c => c.id).sort();
    for (let step = 0; step < 120 && state.phase !== 'finished'; step++) {
      if (step === 4) {
        state = act(state, { type: 'pause' }); state = act(state, { type: 'resume' });
        state = act(state, { type: 'difficulty', value: 'Estratega' });
      }
      const card = state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }));
      state = act(state, state.phase === 'rival' ? { type: 'resolve_rival' } : card ? { type: 'play', cardId: card.id } : { type: 'end_turn' });
      assert.deepEqual([...state.hand, ...state.drawPile, ...state.discard].map(c => c.id).sort(), originalIds);
      assert.ok(state.mana >= 0 && state.mana <= 3);
      assert.ok(state.playerHp >= 0 && state.playerHp <= 20 && state.enemyHp >= 0 && state.enemyHp <= 20);
      assert.ok(state.hand.length <= 6);
    }
    assert.equal(state.phase, 'finished', `seed ${seed} must complete within the test budget`);
    const record = JSON.parse(JSON.stringify(exportCombat(state)));
    assert.deepEqual(replayCombat(record), state);
    assert.deepEqual(replayCombat(record), replayCombat(record));
    if (record.journal.length) {
      record.journal[0].events[0].data.tampered = true;
      assert.throws(() => replayCombat(record));
    }
    record.version = 'unknown'; assert.throws(() => replayCombat(record));
  }
});
