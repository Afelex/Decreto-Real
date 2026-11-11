import { g2AssetUrl, g2FinalSceneUrl, g2FinalPreludeUrl, g2RegionalUrl } from './g2Artwork.ts';
/** Campaign scenery and rival portraits. 47 approved assets from GitHub Actions run 41921898124.
 * Battle scenes remain separate from the regional map; prologue retains its own illustration.
 * All generated assets are served from Vite's public/campania/arte/ folder.
 */
import { ENEMY_ROSTER } from './characters.ts';
import { STORY_STAGES } from './story.ts';

export const CAMPAIGN_LANDSCAPE_FILES = {
  p: 'prologo-ruta.svg',
  '1': 'arte/fondos/region-1-base.webp',
  '2': 'arte/fondos/region-2-base.webp',
  '3': 'arte/fondos/region-3-base.webp',
  '4': 'arte/fondos/region-4-base.webp',
  '5': 'arte/fondos/region-5-base.webp',
  '6': 'arte/fondos/region-6-base.webp',
  '7': 'arte/fondos/region-7-base.webp',
  '8': 'arte/fondos/region-8-base.webp',
  f: 'arte/fondos/region-f-base.webp',
} as const;

export type CampaignArtworkId = keyof typeof CAMPAIGN_LANDSCAPE_FILES;

export function campaignLandscape(chapterId: string | undefined): string {
  const id: CampaignArtworkId = chapterId && Object.prototype.hasOwnProperty.call(CAMPAIGN_LANDSCAPE_FILES, chapterId)
    ? chapterId as CampaignArtworkId : 'p';
  return g2RegionalUrl(id,'base') ?? `${import.meta.env.BASE_URL}campania/${CAMPAIGN_LANDSCAPE_FILES[id]}`;
}

/** Boss stages have their own battle arena; the final chapter uses its boss arena only against Sigumán. */
export function campaignMissionBackground(missionId: string): string | undefined {
  const stage = STORY_STAGES.find(item => item.id === missionId);
  if (!stage) return undefined;
  // Los dos fondos del prólogo pertenecen a misiones jugables; conservar G1
  // automáticamente si los WebP G2 aún no están publicados.
  if (stage.chapterId === 'p') {
    if (missionId === '01') return g2AssetUrl('G2-FON-002');
    if (missionId === '02') return g2AssetUrl('G2-FON-001');
    return undefined;
  }
  const finalG2=g2FinalSceneUrl(missionId,'duel');
  if (finalG2) return finalG2;
  const variant = stage.kind === 'boss' || stage.kind === 'final' ? 'jefe' : 'base';
  return g2RegionalUrl(stage.chapterId,variant) ?? `${import.meta.env.BASE_URL}campania/arte/fondos/region-${stage.chapterId}-${variant}.webp`;
}

const rivalSlug = (name: string): string => name.toLowerCase().normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');

/** No portrait was generated for the eight generals or Sigumán; preserve their existing presentation. */
export function campaignOpponentPortrait(missionId: string): string | undefined {
  const stage = STORY_STAGES.find(item => item.id === missionId);
  if (!stage || stage.kind === 'boss' || stage.chapterId === 'f') return undefined;
  const enemy = ENEMY_ROSTER.find(item => item.missionId === missionId);
  if (!enemy) return undefined;
  return `${import.meta.env.BASE_URL}campania/arte/retratos/rival-${enemy.missionId}-${rivalSlug(enemy.name)}.webp`;
}

/** Layout targets, not minimum resolution requirements. */
export const CAMPAIGN_ART_BASE_SIZES = {
  prologue: { width: 768, height: 1120 },
  region: { width: 720, height: 1100 },
  hub: { width: 941, height: 1672 },
} as const;

/** Fondo inicial de la misión. M35 y M36 se muestran antes del duelo con su escena propia. */
export function campaignMissionBriefingBackground(missionId:string):string|undefined {
  return g2FinalSceneUrl(missionId,'briefing')??campaignMissionBackground(missionId);
}

/** Cambia el estado visual del preludio sin alterar la escena ni el motor. */
export function campaignMissionPreludeBackground(missionId:string,lineIndex:number):string|undefined {
  return g2FinalPreludeUrl(missionId,lineIndex)??campaignMissionBackground(missionId);
}
