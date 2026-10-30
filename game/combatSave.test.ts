import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import test from 'node:test';
import { applyCombatAction, createCombat, exportCombat, type CombatAction, type CombatState } from './combatEngine.ts';
import { clearSave, loadSave, MAX_SAVE_CHARS, readPreference, SAVE_FORMAT, SAVE_KEY, writePreference, writeSave, type StorageLike } from './combatSave.ts';

class MemoryStorage implements StorageLike {
  items = new Map<string, string>();
  getItem(key: string) { return this.items.get(key) ?? null; }
  setItem(key: string, value: string) { this.items.set(key, String(value)); }
  removeItem(key: string) { this.items.delete(key); }
}
const quotaStorage = (): StorageLike => ({
  getItem: () => null, removeItem: () => {},
  setItem: () => { throw new DOMException('full', 'QuotaExceededError'); },
});
const blockedStorage: StorageLike = {
  getItem: () => { throw new DOMException('denied', 'SecurityError'); },
  setItem: () => { throw new DOMException('denied', 'SecurityError'); },
  removeItem: () => { throw new DOMException('denied', 'SecurityError'); },
};
function play(state: CombatState, ...actions: CombatAction[]) {
  for (const action of actions) {
    const result = applyCombatAction(state, action);
    assert.equal(result.error, null); state = result.state;
  }
  return state;
}

test('save after accepted actions and restore the same state, RNG, difficulty and journal', () => {
  const storage = new MemoryStorage();
  const state = play(createCombat(77, 'Maestro'), { type: 'end_turn' }, { type: 'resolve_rival' }, { type: 'difficulty', value: 'Aprendiz' });
  assert.deepEqual(writeSave(storage, state), { ok: true });
  const loaded = loadSave(storage);
  assert.equal(loaded.status, 'ready');
  if (loaded.status !== 'ready') return;
  assert.deepEqual(loaded.state, state);
  assert.equal(loaded.state.rng, state.rng); assert.equal(loaded.state.difficulty, 'Aprendiz');
  assert.equal(loaded.state.initialDifficulty, 'Maestro');
  // Continuing from the restored state gives the same future as the original.
  assert.deepEqual(play(loaded.state, { type: 'end_turn' }, { type: 'resolve_rival' }), play(state, { type: 'end_turn' }, { type: 'resolve_rival' }));
});

test('an interrupted rival response restores in the rival phase and resolves exactly once', () => {
  const storage = new MemoryStorage();
  const pending = play(createCombat(5), { type: 'end_turn' });
  writeSave(storage, pending);
  const loaded = loadSave(storage);
  assert.equal(loaded.status, 'ready');
  if (loaded.status !== 'ready') return;
  assert.equal(loaded.state.phase, 'rival');
  const resolved = play(loaded.state, { type: 'resolve_rival' });
  assert.deepEqual(resolved, play(pending, { type: 'resolve_rival' }));
  assert.equal(resolved.journal.filter(entry => entry.action.type === 'resolve_rival').length, 1);
  assert.ok(applyCombatAction(resolved, { type: 'resolve_rival' }).error, 'a second response is rejected');
});

test('empty, untouched and finished games are not offered; finished saves are removed', () => {
  const storage = new MemoryStorage();
  assert.deepEqual(loadSave(storage), { status: 'empty' });
  writeSave(storage, createCombat(1));
  assert.deepEqual(loadSave(storage), { status: 'empty' });
  // Build a real finished game instead of injecting state: play until it ends.
  let state = createCombat(0);
  while (state.phase !== 'finished') {
    const card = state.hand.find(c => !applyCombatAction(state, { type: 'play', cardId: c.id }).error);
    state = play(state, state.phase === 'rival' ? { type: 'resolve_rival' } : card ? { type: 'play', cardId: card.id } : { type: 'end_turn' });
  }
  writeSave(storage, state);
  assert.deepEqual(loadSave(storage), { status: 'empty' });
  assert.equal(storage.getItem(SAVE_KEY), null);
});

test('corrupt, tampered, oversized and incompatible saves are rejected with a reason, leaving other keys intact', () => {
  const storage = new MemoryStorage();
  storage.setItem('otra-app', 'conservar');
  const valid = JSON.parse(JSON.stringify({ format: SAVE_FORMAT, record: exportCombat(play(createCombat(3), { type: 'end_turn' })) }));
  const cases: [string, string][] = [
    ['{no es json', 'corrupt'], ['null', 'corrupt'], ['"texto"', 'corrupt'], ['{}', 'corrupt'],
    [JSON.stringify({ ...valid, format: 99 }), 'version'],
    [JSON.stringify({ ...valid, record: { ...valid.record, version: 'dr-combat-99' } }), 'version'],
    [JSON.stringify({ ...valid, record: { ...valid.record, seed: 'x' } }), 'corrupt'],
    [JSON.stringify({ ...valid, record: { ...valid.record, journal: [{ action: { type: 'play', cardId: 'carta-999' }, events: [] }] } }), 'corrupt'],
    [JSON.stringify({ ...valid, record: { ...valid.record, journal: [{ ...valid.record.journal[0], events: [{ type: 'turn', turn: 1, data: { phase: 'player' } }] }] } }), 'corrupt'],
    ['x'.repeat(MAX_SAVE_CHARS + 1), 'corrupt'],
  ];
  for (const [raw, problem] of cases) {
    storage.setItem(SAVE_KEY, raw);
    assert.deepEqual(loadSave(storage), { status: 'invalid', problem }, raw.slice(0, 80));
    assert.equal(storage.getItem(SAVE_KEY), raw, 'invalid data is kept until the player decides');
  }
  assert.equal(clearSave(storage), true);
  assert.equal(storage.getItem(SAVE_KEY), null);
  assert.equal(storage.getItem('otra-app'), 'conservar');
});

test('a save written by the previous engine version is restored through legacy replay', () => {
  const storage = new MemoryStorage();
  const legacy = JSON.parse(readFileSync(new URL('./fixtures/dr-combat-1-record.json', import.meta.url), 'utf8'));
  legacy.journal = legacy.journal.slice(0, 10);
  storage.setItem(SAVE_KEY, JSON.stringify({ format: SAVE_FORMAT, record: legacy }));
  const loaded = loadSave(storage);
  assert.equal(loaded.status, 'ready');
  if (loaded.status === 'ready') assert.equal(loaded.state.journal.length, 10);
});

test('quota and unavailable storage fail softly without throwing', () => {
  const state = play(createCombat(2), { type: 'end_turn' });
  assert.deepEqual(writeSave(quotaStorage(), state), { ok: false, problem: 'quota' });
  assert.deepEqual(writeSave(blockedStorage, state), { ok: false, problem: 'unavailable' });
  assert.deepEqual(writeSave(null, state), { ok: false, problem: 'unavailable' });
  assert.deepEqual(loadSave(blockedStorage), { status: 'invalid', problem: 'unavailable' });
  assert.deepEqual(loadSave(null), { status: 'invalid', problem: 'unavailable' });
  assert.equal(clearSave(blockedStorage), false);
  assert.equal(readPreference(blockedStorage, 'k'), null);
  assert.equal(writePreference(blockedStorage, 'k', 'v'), false);
});
