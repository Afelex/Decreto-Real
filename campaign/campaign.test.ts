import assert from 'node:assert/strict';
import test from 'node:test';
import {
  CAMPAIGN_MISSIONS, CAMPAIGN_STORAGE_KEY, awardMissionStars, bestStars,
  calculateMissionStars, emptyCampaignProgress, getCampaignMission,
  isMissionUnlocked, loadCampaignProgress, saveCampaignProgress,
} from './campaign.ts';

test('chapter has eight unique deterministic missions with valid goals', () => {
  assert.equal(CAMPAIGN_MISSIONS.length, 8);
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.id)).size, 8);
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.seed)).size, 8);
  for (const mission of CAMPAIGN_MISSIONS) {
    assert.ok(mission.healthGoal >= 1 && mission.healthGoal <= 20);
    assert.ok(mission.turnGoal >= 1);
  }
});

test('only first mission is unlocked before first victory', () => {
  const progress = emptyCampaignProgress();
  assert.equal(isMissionUnlocked(progress, '01'), true);
  assert.equal(isMissionUnlocked(progress, '02'), false);
  assert.equal(isMissionUnlocked(progress, '08'), false);
  assert.equal(isMissionUnlocked(progress, 'missing'), false);
});

test('one star unlocks the next mission; three are not required', () => {
  const progress = awardMissionStars(emptyCampaignProgress(), '01', 1);
  assert.equal(bestStars(progress, '01'), 1);
  assert.equal(isMissionUnlocked(progress, '02'), true);
  assert.equal(isMissionUnlocked(progress, '03'), false);
  assert.equal(isMissionUnlocked(awardMissionStars(progress, '02', 1), '03'), true);
});

test('repeating a mission can improve but cannot reduce the best stars', () => {
  const first = awardMissionStars(emptyCampaignProgress(), '01', 3);
  const second = awardMissionStars(first, '01', 1);
  assert.equal(bestStars(second, '01'), 3);
  assert.deepEqual(first, second);
  assert.strictEqual(awardMissionStars(first, 'not-found', 3), first);
  assert.strictEqual(awardMissionStars(first, '01', 4), first);
});

test('stars are based on actual victory, remaining life and number of turns', () => {
  const mission = getCampaignMission('01')!;
  assert.equal(calculateMissionStars(mission, { winner: 'rival', playerHp: 20, turn: 1 }), 0);
  assert.equal(calculateMissionStars(mission, { winner: 'player', playerHp: 1, turn: 20 }), 1);
  assert.equal(calculateMissionStars(mission, { winner: 'player', playerHp: 20, turn: 20 }), 2);
  assert.equal(calculateMissionStars(mission, { winner: 'player', playerHp: 1, turn: 1 }), 2);
  assert.equal(calculateMissionStars(mission, { winner: 'player', playerHp: 20, turn: 1 }), 3);
});

test('progress survives a new read through local storage', () => {
  const values = new Map<string, string>();
  const storage = { getItem: (key: string) => values.get(key) ?? null, setItem: (key: string, v: string) => { values.set(key, v); } };
  const earned = awardMissionStars(emptyCampaignProgress(), '01', 2);
  assert.equal(saveCampaignProgress(storage, earned), true);
  assert.deepEqual(loadCampaignProgress(storage), earned);
  assert.ok(values.has(CAMPAIGN_STORAGE_KEY));
});

test('corrupt, incompatible or inaccessible storage does not crash the campaign', () => {
  const storage = { getItem: () => '{corrupt', setItem: () => { throw new Error('Quota exceeded'); } };
  assert.deepEqual(loadCampaignProgress(storage), emptyCampaignProgress());
  assert.equal(saveCampaignProgress(storage, emptyCampaignProgress()), false);
  assert.deepEqual(loadCampaignProgress(null), emptyCampaignProgress());
  assert.deepEqual(loadCampaignProgress({ getItem: () => '{"version":2,"stars":{"01":3}}', setItem: () => {} }), emptyCampaignProgress());
});

test('unknown keys and invalid star counts are discarded', () => {
  const storage = {
    getItem: () => '{"version":1,"stars":{"01":2,"02":500,"other":3}}',
    setItem: () => {},
  };
  assert.deepEqual(loadCampaignProgress(storage).stars, { '01': 2 });
});
