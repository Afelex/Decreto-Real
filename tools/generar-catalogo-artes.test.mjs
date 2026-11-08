import {test} from 'node:test';
import {strict as assert} from 'node:assert';
import {buildCatalog,category} from './generar-catalogo-artes.mjs';
test('El catálogo incorpora las imágenes de campaña, prólogo y de interfaz',()=>{
  const data=buildCatalog();
  assert.equal(data.version,1);
  assert.ok(data.items.length>=100);
  assert.ok(data.items.some(item=>item.path==='public/campania/arte/fondos/region-1-base.webp'));
  assert.ok(data.items.some(item=>item.path==='public/campania/arte/retratos/rival-01-domingo-quispe.webp'));
  assert.ok(data.items.some(item=>item.path==='public/campania/prologo/sprites/xervias_01_objecion.webp'));
  assert.ok(data.items.every(item=>!item.path.includes('..')&&item.bytes>=0));
  assert.equal(new Set(data.items.map(item=>item.path)).size,data.items.length);
});
test('El arte publicado de DRStudio se distingue en el catálogo',()=>{
  assert.equal(category('public/studio/media/media-demo.webp'),'Arte publicado desde DRStudio');
});
