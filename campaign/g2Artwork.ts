/** Decreto Real G2 · catálogo de fondos aprobados (20 regionales + 5 escenas M35/36).
 * Las rutas están declaradas pero NO se activan hasta instalar los WebP y
 * regenerar g2Published.ts con tools/importar-g2.mjs. El arte G1 sigue intacto.
 */
import { G2_PUBLISHED_IDS } from './g2Published.ts';

export const G2_ASSET_PATHS = Object.freeze({
  'G2-FON-001': 'artes/generaciones/DR-G2-2026/fondos/prologo-camino-real-de-los-reinos-del-peru.webp',
  'G2-FON-002': 'artes/generaciones/DR-G2-2026/fondos/prologo-plaza-del-pregon.webp',
  'G2-FON-003': 'artes/generaciones/DR-G2-2026/fondos/region-1-base.webp',
  'G2-FON-004': 'artes/generaciones/DR-G2-2026/fondos/region-1-jefe.webp',
  'G2-FON-005': 'artes/generaciones/DR-G2-2026/fondos/region-2-base.webp',
  'G2-FON-006': 'artes/generaciones/DR-G2-2026/fondos/region-2-jefe.webp',
  'G2-FON-007': 'artes/generaciones/DR-G2-2026/fondos/region-3-base.webp',
  'G2-FON-008': 'artes/generaciones/DR-G2-2026/fondos/region-3-jefe.webp',
  'G2-FON-009': 'artes/generaciones/DR-G2-2026/fondos/region-4-base.webp',
  'G2-FON-010': 'artes/generaciones/DR-G2-2026/fondos/region-4-jefe.webp',
  'G2-FON-011': 'artes/generaciones/DR-G2-2026/fondos/region-5-base.webp',
  'G2-FON-012': 'artes/generaciones/DR-G2-2026/fondos/region-5-jefe.webp',
  'G2-FON-013': 'artes/generaciones/DR-G2-2026/fondos/region-6-base.webp',
  'G2-FON-014': 'artes/generaciones/DR-G2-2026/fondos/region-6-jefe.webp',
  'G2-FON-015': 'artes/generaciones/DR-G2-2026/fondos/region-7-base.webp',
  'G2-FON-016': 'artes/generaciones/DR-G2-2026/fondos/region-7-jefe.webp',
  'G2-FON-017': 'artes/generaciones/DR-G2-2026/fondos/region-8-base.webp',
  'G2-FON-018': 'artes/generaciones/DR-G2-2026/fondos/region-8-jefe.webp',
  'G2-FON-019': 'artes/generaciones/DR-G2-2026/fondos/region-f-base.webp',
  'G2-FON-020': 'artes/generaciones/DR-G2-2026/fondos/region-f-jefe.webp',
  'G2-M35-A': 'artes/generaciones/DR-G2-2026/fondos-especiales/G2-M35-A.webp',
  'G2-M35-B': 'artes/generaciones/DR-G2-2026/fondos-especiales/G2-M35-B.webp',
  'G2-M35-C': 'artes/generaciones/DR-G2-2026/fondos-especiales/G2-M35-C.webp',
  'G2-M36-A': 'artes/generaciones/DR-G2-2026/fondos-especiales/G2-M36-A.webp',
  'G2-M36-B': 'artes/generaciones/DR-G2-2026/fondos-especiales/G2-M36-B.webp',
} as const);

export type G2AssetId = keyof typeof G2_ASSET_PATHS;

const published = new Set<string>(G2_PUBLISHED_IDS);
export function g2AssetPath(id:G2AssetId):string { return G2_ASSET_PATHS[id]; }
export function g2AssetIsPublished(id:G2AssetId):boolean { return published.has(id); }
export function g2AssetUrl(id:G2AssetId,base:string=import.meta.env.BASE_URL):string|undefined {
  if (!g2AssetIsPublished(id)) return undefined;
  return base + g2AssetPath(id);
}

export const G2_REGION_BASE = Object.freeze({
  '1':'G2-FON-003','2':'G2-FON-005','3':'G2-FON-007',
  '4':'G2-FON-009','5':'G2-FON-011','6':'G2-FON-013',
  '7':'G2-FON-015','8':'G2-FON-017','f':'G2-FON-019',
} as const satisfies Record<string,G2AssetId>);
export const G2_REGION_BOSS = Object.freeze({
  '1':'G2-FON-004','2':'G2-FON-006','3':'G2-FON-008',
  '4':'G2-FON-010','5':'G2-FON-012','6':'G2-FON-014',
  '7':'G2-FON-016','8':'G2-FON-018','f':'G2-FON-020',
} as const satisfies Record<string,G2AssetId>);

export function g2RegionalUrl(region:string,variant:'base'|'jefe'):string|undefined {
  const map:Readonly<Record<string,G2AssetId>>=variant==='jefe'?G2_REGION_BOSS:G2_REGION_BASE;
  return map[region]?g2AssetUrl(map[region]):undefined;
}

export const G2_FINAL_SCENES = Object.freeze({
  '35':{briefing:'G2-M35-A',duel:'G2-M35-C',victory:'G2-M35-C'},
  '36':{briefing:'G2-M36-A',duel:'G2-M36-B',victory:'G2-M36-B'},
  '37':{briefing:'G2-FON-019',duel:'G2-FON-019',victory:'G2-FON-019'},
  '38':{briefing:'G2-FON-020',duel:'G2-FON-020',victory:'G2-FON-020'},
} as const satisfies Record<string,{briefing:G2AssetId;duel:G2AssetId;victory:G2AssetId}>);
export type G2FinalScene = 'briefing'|'duel'|'victory';
export function g2FinalSceneUrl(missionId:string,scene:G2FinalScene):string|undefined {
  const final:Readonly<Record<string,Readonly<Record<G2FinalScene,G2AssetId>>>>=G2_FINAL_SCENES;
  const id=final[missionId]?.[scene];
  return id?g2AssetUrl(id):undefined;
}

/** Misma casona, encuadre estable: Zhinchi -> derrumbe -> Xervias vs. Vándalo.
 * Estos cambios de fondo afectan solo la presentación, nunca el motor DR-01.
 */
export function g2FinalPreludeUrl(missionId:string,lineIndex:number):string|undefined {
  if(missionId==='35'){
    const id:G2AssetId=lineIndex>=10?'G2-M35-C':lineIndex>=5?'G2-M35-B':'G2-M35-A';
    return g2AssetUrl(id);
  }
  if(missionId==='36')return g2AssetUrl(lineIndex===0?'G2-M36-A':'G2-M36-B');
  return g2FinalSceneUrl(missionId,'briefing');
}
