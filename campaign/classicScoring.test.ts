import assert from 'node:assert/strict';
import test from 'node:test';
import { getCampaignMission } from './campaign.ts';
import { calculateClassicMissionStars, classicHealthGoal, classicRoundCount } from './classicScoring.ts';

test('the 10-HP original game uses attainable health goals in every campaign stage', () => {
  for (let i=1; i<=38; i++) {
    const mission = getCampaignMission(String(i).padStart(2,'0'))!;
    assert.ok(classicHealthGoal(mission) >= 1 && classicHealthGoal(mission) <= 10);
  }
  assert.equal(classicHealthGoal(getCampaignMission('01')!), 6);
});

test('one original victory always advances and earns two optional stars correctly', () => {
  const mission = getCampaignMission('01')!;
  assert.equal(calculateClassicMissionStars(mission, {won: false, turns: 2, health: 10}), 0);
  assert.equal(calculateClassicMissionStars(mission, {won: true, turns: 50, health: 1}), 1);
  assert.equal(calculateClassicMissionStars(mission, {won: true, turns: 50, health: 8}), 2);
  assert.equal(calculateClassicMissionStars(mission, {won: true, turns: 7, health: 8}), 3);
  assert.equal(calculateClassicMissionStars(mission, {won: true, turns: 20, health: 6}), 3);
  assert.equal(calculateClassicMissionStars(mission, {won: true, turns: 21, health: 6}), 2);
});

test('original alternating player/opponent turn count is mapped to game rounds', () => {
  assert.equal(classicRoundCount(0),0);
  assert.equal(classicRoundCount(1),1);
  assert.equal(classicRoundCount(2),1);
  assert.equal(classicRoundCount(3),2);
  assert.equal(classicRoundCount(20),10);
  assert.equal(classicRoundCount(21),11);
});
