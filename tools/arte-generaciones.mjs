/** Generaciones de arte. No borra ni mueve archivos. */
export const ACTIVE_GENERATION='DR-G2-2026';
export const LEGACY_GENERATION='DR-G1';
export const ACTIVE_GENERATION_ROOT='public/artes/generaciones/DR-G2-2026/';
export const HISTORICAL_ARCHIVE_ROOT='archivo-historico/artes/DR-G1/';
export function artGeneration(path){
  if(path.startsWith('art-reference/personajes-oficiales/imagenes/'))return ACTIVE_GENERATION;
  if(path.startsWith(ACTIVE_GENERATION_ROOT))return ACTIVE_GENERATION;
  if(path.startsWith('public/artes/generaciones/'))return path.slice('public/artes/generaciones/'.length).split('/')[0]||LEGACY_GENERATION;
  return LEGACY_GENERATION;
}
export function artState(path){
  if(path.startsWith('art-reference/personajes-oficiales/imagenes/'))return 'referencia-maestra';
  return artGeneration(path)===ACTIVE_GENERATION?'nueva-generacion':'anterior-en-uso';
}
