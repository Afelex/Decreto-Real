/** Importación asistida del paquete G2 a la biblioteca local y a las escenas de
 * DRStudio. Evita cargar manualmente 25 archivos y preserva fondos editados.
 */
import { readZip } from './zip.ts';
import { addStudioMedia } from '../studioMedia.ts';
import { readStudioDocumentV3, saveStudioDocumentV3 } from './migrate.ts';
import { withAsset, withSceneSettings } from './ops.ts';
import { G2_ASSET_PATHS, type G2AssetId } from '../g2Artwork.ts';
import { g2SceneAssignments } from './g2SceneAssignments.ts';
type StorageLike=Pick<Storage,'getItem'|'setItem'>;
type AssetMeta={id:string;path:string;sha256:string};
type Manifest={generation:string;count:number;assets:AssetMeta[]};
const decoder=new TextDecoder('utf-8',{fatal:true});
function toHex(bytes:Uint8Array){return [...bytes].map(x=>x.toString(16).padStart(2,'0')).join('');}
async function sha256(bytes:Uint8Array):Promise<string>{
  if(!crypto?.subtle)throw new Error('La verificación G2 requiere una conexión segura HTTPS.');
  return toHex(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes as BufferSource)));
}
export async function importApprovedG2Package(file:File,storage:StorageLike){
  if(file.size>30*1024*1024)throw new Error('El paquete G2 supera 30 MB.');
  const archive=readZip(new Uint8Array(await file.arrayBuffer()));
  const entries=new Map(archive.map(e=>[e.name,e.data]));
  const manifestBytes=entries.get('MANIFIESTO-G2.json');
  if(!manifestBytes)throw new Error('Falta el manifiesto de aprobación G2.');
  const manifest:Manifest=JSON.parse(decoder.decode(manifestBytes));
  const expected=Object.entries(G2_ASSET_PATHS) as [G2AssetId,string][];
  if(manifest.generation!=='DR-G2-2026'||manifest.count!==25||expected.length!==25||
      manifest.assets.length!==25)throw new Error('El archivo ZIP no es el lote G2 aprobado.');
  const metadata=new Map(manifest.assets.map(x=>[x.id,x]));
  const validated: {id:G2AssetId;data:Uint8Array}[]=[];
  // Verifica TODOS los recursos antes de modificar la biblioteca.
  for(const [id,path] of expected){
    const recorded=metadata.get(id);
    const data=entries.get('public/'+path);
    if(!recorded||recorded.path!=='public/'+path||!data)throw new Error('Falta recurso aprobado '+id);
    if(data.length<30||String.fromCharCode(...data.slice(0,4))!=='RIFF'||
        String.fromCharCode(...data.slice(8,12))!=='WEBP')throw new Error('WebP inválido: '+id);
    if(await sha256(data)!==recorded.sha256)throw new Error('Firma SHA-256 incorrecta: '+id);
    validated.push({id,data});
  }
  const ids=new Map<G2AssetId,string>();
  for(const {id,data} of validated){
    const media=await addStudioMedia(new File([data as BlobPart],'DR-G2-2026_'+id+'.webp',{type:'image/webp'}));
    ids.set(id,media.id);
  }
  let doc=readStudioDocumentV3(storage).doc;
  for(const {id} of validated){
    const mediaId=ids.get(id)!;
    doc=withAsset(doc,mediaId,{name:'DR-G2-2026 '+id,mime:'image/webp'});
  }
  let scenes=0,preserved=0;
  for(const entry of g2SceneAssignments()){
    if(doc.scenes[entry.key]?.background){preserved++;continue;}
    doc=withSceneSettings(doc,entry.key,{background:{assetId:ids.get(entry.assetId)!}});
    scenes++;
  }
  if(!saveStudioDocumentV3(storage,doc))throw new Error('Imágenes guardadas, pero no se pudo guardar el guion de DRStudio.');
  return {count:validated.length,scenes,preserved};
}
