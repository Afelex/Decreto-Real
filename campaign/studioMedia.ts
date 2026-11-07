/**
 * Studio multimedia library: IndexedDB stores uploaded binary media independently
 * of the player's savegame and GitHub deployment.
 * No remote calls or paid image-generation API use.
 */
export type StudioMediaKind='image'|'effect';
export const MAX_STUDIO_MEDIA_BYTES=25*1024*1024;
export const STUDIO_MEDIA_DB='decreto-real-studio-media-v1';
const STORE='files';
export type StudioMediaRecord={id:string;name:string;mime:string;blob:Blob};
const MEDIA=/^(image\/(png|jpeg|webp|gif)|video\/(mp4|webm))$/;
export function validateStudioMedia(file:Blob):void{
  if(!MEDIA.test(file.type))throw new Error('Solo PNG, JPG, WebP, GIF, MP4 o WebM.');
  if(file.size===0||file.size>MAX_STUDIO_MEDIA_BYTES)
    throw new Error('El archivo debe ocupar entre 1 byte y 25 MB.');
}
function openDatabase():Promise<IDBDatabase>{
  if(typeof indexedDB==='undefined')return Promise.reject(new Error('Este navegador no permite guardar archivos de Studio.'));
  return new Promise((resolve,reject)=>{
    const req=indexedDB.open(STUDIO_MEDIA_DB,1);
    req.onupgradeneeded=()=>{if(!req.result.objectStoreNames.contains(STORE))req.result.createObjectStore(STORE,{keyPath:'id'});};
    req.onsuccess=()=>resolve(req.result);
    req.onerror=()=>reject(req.error??new Error('No se pudo abrir la biblioteca multimedia.'));
  });
}
function withStore<T>(mode:IDBTransactionMode,work:(store:IDBObjectStore,resolve:(x:T)=>void,reject:(e:Error)=>void)=>void):Promise<T>{
  return openDatabase().then(db=>new Promise<T>((resolve,reject)=>{
    const tx=db.transaction(STORE,mode);
    const store=tx.objectStore(STORE);
    let settled=false;
    const ok=(x:T)=>{if(!settled){settled=true;resolve(x);}};
    const bad=(e:Error)=>{if(!settled){settled=true;reject(e);}};
    tx.onabort=()=>bad(tx.error??new Error('No se pudo guardar el archivo.'));
    tx.onerror=()=>bad(tx.error??new Error('Fallo de almacenamiento.'));
    tx.oncomplete=()=>db.close();
    work(store,ok,bad);
  }));
}
export function addStudioMedia(file:File):Promise<StudioMediaRecord>{
  validateStudioMedia(file);
  const record:StudioMediaRecord={
    id:'media-'+crypto.randomUUID(),name:file.name.slice(0,100),mime:file.type,blob:file,
  };
  return putStudioMedia(record).then(()=>record);
}
export async function putStudioMedia(record:StudioMediaRecord):Promise<void>{
  validateStudioMedia(record.blob);
  if(!/^media-[a-f\d-]{12,60}$/i.test(record.id))throw new Error('ID multimedia inválido.');
  await withStore<void>('readwrite',(store,resolve,reject)=>{
    const request=store.put(record);
    request.onsuccess=()=>resolve();
    request.onerror=()=>reject(request.error??new Error('No se pudo guardar la imagen.'));
  });
}
export async function getStudioMedia(id:string):Promise<StudioMediaRecord|null>{
  if(!/^media-[a-f\d-]{12,60}$/i.test(id))return null;
  return withStore<StudioMediaRecord|null>('readonly',(store,resolve,reject)=>{
    const request=store.get(id);
    request.onsuccess=()=>resolve((request.result as StudioMediaRecord|undefined)??null);
    request.onerror=()=>reject(request.error??new Error('No se pudo leer la imagen.'));
  });
}
export async function loadStudioMediaUrls(ids:readonly string[]):Promise<Record<string,string>>{
  const urls:Record<string,string>={};
  await Promise.all(ids.map(async id=>{
    const record=await getStudioMedia(id);
    if(record)urls[id]=URL.createObjectURL(record.blob);
  }));
  return urls;
}
export function revokeStudioMediaUrls(urls:Record<string,string>):void{
  Object.values(urls).forEach(url=>URL.revokeObjectURL(url));
}
function blobAsDataUrl(blob:Blob):Promise<string>{
  return new Promise((resolve,reject)=>{
    const reader=new FileReader();
    reader.onload=()=>resolve(String(reader.result));
    reader.onerror=()=>reject(reader.error??new Error('No se pudo exportar el archivo.'));
    reader.readAsDataURL(blob);
  });
}
export type StudioPortableMedia={id:string;name:string;mime:string;data:string};
export async function exportStudioMedia(ids:readonly string[]):Promise<StudioPortableMedia[]>{
  const items:StudioPortableMedia[]=[];
  let total=0;
  for(const id of ids){
    const record=await getStudioMedia(id);
    if(!record)throw new Error('Falta un recurso multimedia. No se puede crear un respaldo completo.');
    total+=record.blob.size;
    if(total>70*1024*1024)throw new Error('El respaldo supera 70 MB. Reduce los videos.');
    items.push({id,name:record.name,mime:record.mime,data:await blobAsDataUrl(record.blob)});
  }
  return items;
}
export async function importStudioMedia(items:readonly StudioPortableMedia[]):Promise<void>{
  if(items.length>100)throw new Error('El proyecto tiene demasiados recursos.');
  let total=0;
  for(const item of items){
    if(!/^media-[a-f\d-]{12,60}$/i.test(item.id)||typeof item.data!=='string')
      throw new Error('El archivo contiene recursos no válidos.');
    const match=item.data.match(/^data:(image\/(?:png|jpeg|webp|gif)|video\/(?:mp4|webm));base64,/);
    if(!match||match[1]!==item.mime)throw new Error('Formato multimedia no permitido.');
    total+=item.data.length*.75;
    if(total>70*1024*1024)throw new Error('Respaldo multimedia demasiado grande.');
    const blob=await (await fetch(item.data)).blob();
    await putStudioMedia({id:item.id,name:String(item.name).slice(0,100),mime:match[1],blob});
  }
}
