import test from 'node:test';
import assert from 'node:assert/strict';
import { copyTransform, formatTransform, parseTransform } from './transformClipboard.ts';
import { defaultLayerTransform } from './schema.ts';

test('a copied transform round-trips through readable clipboard text',()=>{
  const t={...defaultLayerTransform('actor'),x:12.5,y:-3,scale:1.1,rotation:15,mirror:true,z:20,opacity:.8,visible:false};
  const copied=copyTransform(t);
  assert.equal('visible' in copied,false,'visibility is not copied');
  const text=formatTransform(copied);
  assert.match(text,/X: 12.5 % · Y: -3 % · Escala: 110 % · Rotación: 15° · Capa: 20 · Opacidad: 80 % · Espejado/);
  assert.deepEqual(parseTransform(text),copied);
  assert.equal(parseTransform('otra cosa'),null);
  assert.equal(parseTransform(text.replace('"z":20','"z":"x"')),null);
});
