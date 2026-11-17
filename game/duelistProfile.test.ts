import test from 'node:test';
import assert from 'node:assert/strict';
import { cleanName, emptyProfile, loadDuelistProfile, saveDuelistProfile,
  isUnlocked, COSMETICS, rewardMatch, validAppearance } from './duelistProfile.ts';

test('migrates the prior nickname and keeps one player with at most four loadouts', () => {
  const store = new Map([['decreto-real.pvp.nickname.v1', 'Alfredo']]);
  const storage = { getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => { store.set(key, value); } };
  const profile = loadDuelistProfile(storage);
  assert.equal(profile.slots[0].name, 'Alfredo');
  profile.slots = [{ name: 'Alfredito', appearance: profile.slots[0].appearance },
    { name: 'Alfredo', appearance: profile.slots[0].appearance },
    { name: 'Alfred003', appearance: profile.slots[0].appearance },
    { name: 'Competidor', appearance: profile.slots[0].appearance },
    { name: 'Quinto', appearance: profile.slots[0].appearance }];
  profile.active = 2;
  assert.equal(saveDuelistProfile(profile, storage), true);
  const again = loadDuelistProfile(storage);
  assert.equal(again.slots.length, 4);
  assert.equal(again.slots[again.active].name, 'Alfred003');
  assert.equal(store.get('decreto-real.pvp.nickname.v1'), 'Alfred003');
});

test('cosmetic rewards never authorize unearned items', () => {
  let profile = emptyProfile('Duelista');
  const rare = COSMETICS.nameFx.find(item => item.id === 'particulas')!;
  assert.equal(isUnlocked(profile, rare), false);
  assert.equal(validAppearance({ nameFx: 'particulas' }, profile).nameFx, 'clasico');
  const id1 = 'ab'.repeat(12), id2 = 'cd'.repeat(12), id3 = 'ef'.repeat(12);
  profile = rewardMatch(profile, id1, true, 4);
  profile = rewardMatch(profile, id1, true, 4);
  assert.equal(profile.progress.matches, 1, 'no double reward on repeated state');
  profile = rewardMatch(profile, id2, true, 4);
  profile = rewardMatch(profile, id3, true, 4);
  assert.equal(profile.progress.wins, 3);
  assert.equal(profile.progress.impacts, 12);
  assert.equal(isUnlocked(profile, rare), true);
  assert.equal(validAppearance({ nameFx: 'particulas' }, profile).nameFx, 'particulas');
  assert.equal(cleanName('<A>lfredo'), 'Alfredo');
});
