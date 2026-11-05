import test from 'node:test';
import assert from 'node:assert/strict';
import { existsSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { readCatalog, validateCatalog, buildRequest, run } from './generate-prologue-art.mjs';

test('the complete prologue catalog contains exactly 18 sprites and 5 cinematic scenes',()=>{
  const {data,digest}=readCatalog();
  assert.equal(data.items.length,23);
  assert.equal(data.items.filter(x=>x.kind==='sprite').length,18);
  assert.equal(data.items.filter(x=>x.kind!=='sprite').length,5);
  assert.equal(new Set(data.items.map(x=>x.id)).size,23);
  assert.ok(digest.length===64);
  assert.equal(validateCatalog(data),true);
});
test('all output paths are deterministic and reference their canonical existing identity',()=>{
  const {data}=readCatalog();
  for(const item of data.items){
    assert.match(item.file,/^(sprites|fondos|planos)\/[a-z0-9_-]+\.webp$/);
    assert.match(item.prompt,/Decreto Real/);
    assert.ok(item.prompt.length>120);
  }
  const byId=Object.fromEntries(data.items.map(x=>[x.id,x]));
  assert.ok(byId.Z01.references.some(x=>x.endsWith('/retratos/rival.webp')));
  assert.ok(byId.X01.references.some(x=>x.endsWith('/retratos/jugador.webp')));
  assert.ok(byId.D02.references.some(x=>x.endsWith('domingo_01_neutro.webp')));
  assert.ok(byId.M03.references.some(x=>x.endsWith('madre_01_protectora.webp')));
  assert.ok(byId.N02.references.some(x=>x.endsWith('nino_01_asustado.webp')));
});
test('requests use image editing for identity, transparent WEBP for sprites',()=>{
  const {data}=readCatalog();
  const item=data.items.find(x=>x.id==='Z01');
  const req=buildRequest(item);
  assert.match(req.url,/\/images\/edits$/);
  assert.equal(req.payload.background,'transparent');
  assert.equal(req.payload.output_format,'webp');
  assert.equal(req.payload.size,'1024x1536');
  assert.equal(req.payload.quality,'medium');
  assert.equal(req.payload.model,'gpt-image-2.5-flare');
  assert.ok(req.payload.images.length>0);
});
test('an environmental background never requests transparency',()=>{
  const {data}=readCatalog();
  const item=data.items.find(x=>x.id==='F01');
  const req=buildRequest(item);
  assert.match(req.url,/\/images\/generations$/);
  assert.equal(req.payload.background,'opaque');
});
test('paid generation refuses requests without explicit consent or API key',async()=>{
  await assert.rejects(run({mode:'generate',confirm:'NO',key:'example'}),/GENERAR_23/);
  await assert.rejects(run({mode:'generate',confirm:'GENERAR_23',key:''}),/OPENAI_API_KEY/);
});
test('free plan creates a preview status without calling the paid API',async()=>{
  const stats=await run({mode:'plan',key:''});
  assert.equal(stats.planned,23);
  assert.equal(stats.errors.length,0);
});
