import assert from 'node:assert/strict';
import test from 'node:test';
import { STORY_CHAPTERS, STORY_STAGES } from './story.ts';
import {
  CAMPAIGN_MISSIONS, CAMPAIGN_STORAGE_KEY, awardMissionStars, bestStars,
  calculateMissionStars, emptyCampaignProgress, getCampaignMission,
  isMissionUnlocked, loadCampaignProgress, saveCampaignProgress,
} from './campaign.ts';

test('campaign has 38 unique deterministic missions across the canonical 10 chapters', () => {
  assert.equal(CAMPAIGN_MISSIONS.length, 38);
  assert.equal(STORY_CHAPTERS.length, 10);
  assert.equal(STORY_STAGES.length, 38);
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.id)).size, 38);
  assert.equal(new Set(CAMPAIGN_MISSIONS.map(m => m.seed)).size, 38);
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

test('all eight canonical generals and their special-card labels appear as boss episodes', () => {
  const expected = [
    ['Almirante de Hierro', 'Bombardeo naval'],
    ['Jinete Escarlata', 'Carga de caballería'],
    ['Señor de la Plata', 'Pólvora enterrada'],
    ['Artillero del Trueno', 'Fuego concentrado'],
    ['Fantasma de la Selva', 'Sendero secreto'],
    ['Dama del Estandarte', 'Estandarte de resistencia'],
    ['Cóndor de los Andes', 'Ataque de las cumbres'],
    ['Caballero del Juramento', 'Último juramento'],
  ];
  const generals = STORY_CHAPTERS.filter(chapter => chapter.general);
  assert.equal(generals.length, expected.length);
  for (const [general, specialCard] of expected) {
    assert.ok(generals.some(chapter => chapter.general === general && chapter.specialCard === specialCard));
    assert.equal(STORY_STAGES.filter(stage => stage.kind === 'boss' && stage.opponent === general).length, 1);
  }
  assert.equal(STORY_STAGES[STORY_STAGES.length - 1].opponent, 'Sigma');
});

test('chapters contain two prologue, four stages per general, and four finales', () => {
  assert.equal(STORY_STAGES.filter(stage => stage.chapterId === 'p').length, 2);
  for (let chapter = 1; chapter <= 8; chapter++) {
    assert.equal(STORY_STAGES.filter(stage => stage.chapterId === String(chapter)).length, 4);
  }
  assert.equal(STORY_STAGES.filter(stage => stage.chapterId === 'f').length, 4);
});
