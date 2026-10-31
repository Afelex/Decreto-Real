import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { applyCombatAction, canonicalAction, createCombat, ENGINE_VERSION, exportCombat, invalidAction, invalidRecord, playBlockReason, replayCombat, type CombatAction, type CombatRecord, type CombatState } from './combatEngine.ts';
import { describeEntry, cardLookup, historyLines } from './combatText.ts';
import { BOSS_MOVE_NAMES } from './bossTactics.ts';

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

const legacyRecord = (): CombatRecord => JSON.parse(readFileSync(new URL('./fixtures/dr-combat-1-record.json', import.meta.url), 'utf8'));

test('defense at the shield cap reports the shield actually gained (regression: "obtienes 7" with gained 4)', () => {
  const { state, card } = withCard('defense');
  state.shield = 10;
  const result = applyCombatAction(state, { type: 'play', cardId: card.id });
  const amount = card.effect.type === 'shield' ? card.effect.amount : 0;
  assert.equal(result.state.shield, 12);
  const shield = result.events.find(e => e.type === 'shield')!;
  assert.deepEqual(shield.data, { side: 'player', gained: 2, bonus: 0, amount, shield: 12 });
  const [line] = describeEntry(result.state.journal[0], cardLookup(result.state));
  assert.equal(line, `${card.name}: obtienes 2 de escudo (tope 12; ${amount - 2} sin efecto).`);
});

test('rival texts match capped shield, damage and healing actually applied', () => {
  // Find real rival responses in the legacy fixture: shield at cap and Impacts with healing.
  const state = replayCombat(legacyRecord());
  const cards = cardLookup(state);
  const capped = state.journal.find(e => e.events.some(ev => ev.type === 'shield' && ev.data.side === 'rival' && ev.data.gained === 0))!;
  assert.ok(capped, 'fixture contains a rival shield at its cap');
  assert.ok(describeEntry(capped, cards).includes('El Virrey intenta protegerse, pero su escudo ya está al máximo (10).'));
  const rival = createCombat(3, 'Aprendiz');
  Object.assign(rival, { phase: 'rival', enemyHp: 20, playerHp: 9, shield: 0, rng: 0 });
  // Search an RNG value that makes Aprendiz choose an Impact at full health.
  for (let rng = 0; rng < 500; rng++) {
    const result = applyCombatAction({ ...rival, rng }, { type: 'resolve_rival' });
    const impact = result.events.find(e => e.type === 'impact');
    if (!impact) continue;
    assert.deepEqual(impact.data, { side: 'rival', seals: 1, damage: 1, healing: 0 });
    assert.equal(result.state.enemyHp, 20); assert.equal(result.state.playerHp, 8);
    assert.match(describeEntry(result.state.journal[0], cards)[0], /pierdes 1 de vida y él recupera 0/);
    return;
  }
  assert.fail('no Impact response found');
});

test('legacy dr-combat-1 records replay by projection, ignore old messages and upgrade to the current version', () => {
  const legacy = legacyRecord();
  assert.equal(legacy.version, 'dr-combat-1');
  const state = replayCombat(legacy);
  assert.equal(state.version, ENGINE_VERSION); assert.equal(state.phase, 'finished');
  const upgraded = JSON.parse(JSON.stringify(exportCombat(state)));
  assert.equal(upgraded.version, ENGINE_VERSION);
  assert.deepEqual(replayCombat(upgraded), state);
  assert.ok(upgraded.journal.every((e: { events: object[] }) => e.events.every(ev => !('message' in ev))));
  const reworded = legacyRecord();
  (reworded.journal[0].events[1] as { message?: string }).message = 'Texto distinto';
  assert.deepEqual(replayCombat(reworded), state);
  const tampered = legacyRecord();
  (tampered.journal[0].events[1].data as Record<string, unknown>).gained = 99;
  assert.throws(() => replayCombat(tampered), /divergent/);
  const missing = legacyRecord();
  (missing.journal[0].events as unknown[]).pop();
  assert.throws(() => replayCombat(missing), /divergent/);
});

test('current records compare event data strictly, including unexpected fields', () => {
  let state = act(createCombat(8), { type: 'end_turn' }); state = act(state, { type: 'resolve_rival' });
  const record = JSON.parse(JSON.stringify(exportCombat(state)));
  record.journal[1].events[0].message = 'añadido';
  assert.throws(() => replayCombat(record), /divergent/);
});

test('journal stores canonical actions only and survives non-cloneable extra fields', () => {
  const { state, card } = withCard('attack');
  const noisy = { type: 'play', cardId: card.id, callback: () => 1, extra: { nested: true } } as unknown as CombatAction;
  const next = act(state, noisy);
  assert.deepEqual(next.journal[0].action, { type: 'play', cardId: card.id });
  assert.deepEqual(canonicalAction({ type: 'difficulty', value: 'Maestro', x: 1 }), { type: 'difficulty', value: 'Maestro' });
  assert.equal(canonicalAction({ type: 'play', cardId: 7 }), null);
  assert.equal(canonicalAction(null), null);
  rejected(state, { type: 'play', cardId: 7 } as unknown as CombatAction);
  rejected(state, null as unknown as CombatAction);
});

test('journal entries are shared, frozen and never altered by later actions or exports', () => {
  const first = act(createCombat(11), { type: 'end_turn' });
  const second = act(first, { type: 'resolve_rival' });
  assert.equal(first.journal.length, 1); assert.equal(second.journal.length, 2);
  assert.strictEqual(second.journal[0], first.journal[0]);
  assert.ok(Object.isFrozen(second.journal[1]) && Object.isFrozen(second.journal[1].events[0].data));
  const record = exportCombat(second);
  (record.journal[0].events[0].data as Record<string, unknown>).phase = 'x';
  assert.equal(second.journal[0].events[0].data.phase, 'rival');
});

