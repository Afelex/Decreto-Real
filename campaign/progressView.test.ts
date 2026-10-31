import assert from 'node:assert/strict';
import test from 'node:test';
import {
  awardMissionStars, emptyCampaignProgress, getCampaignMission,
} from './campaign.ts';
import { campaignOverview, missionStarGoals } from './progressView.ts';

test('new campaign shows first stage and zero progress', () => {
  const summary = campaignOverview(emptyCampaignProgress());
  assert.equal(summary.completed, 0);
  assert.equal(summary.stars, 0);
  assert.equal(summary.total, 38);
  assert.equal(summary.maximumStars, 114);
  assert.equal(summary.percentage, 0);
  assert.equal(summary.nextMission?.id, '01');
  assert.equal(summary.completedCampaign, false);
});

test('first victory advances next mission without requiring three stars', () => {
  let progress = emptyCampaignProgress();
  progress = awardMissionStars(progress, '01', 1);
  progress = awardMissionStars(progress, '02', 3);
  const summary = campaignOverview(progress);
  assert.equal(summary.completed, 2);
  assert.equal(summary.stars, 4);
  assert.equal(summary.nextMission?.id, '03');
  assert.equal(summary.percentage, Math.round(2 / 38 * 100));
});

test('unearned later stars do not inflate campaign progress or skip locked missions', () => {
  const forged = { version: 1 as const, stars: { '01': 2, '03': 3, '38': 3 } };
  const summary = campaignOverview(forged);
  assert.equal(summary.completed, 1);
  assert.equal(summary.stars, 2);
  assert.equal(summary.nextMission?.id, '02');
  assert.equal(summary.completedCampaign, false);
});

test('completed campaign shows all 38 victories and 114 available stars', () => {
  let progress = emptyCampaignProgress();
  for (const mission of Array.from({length: 38},(_, i)=>String(i + 1).padStart(2, '0'))) {
    progress = awardMissionStars(progress, mission, 3);
  }
  const summary = campaignOverview(progress);
  assert.equal(summary.completed, 38);
  assert.equal(summary.stars, 114);
  assert.equal(summary.percentage, 100);
  assert.equal(summary.nextMission, null);
  assert.equal(summary.completedCampaign, true);
});

test('objectives reflect the current rules for all stage types', () => {
  for (const id of ['01', '06', '38']) {
    const mission = getCampaignMission(id)!;
    const objectives = missionStarGoals(mission);
    assert.deepEqual(objectives.map(goal => goal.id), ['victory','health','turns']);
    assert.equal(objectives[0].label, 'Gana el duelo');
    assert.equal(objectives[1].label, `Conserva al menos ${Math.ceil(mission.healthGoal / 2)} de vida`);
    assert.equal(objectives[2].label, `Gana en ${mission.turnGoal} rondas o menos`);
  }
});
