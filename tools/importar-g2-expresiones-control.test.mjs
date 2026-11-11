import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {CANDIDATES,BATCH_SHA,INPUT_MANIFEST,allowedPath,outputPath,validateEntryNames}
  from './importar-g2-expresiones-control.mjs';

test('seis candidatos de control únicos, sin activar G1 ni otros sprites',()=>{
 assert.equal(CANDIDATES.length,6);
 assert.equal(new Set(CANDIDATES.map(x=>x.id)).size,6);
 assert.match(BATCH_SHA,/^[0-9a-f]{64}$/);
 for(const c of CANDIDATES){
  assert.match(c.sha256,/^[0-9a-f]{64}$/);
  assert.match(c.masterSha,/^[0-9a-f]{64}$/);
  assert.equal(allowedPath(c),'candidatos/'+c.id+'/'+c.variant+'.png');
  assert.equal(outputPath(c),'art-reference/personajes-oficiales/'+allowedPath(c));
 }
});
test('el ZIP de seis expresiones no admite rutas arbitrarias, repetidas ni otros assets',()=>{
 const paths=['README.txt',INPUT_MANIFEST,...CANDIDATES.map(allowedPath)];
 assert.equal(validateEntryNames(paths),true);
 assert.throws(()=>validateEntryNames([...paths,'../../private.png']),/exactamente 8/);
 assert.throws(()=>validateEntryNames([...paths.slice(0,-1),'../private.png']),/no autorizada/);
 assert.throws(()=>validateEntryNames([...paths.slice(0,-1),paths[2]]),/duplicadas/);
});
test('cada variante -02 tiene un original exacto documentado y aprobación desactivada',()=>{
 const canon=JSON.parse(readFileSync('art-reference/personajes-oficiales/catalogo.json','utf8'));
 const plan=JSON.parse(readFileSync('art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json','utf8'));
 assert.equal(plan.characters.length,6);
 for(const c of CANDIDATES){
  const person=canon.personajes.find(x=>x.id===c.id);
  assert.equal(person?.verificacionOriginalRecuperado.sha256,c.masterSha);
  const variant=plan.characters.find(x=>x.id===c.id)?.variants.find(x=>x.id==='G2-PER-'+c.id.toUpperCase()+'-02');
  assert.ok(variant,'Expresión no prevista: '+c.id);
  assert.ok(['planned_not_generated','candidate_generated_not_approved'].includes(variant.status));
  assert.notEqual(variant.status,'approved');
 }
});
