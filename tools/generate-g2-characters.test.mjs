import test from 'node:test';
import assert from 'node:assert/strict';
import {deflateSync} from 'node:zlib';
import {catalog,inspectTransparentPng,run} from './generate-g2-characters.mjs';

test('lote 01: 8 propuestas, identidades y referencias oficiales legibles',()=>{
 const doc=catalog();
 assert.equal(doc.items.length,8);
 assert.deepEqual(doc.items.map(i=>i.characterId),[
  'xervias','xervias','xervias','xervias','zhinchi','zhinchi','zhinchi','zhinchi'
 ]);
 assert.equal(doc.sourceMasterStatus,'official_13_original_pngs_not_yet_in_repo');
 assert.ok(doc.items.every(i=>i.references.length>=1&&i.status==='candidate_not_approved'));
 assert.ok(doc.items.filter(i=>i.characterId==='zhinchi').every(i=>/RUBIO/.test(i.prompt)&&/AZULES/.test(i.prompt)));
 assert.ok(doc.items.every(i=>i.prompt.includes('TRANSPARENTE')));
});

test('plan no pagado: filtra Xervias y Zhinchi por separado y no publica',async()=>{
 const one=await run({mode:'plan',group:'xervias'});
 const two=await run({mode:'plan',group:'zhinchi'});
 assert.equal(one.candidates.length,4);
 assert.equal(two.candidates.length,4);
 assert.ok(one.candidates.every(x=>x.id.includes('XERVIAS')));
 assert.ok(two.candidates.every(x=>x.id.includes('ZHINCHI')));
 assert.equal(one.published,false);
 assert.equal(two.approved,false);
});

test('un gasto sin autorización explícita queda bloqueado',async()=>{
 await assert.rejects(run({mode:'generate',group:'ambos',confirm:'NO',key:'secreto-demo'}),/Sin confirmación explícita/);
 await assert.rejects(run({mode:'generate',group:'ambos',confirm:'GENERAR_8_PERSONAJES_G2',key:''}),/Falta OPENAI_API_KEY/);
});

function png(rgbaAlpha){
 const w=1024,h=1536;
 const rows=Buffer.alloc((w*4+1)*h);
 for(let y=0;y<h;y++){
  const row=y*(w*4+1);
  rows[row]=0;
  for(let x=0;x<w;x++)rows[row+1+x*4+3]=rgbaAlpha;
 }
 const chunk=(tag,bytes)=>{
  const length=Buffer.alloc(4);length.writeUInt32BE(bytes.length);
  // La inspección analiza estructura y datos de píxeles; el CRC lo genera la API real.
  return Buffer.concat([length,Buffer.from(tag,'ascii'),bytes,Buffer.alloc(4)]);
 };
 const ihdr=Buffer.alloc(13);
 ihdr.writeUInt32BE(w,0);ihdr.writeUInt32BE(h,4);ihdr[8]=8;ihdr[9]=6;
 return Buffer.concat([
  Buffer.from([137,80,78,71,13,10,26,10]),
  chunk('IHDR',ihdr),chunk('IDAT',deflateSync(rows)),chunk('IEND',Buffer.alloc(0))
 ]);
}
test('valida canal alfa real y dimensiones; rechaza PNG opaco aunque sea RGBA',()=>{
 const valid=inspectTransparentPng(png(0));
 assert.equal(valid.width,1024);
 assert.equal(valid.height,1536);
 assert.equal(valid.alphaCoverage,1);
 assert.throws(()=>inspectTransparentPng(png(255)),/transparencia/);
 assert.throws(()=>inspectTransparentPng(Buffer.from('NO ES PNG')),/PNG válido/);
});
