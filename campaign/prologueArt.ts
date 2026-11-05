/** Prologue art: fixed file names map to the 23 API-generated assets.
 * The story never imports the (large) prompt catalog into the client bundle.
 * The published manifest enables all sprites together only when the full batch exists.
 */
export const PROLOGUE_ART_FILES = {
  "D01": "sprites/domingo_01_neutro.webp",
  "D02": "sprites/domingo_02_arrogante.webp",
  "D03": "sprites/domingo_03_furioso.webp",
  "D04": "sprites/domingo_04_derrotado.webp",
  "M01": "sprites/madre_01_protectora.webp",
  "M02": "sprites/madre_02_suplicante.webp",
  "N01": "sprites/nino_01_asustado.webp",
  "M03": "sprites/madre_03_asustada.webp",
  "M04": "sprites/madre_04_aliviada.webp",
  "N02": "sprites/nino_02_aliviado.webp",
  "Z01": "sprites/zhinchi_01_entrada.webp",
  "Z02": "sprites/zhinchi_02_investiga.webp",
  "Z03": "sprites/zhinchi_03_cetro.webp",
  "Z04": "sprites/zhinchi_04_ordena.webp",
  "X01": "sprites/xervias_01_objecion.webp",
  "X02": "sprites/xervias_02_invoca.webp",
  "X03": "sprites/xervias_03_tutorial.webp",
  "X04": "sprites/xervias_04_reflexion.webp",
  "F01": "fondos/fondo_01_mesa.webp",
  "F02": "fondos/fondo_02_plaza.webp",
  "P01": "planos/plano_01_pergamino.webp",
  "P02": "planos/plano_02_anillo.webp",
  "P03": "planos/plano_03_cetro.webp"
} as const;
export type PrologueArtId = keyof typeof PROLOGUE_ART_FILES;
export const PROLOGUE_COMPLETE_KEY = 'decreto-real.prologo.finalizado.v1';

export function prologueArtUrl(id: PrologueArtId): string {
  return import.meta.env.BASE_URL+'campania/prologo/'+PROLOGUE_ART_FILES[id];
}
export function prologueArtManifestUrl(): string {
  return import.meta.env.BASE_URL+'campania/prologo/manifest.json';
}
export function isPrologueArtManifest(value: unknown): value is {completed:23,files:Record<string,string>} {
  if (!value || typeof value!=='object') return false;
  const m=value as {completed?:number,files?:Record<string,string>};
  return m.completed===23 && !!m.files && Object.entries(PROLOGUE_ART_FILES).every(([id,path])=>m.files?.[id]===path);
}
export const PROLOGUE_SPRITES = {
  Domingo:{neutral:'D01',arrogant:'D02',fighting:'D03',defeated:'D04'},
  Madre:{protective:'M01',pleading:'M02',shocked:'M03',relieved:'M04'},
  Nino:{afraid:'N01',relieved:'N02'},
  Zhinchi:{entrance:'Z01',investigating:'Z02',scepter:'Z03',command:'Z04'},
  Xervias:{objection:'X01',invocation:'X02',tutorial:'X03',reflection:'X04'},
} as const;
