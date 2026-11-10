import test from 'node:test';
import assert from 'node:assert/strict';
import { CAMPAIGN_MISSIONS, awardMissionStars, emptyCampaignProgress, type CampaignProgress } from './campaign.ts';
import { collectedMystics, DECK_STORAGE_KEY, hasZhinchiLegacy, loadMysticSlots, saveMysticSlots, validateMysticSlots } from './mysticDeck.ts';

const completeThrough = (end: number): CampaignProgress => ({
  version: 1,
  stars: Object.fromEntries(Array.from({ length: end }, (_, i) => [String(i + 1).padStart(2, '0'), 1])),
});
const store = (): Pick<Storage, 'getItem' | 'setItem'> & { getRaw: () => string | null } => {
  const entries = new Map<string, string>();
  return {
    getItem: key => entries.get(key) ?? null,
    setItem: (key, value) => { entries.set(key, value); },
    getRaw: () => entries.get(DECK_STORAGE_KEY) ?? null,
  };
};

test('ocho generales conceden una sola carta; repetir combate no la duplica', () => {
  const rewards = collectedMystics(completeThrough(34));
  assert.equal(rewards.length, 8);
  assert.equal(new Set(rewards).size, 8);
  assert.deepEqual(rewards, Array.from({ length: 8 }, (_, i) => `general-${i + 1}`));
  const progress = completeThrough(34);
  const repeated = awardMissionStars(progress, '34', 3);
  assert.deepEqual(collectedMystics(repeated), rewards);
});

test('el legado solo despierta al completar sin saltos las primeras 35 misiones', () => {
  assert.equal(hasZhinchiLegacy(emptyCampaignProgress()), false);
  assert.equal(hasZhinchiLegacy(completeThrough(34)), false);
  assert.equal(hasZhinchiLegacy(completeThrough(35)), true);
  assert.equal(hasZhinchiLegacy(completeThrough(38)), true);
  assert.equal(CAMPAIGN_MISSIONS.length, 38);
  assert.deepEqual(collectedMystics(completeThrough(35)).slice(-1), ['legado-zhinchi']);
  const forged = completeThrough(36);
  delete forged.stars['15'];
  assert.equal(hasZhinchiLegacy(forged), false);
});

test('ninguna configuración de mazo se puede usar antes de obtener el bastón', () => {
  const s = store();
  s.setItem(DECK_STORAGE_KEY, JSON.stringify({version:1,slots:[{mysticId:'general-1',replace:'ATTACK'}]}));
  assert.deepEqual(loadMysticSlots(s, completeThrough(34)), []);
  assert.equal(saveMysticSlots(s, [{mysticId:'general-1',replace:'ATTACK'}], completeThrough(34)), false);
});

test('el editor valida premios reales, no duplica cartas y protege Impactos', () => {
  const progress = completeThrough(36);
  const raw = [
    { mysticId:'general-1', replace:'ATTACK' }, { mysticId:'general-1', replace:'DEFENSE' },
    { mysticId:'siguman-1', replace:'ORDER' }, { mysticId:'general-3', replace:'IMPACT' },
    { mysticId:'general-2', replace:'DEFENSE' }, { mysticId:'legado-zhinchi', replace:'ORDER' },
    { mysticId:'general-8', replace:'ATTACK' },
  ];
  assert.deepEqual(validateMysticSlots(raw, progress), [
    {mysticId:'general-1',replace:'ATTACK'},
    {mysticId:'general-2',replace:'DEFENSE'},
    {mysticId:'legado-zhinchi',replace:'ORDER'},
  ]);
  const s = store();
  const legal = validateMysticSlots(raw, progress);
  assert.equal(saveMysticSlots(s, legal, progress), true);
  assert.deepEqual(loadMysticSlots(s, progress), legal);
  assert.equal(saveMysticSlots(s, [{mysticId:'siguman-1',replace:'ATTACK'}], progress), false);
  assert.equal(saveMysticSlots(s, [...legal,legal[0]], progress), false);
});

test('un guardado corrupto no rompe la campaña ni desbloquea místicas', () => {
  const s = store();
  s.setItem(DECK_STORAGE_KEY,'{bad');
  assert.deepEqual(loadMysticSlots(s,completeThrough(36)),[]);
  s.setItem(DECK_STORAGE_KEY, JSON.stringify({version:999,slots:[{mysticId:'general-1',replace:'ATTACK'}]}));
  assert.deepEqual(loadMysticSlots(s,completeThrough(36)),[]);
});
