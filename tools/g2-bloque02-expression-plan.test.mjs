import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createHash} from 'node:crypto';

test('plan 02 conserva seis maestros, seis candidatos no aprobados y 30 expresiones futuras',()=>{
 const data=JSON.parse(readFileSync('art-reference/personajes-oficiales/G2-EXPRESIONES-BLOQUE-02.json','utf8'));
 assert.equal(data.batch,'DR-G2-PER-LOTE-02');
 assert.equal(data.status,'six_control_candidates_imported_not_approved');
 assert.equal(data.characters.length,6);
 assert.equal(data.characters.reduce((n,p)=>n+p.variants.length,0),36);
 assert.equal(new Set(data.characters.flatMap(p=>p.variants.map(v=>v.id))).size,36);
 let candidateCount=0;
 for(const person of data.characters){
  const file=readFileSync(person.master.path);
  assert.equal(createHash('sha256').update(file).digest('hex'),person.master.sha256);
  for(const variant of person.variants){
   assert.ok(['planned_not_generated','candidate_generated_not_approved'].includes(variant.status));
   if(variant.status==='candidate_generated_not_approved'){
     candidateCount++;
     assert.ok(variant.fileInRepo.startsWith('art-reference/personajes-oficiales/candidatos/'+person.id+'/'));
     assert.equal(variant.alphaRequired,true);
     const candidate=readFileSync(variant.fileInRepo);
     assert.equal(createHash('sha256').update(candidate).digest('hex'),variant.sha256);
   }
   assert.ok(variant.outputCandidate.startsWith('art-output/g2-personajes/lote-02/'+person.id+'/'));
   assert.ok(variant.outputCandidate.endsWith('.png'));
  }
 }
 assert.equal(candidateCount,6);
 assert.equal(data.output.alphaRequired,true);
});
