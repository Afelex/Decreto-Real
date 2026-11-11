import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('plan 02 conserva seis maestros SHA-256 y 36 expresiones futuras sin publicarlas',()=>{
 const data=JSON.parse(readFileSync('art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json','utf8'));
 assert.equal(data.batch,'DR-G2-PER-LOTE-02');
 assert.equal(data.status,'planning_only_no_images_generated');
 assert.equal(data.characters.length,6);
 assert.equal(data.characters.reduce((n,p)=>n+p.variants.length,0),36);
 assert.equal(new Set(data.characters.flatMap(p=>p.variants.map(v=>v.id))).size,36);
 for(const person of data.characters){
  const file=readFileSync(person.master.path);
  assert.equal(createHash('sha256').update(file).digest('hex'),person.master.sha256);
  for(const variant of person.variants){
   assert.equal(variant.status,'planned_not_generated');
   assert.ok(variant.outputCandidate.startsWith('art-output/g2-personajes/lote-02/'+person.id+'/'));
   assert.ok(variant.outputCandidate.endsWith('.png'));
  }
 }
 assert.equal(data.output.alphaRequired,true);
});
