/** Publica únicamente archivos validados; GitHub se encarga después del PR revisado. */
import { readFile, mkdir, writeFile, readdir, rm, lstat } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseStudioPackage, buildStudioPackage } from '../campaign/studio/package.ts';
import { normalizeStudioDocumentV3 } from '../campaign/studio/schema.ts';
import { withoutUnusedAssets, referencedAssetIds } from '../campaign/studio/ops.ts';
import { STUDIO_MEDIA_EXTENSIONS } from '../campaign/studio/mediaSignature.ts';

export async function publishStudio(bytes,root){
  const parsed=parseStudioPackage(bytes);
  if(parsed.format!=='zip')throw new Error('La publicación requiere el ZIP exportado por Studio.');
  // Verifica recursos ausentes, firmas, MIME y límites antes de tocar el destino.
  buildStudioPackage(parsed.doc,parsed.media);
  const doc=withoutUnusedAssets(normalizeStudioDocumentV3(parsed.doc));
  const used=referencedAssetIds(doc);
  const destination=resolve(root,'public/studio');
  const mediaDir=join(destination,'media');
  for(const path of [join(root,'public'),destination,mediaDir]){
    try{if((await lstat(path)).isSymbolicLink())throw new Error('El destino no puede ser un enlace simbólico.');}
    catch(error){if(error.code!=='ENOENT')throw error;}
  }
  await mkdir(mediaDir,{recursive:true});
  const keep=new Set();
  for(const file of parsed.media){
    if(!used.has(file.id))continue;
    const name=file.id+'.'+STUDIO_MEDIA_EXTENSIONS[file.mime];
    keep.add(name);
    const target=join(mediaDir,name);
    try{if((await lstat(target)).isSymbolicLink())throw new Error('Un medio publicado no puede ser un enlace simbólico.');}
    catch(error){if(error.code!=='ENOENT')throw error;}
    await writeFile(target,file.data);
  }
  const manifest=join(destination,'composiciones.json');
  try{if((await lstat(manifest)).isSymbolicLink())throw new Error('El manifiesto no puede ser un enlace simbólico.');}
  catch(error){if(error.code!=='ENOENT')throw error;}
  await writeFile(manifest,JSON.stringify(doc,null,2)+'\n');
  for(const name of await readdir(mediaDir))if(!keep.has(name))await rm(join(mediaDir,name),{recursive:true,force:true});
  return doc;
}
if(process.argv[1]&&import.meta.url===pathToFileURL(resolve(process.argv[1])).href){
  const [zip,root='.']=process.argv.slice(2);
  if(!zip)throw new Error('Uso: node --experimental-strip-types tools/studio-publish.mjs paquete.zip [repositorio]');
  await publishStudio(new Uint8Array(await readFile(zip)),resolve(root));
  console.log('Composiciones preparadas. Revisa los cambios y publícalos mediante un PR.');
}
