/**
 * Portapapeles de transformaciones de Studio: copiar la posición, escala,
 * rotación, capa, opacidad y espejado de un elemento y pegarlos en otro
 * (en la misma u otra intervención). Puro: sin DOM.
 */
import type { StudioLayerTransform } from './schema.ts';

export type CopiedTransform = Pick<StudioLayerTransform,'x'|'y'|'scale'|'rotation'|'opacity'|'mirror'|'z'>;
export const TRANSFORM_CLIPBOARD_PREFIX = 'Decreto Real Studio · transformación';

export function copyTransform(t:StudioLayerTransform):CopiedTransform {
  return {x:t.x,y:t.y,scale:t.scale,rotation:t.rotation,opacity:t.opacity,mirror:t.mirror,z:t.z};
}
/** Texto legible para el portapapeles del sistema (y reconocible al pegar). */
export function formatTransform(t:CopiedTransform):string {
  return TRANSFORM_CLIPBOARD_PREFIX+'\n'+
    'X: '+t.x+' % · Y: '+t.y+' % · Escala: '+Math.round(t.scale*100)+' % · Rotación: '+t.rotation+'° · '+
    'Capa: '+t.z+' · Opacidad: '+Math.round(t.opacity*100)+' %'+(t.mirror?' · Espejado':'')+'\n'+
    JSON.stringify(t);
}
/** Lee un texto copiado por Studio; null si no lo es. Los valores se acotan al aplicarse. */
export function parseTransform(text:string):CopiedTransform|null {
  if(!text.startsWith(TRANSFORM_CLIPBOARD_PREFIX))return null;
  const json=text.slice(text.lastIndexOf('\n')+1);
  try{
    const v=JSON.parse(json) as Record<string,unknown>;
    const n=(k:string)=>typeof v[k]==='number'&&Number.isFinite(v[k] as number)?v[k] as number:null;
    const [x,y,scale,rotation,opacity,z]=['x','y','scale','rotation','opacity','z'].map(n);
    if([x,y,scale,rotation,opacity,z].some(value=>value===null))return null;
    return {x:x!,y:y!,scale:scale!,rotation:rotation!,opacity:opacity!,z:z!,mirror:v.mirror===true};
  }catch{return null;}
}
