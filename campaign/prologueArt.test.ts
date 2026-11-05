import assert from 'node:assert/strict';
import test from 'node:test';
import { PROLOGUE_ART_FILES, isPrologueArtManifest, PROLOGUE_COMPLETE_KEY } from './prologueArt.ts';

test('all 23 prologue artworks have stable public WEBP paths',()=>{
  assert.equal(Object.keys(PROLOGUE_ART_FILES).length,23);
  assert.equal(new Set(Object.values(PROLOGUE_ART_FILES)).size,23);
  for(const path of Object.values(PROLOGUE_ART_FILES))assert.match(path,/^(sprites|fondos|planos)\/[a-z0-9_-]+\.webp$/);
});
test('the app refuses incomplete manifests rather than displaying broken generated sprites',()=>{
  assert.equal(isPrologueArtManifest({completed:23,files:PROLOGUE_ART_FILES}),true);
  assert.equal(isPrologueArtManifest({completed:22,files:PROLOGUE_ART_FILES}),false);
  assert.equal(isPrologueArtManifest(null),false);
  assert.equal(isPrologueArtManifest({completed:23,files:{D01:'sprites/incorrecto.webp'}}),false);
});
test('prologue completion storage stays separate from the full campaign save',()=>{
  assert.match(PROLOGUE_COMPLETE_KEY,/prologo/);
  assert.notEqual(PROLOGUE_COMPLETE_KEY,'decreto-real.campania.v1');
});