test('journal cost grows linearly: 5,000 actions build and replay quickly (was ~24 s each)', () => {
  let state = createCombat(1);
  const start = performance.now();
  for (let i = 0; i < 5000; i++) state = applyCombatAction(state, { type: i % 2 ? 'resume' : 'pause' }).state;
  const record = JSON.parse(JSON.stringify(exportCombat(state)));
  assert.deepEqual(replayCombat(record), state);
  assert.ok(performance.now() - start < 6000, `took ${performance.now() - start} ms`);
});

test('external records are shape-checked before replay', () => {
  const good = JSON.parse(JSON.stringify(exportCombat(act(createCombat(2), { type: 'end_turn' }))));
  assert.equal(invalidRecord(good), null);
  for (const bad of [null, 'text', 3, [], { ...good, version: 'dr-combat-99' }, { ...good, seed: 1.5 }, { ...good, seed: -1 },
    { ...good, difficulty: 'Dios' }, { ...good, journal: {} }, { ...good, journal: [null] },
    { ...good, journal: [{ action: { type: 'hack' }, events: [] }] }, { ...good, journal: [{ action: { type: 'end_turn' }, events: [{ type: 'turn' }] }] }]) {
    assert.ok(invalidRecord(bad), JSON.stringify(bad));
    assert.throws(() => replayCombat(bad as CombatRecord));
  }
});

test('play block reasons distinguish turn, pause, order, one Impact per turn and mando', () => {
  const { state, card } = withCard('impact', 2);
  assert.equal(playBlockReason(state, card.id), 'impact_order');
  state.seals = 1; state.impactPlayed = true; assert.equal(playBlockReason(state, card.id), 'impact_used');
  assert.equal(invalidAction(state, { type: 'play', cardId: card.id }), 'Ya jugaste un Impacto este turno.');
  state.impactPlayed = false; state.mana = 1; assert.equal(playBlockReason(state, card.id), 'mana');
  state.mana = 3; assert.equal(playBlockReason(state, card.id), null);
  assert.equal(playBlockReason(state, 'otra'), 'not_in_hand');
  assert.equal(playBlockReason({ ...state, paused: true }, card.id), 'paused');
  assert.equal(playBlockReason({ ...state, phase: 'rival' }, card.id), 'not_your_turn');
  assert.equal(playBlockReason({ ...state, phase: 'finished' }, card.id), 'finished');
});

test('history derives lines from events and skips the end-turn notice', () => {
  let state = createCombat(0);
  assert.deepEqual(historyLines(state), []);
  state = act(state, { type: 'end_turn' }); state = act(state, { type: 'resolve_rival' });
  const lines = historyLines(state);
  assert.equal(lines.length, 1); assert.match(lines[0], /^Turno 1: El (rival|Virrey)/);
});

test('styled general response is accepted only for a valid boss ID and replayed bit-for-bit', () => {
  for (const id of ['1','2','3','4','5','6','7','8'] as const) {
    let state = createCombat(42);
    state = act(state, { type: 'end_turn' });
    state = act(state, { type: 'resolve_rival', bossId: id });
    assert.equal(state.turn, 2);
    assert.deepEqual(state.journal[1].action, { type:'resolve_rival', bossId:id });
    assert.equal(state.journal[1].events.filter(e => ['attack','shield','impact'].includes(e.type)).length, 1);
    const effect = state.journal[1].events.find(e => ['attack','shield','impact'].includes(e.type))!;
    const kind = effect.type === 'attack' ? 'attack' : effect.type === 'shield' ? 'shield' : 'impact';
    assert.equal(state.lastPlay?.name, BOSS_MOVE_NAMES[id][kind]);
    assert.deepEqual(replayCombat(JSON.parse(JSON.stringify(exportCombat(state)))), state);
    assert.ok(state.playerHp >= 0 && state.playerHp <= 20);
    assert.ok(state.enemyShield >= 0 && state.enemyShield <= 10);
  }
  let state = act(createCombat(4), { type: 'end_turn' });
  rejected(state, { type: 'resolve_rival', bossId: '9' } as unknown as CombatAction);
  rejected(state, { type: 'resolve_rival', bossId: 8 } as unknown as CombatAction);
});

test('standard duel response is byte-identical when no boss ID is provided', () => {
  for (let seed = 0; seed < 40; seed++) {
    let state = act(createCombat(seed), { type: 'end_turn' });
    const standard = act(state, { type: 'resolve_rival' });
    const spoof = act(state, { type: 'resolve_rival', bossId: undefined });
    assert.deepEqual(standard, spoof);
    assert.deepEqual(standard.journal[1].action, { type: 'resolve_rival' });
    const earlier = JSON.parse(JSON.stringify(exportCombat(standard)));
    earlier.version = 'dr-combat-2';
    assert.deepEqual(replayCombat(earlier), standard, 'v2 action data remains replayable');
  }
});

test('the fourth Impact still wins by the existing rule for all eight generals', () => {
  for (const bossId of ['1','2','3','4','5','6','7','8'] as const) {
    const state = createCombat(7);
    state.phase = 'rival'; state.enemySeals = 3;
    const next = act(state, { type: 'resolve_rival', bossId });
    assert.equal(next.winner, 'rival');
    assert.equal(next.enemySeals, 4);
    assert.equal(next.phase, 'finished');
    assert.equal(next.journal[0].events.find(e => e.type === 'impact')?.data.seals, 4);
  }
});
