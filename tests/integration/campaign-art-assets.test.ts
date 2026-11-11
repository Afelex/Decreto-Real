import { expect, test } from 'vitest';
import { STORY_STAGES } from '../../campaign/story.ts';
import { g2AssetIsPublished, G2_REGION_BASE, G2_REGION_BOSS, G2_FINAL_SCENES } from '../../campaign/g2Artwork.ts';
import { ENEMY_ROSTER } from '../../campaign/characters.ts';
import {
  CAMPAIGN_LANDSCAPE_FILES, campaignLandscape, campaignMissionBackground,
  campaignOpponentPortrait,
} from '../../campaign/regionAssets.ts';

test('each of the nine campaign regions displays its base illustration on the mission map', () => {
  const chapters = ['1', '2', '3', '4', '5', '6', '7', '8', 'f'] as const;
  for (const id of chapters) {
    expect(CAMPAIGN_LANDSCAPE_FILES[id]).toBe(`arte/fondos/region-${id}-base.webp`);
    const g2=(G2_REGION_BASE as Record<string, keyof typeof import('../../campaign/g2Artwork.ts').G2_ASSET_PATHS>)[id];
    expect(campaignLandscape(id)).toContain(g2AssetIsPublished(g2) ? 'DR-G2-2026/' : `campania/arte/fondos/region-${id}-base.webp`);
  }
  expect(campaignLandscape('p')).toContain('campania/prologo-ruta.svg');
});

test('only the eight generals and Sigumán receive the distinct boss background', () => {
  const bosses = new Set(['06', '10', '14', '18', '22', '26', '30', '34', '38']);
  const active = STORY_STAGES.filter(stage => stage.chapterId !== 'p');
  expect(active).toHaveLength(36);
  for (const stage of active) {
    const expected = bosses.has(stage.id) ? 'jefe' : 'base';
    const specials=G2_FINAL_SCENES as Record<string,{duel:keyof typeof import('../../campaign/g2Artwork.ts').G2_ASSET_PATHS}>;
    const id=specials[stage.id]?.duel ??
      (expected==='jefe' ? G2_REGION_BOSS : G2_REGION_BASE)[stage.chapterId as keyof typeof G2_REGION_BASE];
    expect(campaignMissionBackground(stage.id)).toContain(g2AssetIsPublished(id) ? 'DR-G2-2026/' : `region-${stage.chapterId}-${expected}.webp`);
  }
  expect(campaignMissionBackground('01')).toBe(g2AssetIsPublished('G2-FON-002')
    ? expect.stringContaining('/fondos/prologo-plaza-del-pregon.webp') : undefined);
  expect(campaignMissionBackground('02')).toBe(g2AssetIsPublished('G2-FON-001')
    ? expect.stringContaining('/fondos/prologo-camino-real-de-los-reinos-del-peru.webp') : undefined);
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
