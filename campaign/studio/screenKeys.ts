/**
 * Claves estables de Studio para las pantallas narrativas fuera del prólogo.
 * Cada línea se identifica por su hablante y su orden entre las líneas de
 * ese hablante (`xervias-01`, `zhinchi-01`, `xervias-02`), de modo que dos
 * intervenciones del mismo personaje nunca comparten ajustes.
 */
export const studioSlug=(text:string):string=>text.normalize('NFD').replace(/[̀-ͯ]/g,'')
  .toLowerCase().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'').slice(0,30)||'linea';

export function speakerLineIds(speakers:readonly string[]):string[] {
  const seen:Record<string,number>=Object.create(null);
  return speakers.map(speaker=>{
    const slug=studioSlug(speaker);
    seen[slug]=(seen[slug]??0)+1;
    return slug+'-'+String(seen[slug]).padStart(2,'0');
  });
}
export const victoryScreenKey=(missionId:string)=>'victoria-'+studioSlug(missionId);
export const regionScreenKey=(chapterId:string,mode:'entrada'|'liberada')=>'region-'+studioSlug(chapterId)+'/'+mode;
