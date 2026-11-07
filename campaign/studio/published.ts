/** Composiciones revisadas: rutas derivadas del ID y del MIME, nunca URL arbitrarias. */
import { emptyStudioDocumentV3, normalizeStudioDocumentV3, MEDIA_ID, type StudioDocumentV3 } from './schema.ts';
import { STUDIO_MEDIA_EXTENSIONS, type StudioMediaMime } from './mediaSignature.ts';

export function publishedMediaUrls(doc:StudioDocumentV3,base='./'):Record<string,string>{
  const urls:Record<string,string>={};
  for(const id of Object.keys(doc.assets??{})){
    const ext=STUDIO_MEDIA_EXTENSIONS[doc.assets![id].mime as StudioMediaMime];
    if(MEDIA_ID.test(id)&&ext)urls[id]=base+'studio/media/'+id+'.'+ext;
  }
  return urls;
}
/** Un despliegue anterior, un 404 o un manifiesto inválido conservan el juego base. */
export async function loadPublishedStudio(base:string,request:typeof fetch=fetch):Promise<StudioDocumentV3>{
  try{
    const response=await request(base+'studio/composiciones.json',{cache:'no-store'});
    if(!response.ok)return emptyStudioDocumentV3();
    const value=await response.json();
    if(value?.version!==3)return emptyStudioDocumentV3();
    return normalizeStudioDocumentV3(value);
  }catch{return emptyStudioDocumentV3();}
}
