#!/usr/bin/env node
/** Instala WebP G2 locales desde carpeta o ZIP, sin sobrescribir ni eliminar arte G1.
 * Regenera las rutas activas solo DESPUÉS de confirmar los 25 binarios esperados.
 */
import { readFileSync, existsSync, mkdirSync, copyFileSync, writeFileSync, mkdtempSync, readdirSync, statSync, rmSync } from 'node:fs';
import { basename, dirname, join, resolve, sep, isAbsolute } from 'node:path';
import { tmpdir } from 'node:os';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const project=resolve(dirname(fileURLToPath(import.meta.url)),'..');
const cat=JSON.parse(readFileSync(join(project,'public/artes/generaciones/DR-G2-2026/catalogo-produccion.json'),'utf8'));
const add=JSON.parse(readFileSync(join(project,'public/artes/generaciones/DR-G2-2026/catalogo-tramo-final-M35-M36.json'),'utf8'));
const targets=[...cat.items.filter(x=>x.category==='fondos').map(x=>({id:x.id,path:x.path})),...add.assets.map(x=>({id:x.id,path:x.targetPath}))];
const unique=new Set(targets.map(x=>x.path));
if(targets.length!==25||unique.size!==25)throw Error('Inventario G2 esperado: 25 rutas sin duplicados.');
function assertWebp(buffer,id){
 if(buffer.length<30||buffer.toString('ascii',0,4)!=='RIFF'||buffer.toString('ascii',8,12)!=='WEBP')throw Error(id+': no es un WebP válido.');
}
function extract(source){
 const root=mkdtempSync(join(tmpdir(),'decreto-g2-'));
 const check=spawnSync('unzip',['-Z1',source],{encoding:'utf8'});
 if(check.status!==0)throw Error('No se puede leer el ZIP; instala unzip o usa la carpeta descomprimida.');
 for(const line of check.stdout.split(/\r?\n/).filter(Boolean)){
  const clean=line.replace(/\\/g,'/');
  if(clean.startsWith('/')||clean.split('/').includes('..'))throw Error('ZIP inseguro: '+clean);
 }
 const e=spawnSync('unzip',['-q',source,'-d',root],{encoding:'utf8'});
 if(e.status!==0)throw Error('No se pudo extraer ZIP: '+e.stderr);
 return root;
}
const sourceInput=process.argv[2];
if(!sourceInput)throw Error('Uso: node tools/importar-g2.mjs carpeta-o-paquete.zip');
const source=resolve(sourceInput);
let cleanup=null;
let root=source;
if(source.toLowerCase().endsWith('.zip')){root=extract(source);cleanup=root;}
try{
 const files=targets.map(({id,path})=>{
   const original=join(root,path);
   const binary=readFileSync(original);
   assertWebp(binary,id);
   return {id,path,original,binary};
 });
 // Todas las verificaciones se realizan antes de modificar archivos del proyecto.
 for(const entry of files){
  const dest=join(project,entry.path);
  mkdirSync(dirname(dest),{recursive:true});
  copyFileSync(entry.original,dest);
 }
 const ids=files.map(f=>f.id);
 const ts=`/** Generado por tools/importar-g2.mjs; activar solo archivos G2 presentes y verificados. */\nexport const G2_PUBLISHED_IDS:readonly string[]=${JSON.stringify(ids,null,2)};\n`;
 writeFileSync(join(project,'campaign/g2Published.ts'),ts);
 const build=spawnSync(process.execPath,['tools/generar-catalogo-artes.mjs'],{cwd:project,encoding:'utf8'});
 if(build.status!==0)throw Error('Error generando catálogo: '+build.stderr);
 console.log('Importación G2 completada: '+ids.length+' WebP. '+build.stdout.trim());
 console.log('Revisa y confirma el diff de Git antes de publicar; no se borró arte G1.');
}finally{if(cleanup)rmSync(cleanup,{recursive:true,force:true});}
