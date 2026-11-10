import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {buildCatalog,category} from './generar-catalogo-artes.mjs';
import {ACTIVE_GENERATION,LEGACY_GENERATION,artGeneration} from './arte-generaciones.mjs';
test('El catálogo incorpora las imágenes de campaña, prólogo y de interfaz',()=>{
  const data=buildCatalog();
  assert.equal(data.version,2);
  assert.equal(data.activeGeneration,ACTIVE_GENERATION);
  assert.ok(data.items.length>=100);
  assert.ok(data.items.some(item=>item.path==='public/campania/arte/fondos/region-1-base.webp'));
  assert.ok(data.items.some(item=>item.path==='public/campania/arte/retratos/rival-01-domingo-quispe.webp'));
  assert.ok(data.items.some(item=>item.path==='public/campania/prologo/sprites/xervias_01_objecion.webp'));
  assert.ok(data.items.every(item=>!item.path.includes('..')&&item.bytes>=0));
  assert.equal(new Set(data.items.map(item=>item.path)).size,data.items.length);
  assert.ok(data.items.every(i=>[ACTIVE_GENERATION,LEGACY_GENERATION].includes(i.generation)));
  assert.ok(data.items.every(i=>!i.path.startsWith('public/archivo-historico/')));
});
test('El arte publicado de DRStudio se distingue en el catálogo',()=>{
  assert.equal(category('public/studio/media/media-demo.webp'),'Arte publicado desde DRStudio');
});

test('G1 y G2 conservan rutas diferentes',()=>{
  assert.equal(artGeneration('public/campania/arte/fondos/region-1-base.webp'),LEGACY_GENERATION);
  assert.equal(artGeneration('public/artes/generaciones/DR-G2-2026/fondos/callao.png'),ACTIVE_GENERATION);
  assert.equal(category('public/artes/generaciones/DR-G2-2026/personajes/xervias.png'),'Personajes');
});
