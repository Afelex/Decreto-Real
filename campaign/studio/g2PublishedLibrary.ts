/** Recursos G2 ya publicados: visibles en Studio sin repetir la carga del ZIP.
 * Son una biblioteca de solo lectura hasta que el editor decide usar uno;
 * entonces se trae únicamente ese WebP a IndexedDB para permitir edición,
 * deshacer y exportación de un proyecto autocontenido.
 */
import { G2_ASSET_PATHS, g2AssetIsPublished, type G2AssetId } from '../g2Artwork.ts';
import { g2SceneAssignments } from './g2SceneAssignments.ts';
import { MAX_STUDIO_MEDIA_BYTES } from '../studioMedia.ts';

export type PublishedG2Asset = {
  id:G2AssetId;
  label:string;
  path:string;
  url:string;
  sceneKeys:readonly string[];
};

const names:Readonly<Record<G2AssetId,string>>={
  'G2-FON-001':'Prólogo · Camino Real',
  'G2-FON-002':'Prólogo · Plaza del Pregón',
  'G2-FON-003':'Región 1 · Paisaje',
  'G2-FON-004':'Región 1 · Arena del general',
  'G2-FON-005':'Región 2 · Paisaje',
  'G2-FON-006':'Región 2 · Arena del general',
  'G2-FON-007':'Región 3 · Paisaje',
  'G2-FON-008':'Región 3 · Arena del general',
  'G2-FON-009':'Región 4 · Paisaje',
  'G2-FON-010':'Región 4 · Arena del general',
  'G2-FON-011':'Región 5 · Paisaje',
  'G2-FON-012':'Región 5 · Arena del general',
  'G2-FON-013':'Región 6 · Paisaje',
  'G2-FON-014':'Región 6 · Arena del general',
  'G2-FON-015':'Región 7 · Paisaje',
  'G2-FON-016':'Región 7 · Arena del general',
  'G2-FON-017':'Región 8 · Paisaje',
  'G2-FON-018':'Región 8 · Arena del general',
  'G2-FON-019':'Final · Exteriores',
  'G2-FON-020':'Final · Arena de Sigumán',
  'G2-M35-A':'M35 · Casona intacta',
  'G2-M35-B':'M35 · Derrumbe',
  'G2-M35-C':'M35 · Ruinas',
  'G2-M36-A':'M36 · Acceso a la prisión',
  'G2-M36-B':'M36 · Calabozos',
};

export function publishedG2StudioAssets(base:string):PublishedG2Asset[]{
  const scenes=new Map<G2AssetId,string[]>();
  for(const {key,assetId} of g2SceneAssignments()){
    const list=scenes.get(assetId)??[];
    list.push(key);
    scenes.set(assetId,list);
  }
  return (Object.entries(G2_ASSET_PATHS) as [G2AssetId,string][])
    .filter(([id])=>g2AssetIsPublished(id))
    .map(([id,path])=>({id,label:names[id],path,url:base+path,sceneKeys:scenes.get(id)??[]}));
}

/** Importar solo al usarlo. Verificar HTTP, límite y firma real WebP, nunca confiar en el MIME. */
export async function fetchPublishedG2File(asset:PublishedG2Asset,request:typeof fetch=fetch):Promise<File>{
  if(!g2AssetIsPublished(asset.id)||asset.path!==G2_ASSET_PATHS[asset.id])
    throw new Error('El fondo G2 no pertenece al catálogo publicado.');
  const response=await request(asset.url);
  if(!response.ok)throw new Error('No se pudo descargar el fondo G2 publicado.');
  const bytes=new Uint8Array(await response.arrayBuffer());
  if(bytes.byteLength<32||bytes.byteLength>MAX_STUDIO_MEDIA_BYTES)
    throw new Error('Tamaño inválido del fondo G2.');
  const signature=(offset:number)=>String.fromCharCode(...bytes.subarray(offset,offset+4));
  if(signature(0)!=='RIFF'||signature(8)!=='WEBP')
    throw new Error('El archivo publicado no tiene una firma WebP válida.');
  return new File([bytes as BlobPart],'DR-G2-2026_'+asset.id+'.webp',{type:'image/webp'});
}
