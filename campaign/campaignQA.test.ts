import assert from 'node:assert/strict';
import { test } from 'node:test';
import { CAMPAIGN_MISSIONS, CAMPAIGN_STORAGE_KEY, bestStars, isMissionUnlocked, loadCampaignProgress, validatedCampaignProgress } from './campaign.ts';
import { QA_CAMPAIGN_DESTINATIONS, QA_CAMPAIGN_GROUPS, getCampaignStorage, isCampaignQaActive, qaPreviewProgress, startCampaignQaAt, stopCampaignQa } from './campaignQA.ts';
import { stagesForChapter } from './story.ts';

test('QA covers every briefing, fight and post-victory dialogue for all 38 missions', () => {
  assert.equal(CAMPAIGN_MISSIONS.length, 38);
  assert.equal(QA_CAMPAIGN_DESTINATIONS.length, new Set(QA_CAMPAIGN_DESTINATIONS.map(d => d.id)).size);
  for (const mission of CAMPAIGN_MISSIONS) {
    for (const prefix of ['mision', 'duelo', 'dialogo']) {
      assert.ok(QA_CAMPAIGN_DESTINATIONS.some(target => target.id === `${prefix}-${mission.id}`), `${prefix} ${mission.id}`);
    }
  }
  assert.equal(QA_CAMPAIGN_GROUPS.filter(group => group.startsWith('Región ')).length, 8);
  assert.ok(QA_CAMPAIGN_DESTINATIONS.some(d => d.id === 'creditos'));
});

test('All jump targets seed authentic prerequisite progress, without unlocking unrelated regions', () => {
  for (const target of QA_CAMPAIGN_DESTINATIONS) {
    const progress = qaPreviewProgress(target);
    assert.deepEqual(validatedCampaignProgress(progress), progress, target.id);
    const mission = /\/campania\/mision\/(\\d+)/.exec(target.path);
    if (mission) assert.equal(isMissionUnlocked(progress, mission[1]), true, target.id);
    const conversation = /\/campania\/conversacion\/(\\d+)/.exec(target.path);
    if (conversation) assert.ok(bestStars(progress, conversation[1]) > 0, target.id);
    const region = /\/campania\/liberada\/(\\d+)/.exec(target.path);
    if (region) assert.ok(stagesForChapter(region[1]).every(stage => bestStars(progress, stage.id) > 0), target.id);
    if (target.id === 'revelacion-final') assert.equal(isMissionUnlocked(progress, '35'), true);
    if (target.id === 'epilogo') assert.ok(CAMPAIGN_MISSIONS.every(m => bestStars(progress, m.id) > 0));
  }
  const region7 = QA_CAMPAIGN_DESTINATIONS.find(d => d.id === 'mision-27')!;
  const progress7 = qaPreviewProgress(region7);
  assert.equal(bestStars(progress7, '03'), 0, 'jumping to one region must not fabricate victories in the others');
});

test('QA uses sessionStorage and leaves localStorage and its original player save intact', () => {
  class MemoryStorage {
    private map = new Map<string, string>();
    getItem(key: string) { return this.map.get(key) ?? null; }
    setItem(key: string, value: string) { this.map.set(key, String(value)); }
    removeItem(key: string) { this.map.delete(key); }
  }
  const originalWindow = globalThis.window;
  const local = new MemoryStorage(), session = new MemoryStorage();
  const playerSaved = { version: 1, stars: { '01': 3 } };
  local.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify(playerSaved));
  Object.assign(globalThis, { window: {
    location: { search: '?drDev=1' }, localStorage: local, sessionStorage: session,
  } });
  try {
    const boss = QA_CAMPAIGN_DESTINATIONS.find(target => target.id === 'mision-30')!;
    assert.ok(startCampaignQaAt(boss));
    assert.equal(isCampaignQaActive(), true);
    assert.equal(getCampaignStorage(), session);
    assert.equal(isMissionUnlocked(loadCampaignProgress(getCampaignStorage()), '30'), true);
    assert.equal(local.getItem(CAMPAIGN_STORAGE_KEY), JSON.stringify(playerSaved));
    stopCampaignQa();
    assert.equal(getCampaignStorage(), local);
    assert.equal(local.getItem(CAMPAIGN_STORAGE_KEY), JSON.stringify(playerSaved));
    assert.equal(session.getItem(CAMPAIGN_STORAGE_KEY), null);
  } finally {
    Object.assign(globalThis, { window: originalWindow });
  }
});
