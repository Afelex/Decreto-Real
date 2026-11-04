/** Single manifest for replacing temporary campaign vector art.
 * Replace an SVG with WebP/PNG/JPEG later by updating only the file name here.
 * Layout, story state, mission hit targets and duel rules are independent.
 */
export const CAMPAIGN_LANDSCAPE_FILES = {
  p: 'prologo-ruta.svg',
  '1': 'regiones/region-1.svg',
  '2': 'regiones/region-2.svg',
  '3': 'regiones/region-3.svg',
  '4': 'regiones/region-4.svg',
  '5': 'regiones/region-5.svg',
  '6': 'regiones/region-6.svg',
  '7': 'regiones/region-7.svg',
  '8': 'regiones/region-8.svg',
  f: 'regiones/region-f.svg',
} as const;

export type CampaignArtworkId = keyof typeof CAMPAIGN_LANDSCAPE_FILES;

export function campaignLandscape(chapterId: string | undefined): string {
  const id: CampaignArtworkId = chapterId && Object.prototype.hasOwnProperty.call(CAMPAIGN_LANDSCAPE_FILES, chapterId)
    ? chapterId as CampaignArtworkId
    : 'p';
  return `${import.meta.env.BASE_URL}campania/${CAMPAIGN_LANDSCAPE_FILES[id]}`;
}

/** Layout targets, not minimum resolution requirements. */
export const CAMPAIGN_ART_BASE_SIZES = {
  prologue: { width: 768, height: 1120 },
  region: { width: 720, height: 1100 },
  hub: { width: 941, height: 1672 },
} as const;
