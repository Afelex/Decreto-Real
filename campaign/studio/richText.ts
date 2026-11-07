/**
 * Texto enriquecido mínimo de Studio: `**negrita**`.
 * Nunca se interpreta HTML: el resultado son segmentos de texto plano que la
 * interfaz pinta como texto o `<strong>`. Cada `**` alterna la negrita, de modo
 * que un marcador sin cerrar deja en negrita el resto del texto.
 */
export type RichSegment = {text:string;bold:boolean};

export function parseRichText(input:string,startBold=false):{segments:RichSegment[];endBold:boolean} {
  const segments:RichSegment[]=[];
  let bold=startBold;
  for(const [index,part] of input.split('**').entries()){
    if(index>0)bold=!bold;
    if(!part)continue;
    const last=segments[segments.length-1];
    if(last&&last.bold===bold)last.text+=part;
    else segments.push({text:part,bold});
  }
  return {segments,endBold:bold};
}

/** Segmentos de cada página, arrastrando la negrita abierta entre páginas. */
export function richTextPages(pages:readonly string[]):RichSegment[][] {
  let bold=false;
  return pages.map(page=>{
    const parsed=parseRichText(page,bold);
    bold=parsed.endBold;
    return parsed.segments;
  });
}

/** Texto sin marcadores (para lectores, longitudes y comparaciones). */
export const plainRichText=(input:string):string=>input.split('**').join('');

/**
 * Botón «Negrita» sobre la selección de un campo de texto: envuelve la
 * selección en `**…**`, o la desenvuelve si ya lo estaba. Sin selección,
 * inserta `****` con el cursor en medio. Devuelve el nuevo texto y selección.
 */
export function toggleBold(text:string,start:number,end:number):{text:string;start:number;end:number} {
  const a=Math.max(0,Math.min(start,end,text.length));
  const b=Math.max(0,Math.min(Math.max(start,end),text.length));
  if(text.slice(a-2,a)==='**'&&text.slice(b,b+2)==='**')
    return {text:text.slice(0,a-2)+text.slice(a,b)+text.slice(b+2),start:a-2,end:b-2};
  const selected=text.slice(a,b);
  if(selected.length>=4&&selected.startsWith('**')&&selected.endsWith('**'))
    return {text:text.slice(0,a)+selected.slice(2,-2)+text.slice(b),start:a,end:b-4};
  return {text:text.slice(0,a)+'**'+selected+'**'+text.slice(b),start:a+2,end:b+2};
}
