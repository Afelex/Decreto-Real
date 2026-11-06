/** Prologue v2 corrections: named paths are activated only after the batch is complete. */
export const V2_FILES = {
 D01:'sprites/domingo_01_serio.webp',
 D02:'sprites/domingo_02_molesto.webp',
 D03:'sprites/domingo_03_burlon.webp',
 D04:'sprites/domingo_04_derrotado.webp',
 D05:'retratos/domingo_perfil_duelo.webp',
 F01:'fondos/despacho_vacio.webp',
} as const;
export type V2ArtId=keyof typeof V2_FILES;
export function prologueV2Url(id:V2ArtId):string {
 return import.meta.env.BASE_URL+'campania/prologo-v2/'+V2_FILES[id];
}
export function prologueV2ManifestUrl():string {
 return import.meta.env.BASE_URL+'campania/prologo-v2/manifest.json';
}
export function isV2Complete(v:unknown):boolean{
 if(!v||typeof v!=='object')return false;
 const obj=v as {version?:number,completed?:number,files?:Record<string,string>};
 return obj.version===2&&obj.completed===6&&!!obj.files&&Object.entries(V2_FILES).every(([id,path])=>obj.files?.[id]===path);
}
export const INVOCATION_CARD_URL='./campania/prologo/props/carta-invocacion-real.svg';
