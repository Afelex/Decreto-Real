import test from 'node:test';
import assert from 'node:assert/strict';
import {EXPECTED,validateNames,inspectSignature} from './importar-personajes-g2-bloque02.mjs';

test('son exactamente seis generales y el lote de ocho entradas controladas',()=>{
  assert.equal(Object.keys(EXPECTED).length,6);
  const entries=['LEEME.txt','manifiesto-seis-generales-G2.json',
    ...Object.keys(EXPECTED).map(id=>'originales/'+id+'.png')];
  assert.equal(validateNames(entries),true);
  assert.throws(()=>validateNames([...entries,'originales/otro.png']),/exactamente ocho/);
  assert.throws(()=>validateNames([...entries.slice(0,-1),'../../secreto']),/no autorizada/);
  assert.throws(()=>validateNames([...entries.slice(0,-1),entries[2]]),/duplicadas/);
});
test('rechaza extensión PNG falsa y exige RGBA auténtico cuando procede',()=>{
  const png=Buffer.alloc(33);
  Buffer.from([137,80,78,71,13,10,26,10]).copy(png);
  png.write('IHDR',12,'ascii');png.writeUInt32BE(1125,16);png.writeUInt32BE(1398,20);png[24]=8;png[25]=6;
  assert.equal(inspectSignature(png,EXPECTED['octavio-argento']),true);
  png[25]=2;
  assert.throws(()=>inspectSignature(png,EXPECTED['octavio-argento']),/RGBA/);
  const jpeg=Buffer.from([255,216,255,224,0,16]);
  assert.equal(inspectSignature(jpeg,EXPECTED['leandro-valcazar']),true);
  assert.throws(()=>inspectSignature(Buffer.from('not-a-jpeg'),EXPECTED['leandro-valcazar']),/JPEG/);
});
