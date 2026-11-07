/**
 * Respaldo portable de Decreto Real Studio: un ZIP con `proyecto.json`
 * (documento v3 + índice de archivos) y los archivos multimedia originales en
 * `media/`, sin base64. También lee los respaldos JSON anteriores (v2 y v3).
 * Cada archivo se valida por su firma real, no por su nombre.
 */
import { parseAnyStudioDocument, type StudioMigrationReport } from './migrate.ts';
import { referencedAssetIds, withoutUnusedAssets } from './ops.ts';
import { MEDIA_ID, type StudioDocumentV3 } from './schema.ts';
import { STUDIO_MEDIA_EXTENSIONS, sniffStudioMedia, type StudioMediaMime } from './mediaSignature.ts';
import { createZip, isZip, readZip } from './zip.ts';

export const STUDIO_PACKAGE_MANIFEST = 'proyecto.json';
export const STUDIO_PACKAGE_MAX_BYTES = 200*1024*1024;
export const STUDIO_PACKAGE_MAX_MEDIA = 200;
export const STUDIO_ZIP_FILENAME = 'decreto-real-studio-proyecto.zip';

export type PackageMedia = {id:string;name:string;mime:StudioMediaMime;data:Uint8Array};
export type ParsedStudioPackage = {
  doc:StudioDocumentV3;media:PackageMedia[];
  format:'zip'|'json';report?:StudioMigrationReport;
};

/** Construye el ZIP del proyecto. Solo incluye los recursos que alguna escena usa. */
export function buildStudioPackage(source:StudioDocumentV3,files:readonly PackageMedia[]):Uint8Array {
  const document=withoutUnusedAssets(source);
  const used=[...referencedAssetIds(document)].sort();
  const byId=new Map(files.map(file=>[file.id,file]));
  let total=0;
  const index=used.map(id=>{
    const file=byId.get(id);
    if(!file)throw new Error('Falta un recurso multimedia. No se puede crear un respaldo completo.');
    const mime=sniffStudioMedia(file.data);
    if(!mime)throw new Error('El archivo «'+file.name+'» está dañado o no es un formato admitido.');
    total+=file.data.length;
    if(total>STUDIO_PACKAGE_MAX_BYTES)throw new Error('El respaldo supera 200 MB. Reduce los videos.');
    return {id,name:file.name,mime,size:file.data.length,path:'media/'+id+'.'+STUDIO_MEDIA_EXTENSIONS[mime],data:file.data};
  });
  const manifest={
    studioPackage:3,format:'zip',
    document,
    media:index.map(({id,name,mime,size,path})=>({id,name,mime,size,path})),
  };
  return createZip([
    {name:STUDIO_PACKAGE_MANIFEST,data:new TextEncoder().encode(JSON.stringify(manifest,null,1))},
    ...index.map(item=>({name:item.path,data:item.data})),
  ]);
}

const decodeDataUrl=(value:string):Uint8Array=>{
  const match=/^data:[^;,]+;base64,([A-Za-z0-9+/=\s]*)$/.exec(value);
  if(!match)throw new Error('El archivo contiene recursos no válidos.');
  const binary=atob(match[1].replace(/\s+/g,''));
  const bytes=new Uint8Array(binary.length);
  for(let i=0;i<binary.length;i++)bytes[i]=binary.charCodeAt(i);
  return bytes;
};

function collectMedia(list:unknown,read:(item:Record<string,unknown>)=>Uint8Array):PackageMedia[] {
  if(list===undefined)return [];
  if(!Array.isArray(list))throw new Error('Faltan los recursos multimedia.');
  if(list.length>STUDIO_PACKAGE_MAX_MEDIA)throw new Error('El proyecto tiene demasiados recursos.');
  let total=0;
  const media:PackageMedia[]=[];
  for(const raw of list){
    if(!raw||typeof raw!=='object')throw new Error('El archivo contiene recursos no válidos.');
    const item=raw as Record<string,unknown>;
    if(typeof item.id!=='string'||!MEDIA_ID.test(item.id))throw new Error('El archivo contiene recursos no válidos.');
    const data=read(item);
    total+=data.length;
    if(total>STUDIO_PACKAGE_MAX_BYTES)throw new Error('Respaldo multimedia demasiado grande.');
    const mime=sniffStudioMedia(data);
    if(!mime)throw new Error('Un recurso del respaldo no es una imagen o video admitido.');
    media.push({id:item.id,name:String(item.name??item.id).slice(0,100),mime,data});
  }
  return media;
}

/** Lee un respaldo (ZIP de Studio, paquete JSON v2/v3 o documento suelto). */
export function parseStudioPackage(bytes:Uint8Array):ParsedStudioPackage {
  if(bytes.length>STUDIO_PACKAGE_MAX_BYTES+5_000_000)throw new Error('Archivo demasiado grande.');
  if(isZip(bytes)){
    const entries=readZip(bytes);
    const byName=new Map(entries.map(entry=>[entry.name,entry.data]));
    const manifestBytes=byName.get(STUDIO_PACKAGE_MANIFEST);
    if(!manifestBytes)throw new Error('El ZIP no contiene proyecto.json de Decreto Real Studio.');
    const manifest=JSON.parse(new TextDecoder().decode(manifestBytes)) as Record<string,unknown>;
    if(manifest.studioPackage!==3)throw new Error('Formato de respaldo no compatible.');
    const loaded=parseAnyStudioDocument(JSON.stringify(manifest.document));
    const media=collectMedia(manifest.media,item=>{
      const data=typeof item.path==='string'?byName.get(item.path):undefined;
      if(!data)throw new Error('Falta un archivo multimedia dentro del ZIP.');
      return data;
    });
    return {doc:loaded.doc,media,format:'zip',...(loaded.report?{report:loaded.report}:{})};
  }
  let payload:unknown;
  try{payload=JSON.parse(new TextDecoder().decode(bytes));}
  catch{throw new Error('El archivo no es un respaldo de Decreto Real Studio (ZIP o JSON).');}
  const pack=payload&&typeof payload==='object'?payload as Record<string,unknown>:{};
  const packaged=pack.studioPackage===2||pack.studioPackage===3;
  const loaded=parseAnyStudioDocument(JSON.stringify(packaged?pack.document:payload));
  const media=packaged?collectMedia(pack.media,item=>{
    if(typeof item.data!=='string')throw new Error('El archivo contiene recursos no válidos.');
    return decodeDataUrl(item.data);
  }):[];
  return {doc:loaded.doc,media,format:'json',...(loaded.report?{report:loaded.report}:{})};
}

/** Resumen para confirmar una importación (fusionar o reemplazar). */
export function summarizeImport(current:StudioDocumentV3,incoming:ParsedStudioPackage){
  const incomingKeys=Object.keys(incoming.doc.scenes);
  return {
    scenes:incomingKeys.length,
    overlapping:incomingKeys.filter(key=>current.scenes[key]).length,
    currentScenes:Object.keys(current.scenes).length,
    media:incoming.media.length,
    bytes:incoming.media.reduce((n,m)=>n+m.data.length,0),
    dropped:incoming.report?.dropped.length??0,
  };
}
