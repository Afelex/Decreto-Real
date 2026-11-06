import test from 'node:test';
import assert from 'node:assert/strict';
import {catalog,produce} from './generate-prologue-v3.mjs';
test('all six original transparent PNG resources have fixed ids and sequential usable references',()=>{
 const j=catalog();assert.equal(j.version,3);
 assert.deepEqual(j.items.map(a=>a.id),['N03','N04','X05','D07','G01','D08']);
 assert.ok(j.items.every(a=>a.file.endsWith('.png')));
 for(const a of j.items)assert.ok(a.prompt.length>200);
});
test('new boy has clearly different haircut, ring only has no card, and Domingo battle art has integrated card',()=>{
 const j=catalog();const p=Object.fromEntries(j.items.map(a=>[a.id,a]));
 assert.match(p.N03.prompt,/CURLY/);
 assert.match(p.N03.prompt,/not look like Xervias/i);
 assert.ok(p.N04.refs[0].endsWith('nino_03_asustado.png'));
 assert.match(p.X05.prompt,/NO card/);
 assert.match(p.D07.prompt,/ENRAGED/);
 assert.match(p.G01.prompt,/TRANSPARENT|transparent/i);
 assert.match(p.D08.prompt,/SAME PNG sprite/i);
 assert.ok(p.D08.refs.some(ref=>ref.endsWith('carta_dorada_invocacion.png')));
});
test('plan is free and manifest generation is guarded from accidental paid calls',async()=>{
 const result=await produce({mode:'plan',key:''});
 assert.equal(result.generated.length+result.skipped.length,6);
 await assert.rejects(produce({mode:'generate',confirm:'NO',key:'invalid'}),/GENERAR_6_V3/);
 await assert.rejects(produce({mode:'generate',confirm:'GENERAR_6_V3',key:''}),/OPENAI_API_KEY/);
});
