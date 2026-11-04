import { expect, test } from 'vitest';
import { STORY_STAGES } from '../../campaign/story.ts';
import { ENEMY_ROSTER } from '../../campaign/characters.ts';
import {
  CAMPAIGN_LANDSCAPE_FILES, campaignLandscape, campaignMissionBackground,
  campaignOpponentPortrait,
} from '../../campaign/regionAssets.ts';

test('each of the nine campaign regions displays its base illustration on the mission map', () => {
  const chapters = ['1', '2', '3', '4', '5', '6', '7', '8', 'f'] as const;
  for (const id of chapters) {
    expect(CAMPAIGN_LANDSCAPE_FILES[id]).toBe(`arte/fondos/region-${id}-base.webp`);
    expect(campaignLandscape(id)).toContain(`campania/arte/fondos/region-${id}-base.webp`);
  }
  expect(campaignLandscape('p')).toContain('campania/prologo-ruta.svg');
});

test('only the eight generals and Sigumán receive the distinct boss background', () => {
  const bosses = new Set(['06', '10', '14', '18', '22', '26', '30', '34', '38']);
  const active = STORY_STAGES.filter(stage => stage.chapterId !== 'p');
  expect(active).toHaveLength(36);
  for (const stage of active) {
    const expected = bosses.has(stage.id) ? 'jefe' : 'base';
    expect(campaignMissionBackground(stage.id)).toContain(
      `region-${stage.chapterId}-${expected}.webp`
    );
  }
  expect(campaignMissionBackground('01')).toBeUndefined();
  expect(campaignMissionBackground('02')).toBeUndefined();
});

test('every non-general opponent uses exactly the image file generated for their mission', () => {
  const bosses = new Set(['06', '10', '14', '18', '22', '26', '30', '34', '38']);
  const opponents = ENEMY_ROSTER.filter(enemy => !bosses.has(enemy.missionId));
  expect(opponents).toHaveLength(29);
  for (const enemy of opponents) {
    const slug = enemy.name.toLowerCase().normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
    expect(campaignOpponentPortrait(enemy.missionId)).toContain(
      `campania/arte/retratos/rival-${enemy.missionId}-${slug}.webp`
    );
  }
  for (const id of bosses) expect(campaignOpponentPortrait(id)).toBeUndefined();
});
