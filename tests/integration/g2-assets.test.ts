import { expect, test } from 'vitest';
import { G2_ASSET_PATHS, G2_REGION_BASE, G2_REGION_BOSS, G2_FINAL_SCENES, g2AssetIsPublished, g2FinalPreludeUrl } from '../../campaign/g2Artwork.ts';
import { campaignMissionBackground, campaignMissionBriefingBackground, campaignMissionPreludeBackground } from '../../campaign/regionAssets.ts';

test('G2 tracks 20 regional or prologue backgrounds and five M35–M36 scenarios',()=>{
  expect(Object.keys(G2_ASSET_PATHS)).toHaveLength(25);
  expect(Object.keys(G2_REGION_BASE)).toHaveLength(9);
  expect(Object.keys(G2_REGION_BOSS)).toHaveLength(9);
  for(const value of Object.values(G2_ASSET_PATHS))expect(value).toMatch(/^artes\/generaciones\/DR-G2-2026\/.*\.webp$/);
});
test('M35/M36 have distinct briefing and duel IDs',()=>{
  expect(G2_FINAL_SCENES['35']).toEqual({briefing:'G2-M35-A',duel:'G2-M35-C',victory:'G2-M35-C'});
  expect(G2_FINAL_SCENES['36']).toEqual({briefing:'G2-M36-A',duel:'G2-M36-B',victory:'G2-M36-B'});
});
test('Without binaries installed, G1 presentation continues to work',()=>{
  if(!g2AssetIsPublished('G2-M35-A')){
    expect(g2FinalPreludeUrl('35',3)).toBeUndefined();
    expect(campaignMissionBackground('35')).toContain('region-f-base.webp');
    expect(campaignMissionBackground('36')).toContain('region-f-base.webp');
  }else{
    expect(g2FinalPreludeUrl('35',3)).toContain('G2-M35-A.webp');
    expect(campaignMissionBackground('35')).toContain('G2-M35-C.webp');
    expect(campaignMissionBackground('36')).toContain('G2-M36-B.webp');
  }
  expect(campaignMissionBriefingBackground('35')).toBeDefined();
  expect(campaignMissionPreludeBackground('35',10)).toBeDefined();
});
