/**
 * Biblioteca multimedia de Studio: IndexedDB guarda los archivos subidos,
 * independientes de la partida y del despliegue en GitHub. Sin llamadas
 * remotas ni generación de imágenes de pago.
 *
 * - El tipo se decide por la FIRMA real del archivo, no por su extensión.
 * - Un archivo idéntico (mismo SHA-256) se reutiliza en vez de duplicarse.
 */
import { sniffStudioMedia, type StudioMediaMime } from './studio/mediaSignature';

export type StudioMediaKind='image'|'effect';
export const MAX_STUDIO_MEDIA_BYTES=25*1024*1024;
export const STUDIO_MEDIA_DB='decreto-real-studio-media-v1';
const STORE='files';
export type StudioMediaRecord={id:string;name:string;mime:string;blob:Blob;hash?:string;createdAt?:string};
export type StudioMediaInfo={id:string;name:string;mime:string;size:number;createdAt?:string};
const MEDIA_ID=/^media-[a-f\d-]{12,60}$/i;

export function validateStudioMedia(file:Blob):void {
  if(file.size===0||file.size>MAX_STUDIO_MEDIA_BYTES)
    throw new Error('El archivo debe ocupar entre 1 byte y 25 MB.');
}
/** Tipo real por firma; error claro si no es un formato admitido. */
export async function detectStudioMedia(blob:Blob):Promise<StudioMediaMime> {
  const head=new Uint8Array(await blob.slice(0,16).arrayBuffer());
  const mime=sniffStudioMedia(head);
  if(!mime)throw new Error('Solo PNG, JPG, WebP, GIF, MP4, WebM, MP3 o WAV (firma no válida).');
  return mime;
}
async function sha256(blob:Blob):Promise<string|undefined> {
  if(typeof crypto==='undefined'||!crypto.subtle)return undefined;
  const digest=await crypto.subtle.digest('SHA-256',await blob.arrayBuffer());
  return [...new Uint8Array(digest)].map(b=>b.toString(16).padStart(2,'0')).join('');
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
const request=<T,>(mode:IDBTransactionMode,make:(store:IDBObjectStore)=>IDBRequest)=>withStore<T>(mode,(store,resolve,reject)=>{
  const req=make(store);
  req.onsuccess=()=>resolve(req.result as T);
  req.onerror=()=>reject(req.error??new Error('Fallo de la biblioteca multimedia.'));
});

export async function putStudioMedia(record:StudioMediaRecord):Promise<void>{
  validateStudioMedia(record.blob);
  if(!MEDIA_ID.test(record.id))throw new Error('ID multimedia inválido.');
  const mime=await detectStudioMedia(record.blob);
  await request<IDBValidKey>('readwrite',store=>store.put({...record,mime,
    blob:record.blob.type===mime?record.blob:new Blob([record.blob],{type:mime})}));
}
export async function getStudioMedia(id:string):Promise<StudioMediaRecord|null>{
  if(!MEDIA_ID.test(id))return null;
  return (await request<StudioMediaRecord|undefined>('readonly',store=>store.get(id)))??null;
}
export async function listStudioMediaRecords():Promise<StudioMediaRecord[]>{
  return request<StudioMediaRecord[]>('readonly',store=>store.getAll());
}
export async function listStudioMedia():Promise<StudioMediaInfo[]>{
  return (await listStudioMediaRecords())
    .map(r=>({id:r.id,name:r.name,mime:r.mime,size:r.blob.size,...(r.createdAt?{createdAt:r.createdAt}:{})}))
    .sort((a,b)=>(b.createdAt??'').localeCompare(a.createdAt??'')||a.name.localeCompare(b.name));
}

/**
 * Añade un archivo a la biblioteca. Si ya existe un archivo idéntico, lo
 * reutiliza (`reused: true`) en lugar de guardar una copia.
 */
export async function addStudioMedia(file:File):Promise<StudioMediaRecord&{reused:boolean}>{
  validateStudioMedia(file);
  const mime=await detectStudioMedia(file);
  const hash=await sha256(file);
  if(hash){
    for(const existing of await listStudioMediaRecords()){
      if(existing.blob.size!==file.size)continue;
      const known=existing.hash??await sha256(existing.blob);
      if(!existing.hash&&known)await request<IDBValidKey>('readwrite',store=>store.put({...existing,hash:known}));
      if(known===hash)return {...existing,hash:known,reused:true};
    }
  }
  const record:StudioMediaRecord={
    id:'media-'+crypto.randomUUID(),name:file.name.slice(0,100),mime,
    blob:file.type===mime?file:new Blob([file],{type:mime}),
    ...(hash?{hash}:{}),createdAt:new Date().toISOString(),
  };
  await request<IDBValidKey>('readwrite',store=>store.put(record));
  return {...record,reused:false};
}
export async function renameStudioMedia(id:string,name:string):Promise<void>{
  const record=await getStudioMedia(id);
  if(!record)throw new Error('El archivo ya no existe en la biblioteca.');
  const clean=name.trim().slice(0,100);
  if(!clean)throw new Error('Escribe un nombre.');
  await request<IDBValidKey>('readwrite',store=>store.put({...record,name:clean}));
}
export async function deleteStudioMedia(ids:readonly string[]):Promise<void>{
  for(const id of ids){
    if(!MEDIA_ID.test(id))continue;
    await request<undefined>('readwrite',store=>store.delete(id));
  }
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
/** Bytes de los archivos indicados (para el respaldo ZIP). */
export async function readStudioMediaBytes(ids:readonly string[]):Promise<{id:string;name:string;mime:StudioMediaMime;data:Uint8Array}[]>{
  const out:{id:string;name:string;mime:StudioMediaMime;data:Uint8Array}[]=[];
  for(const id of ids){
    const record=await getStudioMedia(id);
    if(!record)throw new Error('Falta un recurso multimedia. No se puede crear un respaldo completo.');
    const data=new Uint8Array(await record.blob.arrayBuffer());
    out.push({id,name:record.name,mime:record.mime as StudioMediaMime,data});
  }
  return out;
}
/** Guarda los archivos de un respaldo importado (ya validados por firma). */
export async function putStudioMediaBytes(items:readonly {id:string;name:string;mime:string;data:Uint8Array}[]):Promise<void>{
  for(const item of items){
    const blob=new Blob([item.data as BlobPart],{type:item.mime});
    await putStudioMedia({id:item.id,name:item.name,mime:item.mime,blob,
      ...(await sha256(blob).then(hash=>hash?{hash}:{})),createdAt:new Date().toISOString()});
  }
}
