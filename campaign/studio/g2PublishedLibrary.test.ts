import test from 'node:test';
import assert from 'node:assert/strict';
import { publishedG2StudioAssets, fetchPublishedG2File } from './g2PublishedLibrary.ts';
import { g2SceneAssignments } from './g2SceneAssignments.ts';
import { G2_ASSET_PATHS, g2AssetIsPublished } from '../g2Artwork.ts';

test('la biblioteca de Studio presenta exactamente los 25 G2 publicados sin importar ZIP',()=>{
  const assets=publishedG2StudioAssets('/Decreto-Real/');
  assert.equal(assets.length,25);
  assert.equal(new Set(assets.map(asset=>asset.id)).size,25);
  assert.ok(assets.every(asset=>asset.url==='/Decreto-Real/'+G2_ASSET_PATHS[asset.id]));
  assert.ok(assets.every(asset=>g2AssetIsPublished(asset.id)));
  assert.ok(assets.every(asset=>asset.path.endsWith('.webp')));
});

test('los G2 publicados aparecen asociados a las 110 pantallas previstas, sin mutar escenas',()=>{
  const assigned=g2SceneAssignments();
  const assets=publishedG2StudioAssets('/Decreto-Real/');
  assert.equal(assigned.length,110);
  assert.equal(assets.reduce((count,asset)=>count+asset.sceneKeys.length,0),110);
  const byId=Object.fromEntries(assets.map(asset=>[asset.id,asset.sceneKeys]));
  assert.ok(byId['G2-FON-002'].includes('mision-01/briefing'));
  assert.ok(byId['G2-M35-A'].includes('mision-35/preludio-01'));
  assert.ok(byId['G2-M35-B'].includes('mision-35/preludio-06'));
  assert.ok(byId['G2-M35-C'].includes('mision-35/preludio-11'));
  assert.ok(byId['G2-M36-B'].includes('mision-36/duelo'));
});

test('solo se acepta el WebP publicado: no se almacena una respuesta HTML accidental',async()=>{
  const asset=publishedG2StudioAssets('/Decreto-Real/').find(item=>item.id==='G2-M35-C')!;
  const htmlFetch=(async()=>new Response('<html>Error 200</html>',{status:200})) as typeof fetch;
  await assert.rejects(fetchPublishedG2File(asset,htmlFetch),/Tamaño inválido|firma WebP/);
  const failedFetch=(async()=>new Response('No encontrado',{status:404})) as typeof fetch;
  await assert.rejects(fetchPublishedG2File(asset,failedFetch),/descargar/);
});
