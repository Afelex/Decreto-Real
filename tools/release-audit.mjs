/**
 * Last-mile static verification of the Vite/Pages output.
 * Checks real file signatures, not just filename existence, to catch missing,
 * empty or LFS-pointer placeholders before publishing the mobile duel.
 *
 * Use --skip-generated on PR builds; deploy.yml creates the video and poster
 * from their source with ffmpeg before running the full audit.
 */
import { readFile, stat } from 'node:fs/promises';
import { join, resolve } from 'node:path';
import assert from 'node:assert/strict';

const root=resolve(process.argv[2]||'dist');
const skipGenerated=process.argv.includes('--skip-generated');

const critical=[
  ['portada/portada-poster.jpg','jpg'],
  ['portada/portada-loop.mp4','mp4'],
  ['portada/decreto-real-logo.png','png'],
  ['interfaz/banner-tu-turno.webp','webp'],
  ['interfaz/banner-turno-rival.webp','webp'],
  ['animaciones/banner-jugador-rojo.webm','webm'],
  ['animaciones/banner-rival-azul.webm','webm'],
  ['efectos/ataque.webm','webm'],
  ['efectos/defensa.webm','webm'],
  ['efectos/orden.webm','webm'],
  ['efectos/combo-ataque-x2.webm','webm'],
  ['efectos/combo-ataque-x3.webm','webm'],
  ['efectos/combo-defensa-x2.webm','webm'],
  ['efectos/combo-defensa-x3.webm','webm'],
  ['cartas/decreto-ataque.webp','webp'],
  ['cartas/decreto-defensa.webp','webp'],
  ['cartas/decreto-orden.webp','webp'],
  ['cartas/decreto-impacto.webp','webp'],
  ...(!skipGenerated?[
    ['escenarios/partida-inicial-loop.mp4','mp4'],
    ['escenarios/partida-inicial-poster.jpg','jpg'],
  ]:[]),
];
const signatures={
  webm: bytes=>bytes.subarray(0,4).equals(Buffer.from([0x1a,0x45,0xdf,0xa3])),
  webp: bytes=>bytes.toString('latin1',0,4)==='RIFF'&&bytes.toString('latin1',8,12)==='WEBP',
  mp4: bytes=>bytes.toString('latin1',4,8)==='ftyp',
  jpg: bytes=>bytes[0]===0xff&&bytes[1]===0xd8&&bytes[2]===0xff,
  png: bytes=>bytes.subarray(0,8).equals(Buffer.from([137,80,78,71,13,10,26,10])),
};

let totalBytes=0;
const failures=[];
for(const [name,type] of critical){
  try{
    const path=join(root,name);
    const file=await readFile(path);
    const size=(await stat(path)).size;
    assert.ok(size>24,'archivo vacío o marcador incorrecto');
    assert.ok(signatures[type](file),'firma no coincide con '+type);
    totalBytes+=size;
    console.log('[recurso OK]',name,Math.round(size/1024)+' KiB');
  }catch(error){failures.push(name+': '+error.message);}
}
try{
  const html=await readFile(join(root,'index.html'),'utf8');
  assert.match(html,/<title>Decreto Real/,'falta título público');
  assert.match(html,/\/Decreto-Real\/assets\/[^"\s]+\.js/,'no hay JavaScript compilado bajo Pages');
  assert.ok(!html.includes('src="./index.tsx"'),'se publicó HTML de desarrollo');
}catch(error){failures.push('index.html: '+error.message);}
if(failures.length){
  console.error('La publicación NO está lista:\n'+failures.map(x=>' - '+x).join('\n'));
  process.exitCode=1;
}else{
  console.log('AUDITORÍA OK: '+critical.length+' recursos, '+Math.round(totalBytes/1024)+' KiB, base Pages correcta.');
}
