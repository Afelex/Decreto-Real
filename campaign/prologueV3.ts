/** Scene-specific v3 PNG replacements, activated only when all alpha assets exist. */
export const V3_FILES={
 N03:'sprites/nino_03_asustado.png',
 N04:'sprites/nino_04_aliviado.png',
 X05:'sprites/xervias_05_anillo_energia.png',
 D07:'sprites/domingo_07_enojado.png',
 G01:'props/carta_dorada_invocacion.png',
 D08:'sprites/domingo_08_invocacion_combate.png',
} as const;
export type V3ArtId=keyof typeof V3_FILES;
export function prologueV3Url(id:V3ArtId):string{
 return import.meta.env.BASE_URL+'campania/prologo-v3/'+V3_FILES[id];
}
export function prologueV3ManifestUrl():string{
 return import.meta.env.BASE_URL+'campania/prologo-v3/manifest.json';
}
export function isV3Complete(value:unknown):boolean{
 if(!value||typeof value!=='object')return false;
 const m=value as {version?:number;completed?:number;files?:Record<string,string>};
 return m.version===3&&m.completed===6&&!!m.files &&
  Object.entries(V3_FILES).every(([id,path])=>m.files?.[id]===path);
}
