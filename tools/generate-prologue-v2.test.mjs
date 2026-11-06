import assert from 'node:assert/strict';
import test from 'node:test';
import { catalog,produce } from './generate-prologue-v2.mjs';
test('seven distinct new resources with one reference identity for all Domingo variants',()=>{
 const data=catalog();assert.equal(data.version,2);assert.equal(data.items.length,7);
 assert.deepEqual(data.items.map(x=>x.id),['D01','D02','D03','D04','D05','F01','F02']);
 for(const image of data.items){assert.match(image.file,/\.webp$/);assert.ok(image.prompt.length>130)}
 for(const image of data.items.filter(x=>['D02','D03','D04','D05'].includes(x.id)))
   assert.ok(image.refs.some(x=>x.endsWith('domingo_01_serio.webp')));
});
test('master forbids cards; only confrontation pose points, duel portrait is a tight bust',()=>{
 const data=catalog();const by=Object.fromEntries(data.items.map(x=>[x.id,x]));
 for(const id of ['D01','D02','D04','D05'])assert.match(by[id].prompt,/no cards|no deck|NO cards|no playing cards/i);
 assert.match(by.D03.prompt,/POINTING FORWARD/);
 assert.match(by.D05.prompt,/head-and-shoulders/);
 assert.match(by.F01.prompt,/NO PEOPLE/);
});
test('free plan cannot consume API credits',async()=>{
 const result=await produce({mode:'plan',key:''});
 assert.equal(result.mode,'plan');assert.equal(result.generated.length+result.skipped.length,7);
});
test('paid API calls require explicit confirmation and an API key',async()=>{
 await assert.rejects(produce({mode:'generate',confirm:'NO',key:'fake'}),/GENERAR_7/);
 await assert.rejects(produce({mode:'generate',confirm:'GENERAR_7',key:''}),/OPENAI_API_KEY/);
});
