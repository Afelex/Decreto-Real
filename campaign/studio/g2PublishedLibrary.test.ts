import { expect, test } from 'vitest';
import { publishedG2StudioAssets, fetchPublishedG2File } from './g2PublishedLibrary.ts';
import { g2SceneAssignments } from './g2SceneAssignments.ts';
import { G2_ASSET_PATHS, g2AssetIsPublished } from '../g2Artwork.ts';

test('la biblioteca de Studio presenta exactamente los 25 G2 publicados sin importar ZIP',()=>{
  const assets=publishedG2StudioAssets('/Decreto-Real/');
  expect(assets).toHaveLength(25);
  expect(new Set(assets.map(asset=>asset.id)).size).toBe(25);
  expect(assets.every(asset=>asset.url==='/Decreto-Real/'+G2_ASSET_PATHS[asset.id])).toBe(true);
  expect(assets.every(asset=>g2AssetIsPublished(asset.id))).toBe(true);
  expect(assets.every(asset=>asset.path.endsWith('.webp'))).toBe(true);
});

test('los G2 publicados aparecen asociados a las 110 pantallas previstas, sin mutar escenas',()=>{
  const assigned=g2SceneAssignments();
  const assets=publishedG2StudioAssets('/Decreto-Real/');
  expect(assigned).toHaveLength(110);
  expect(assets.reduce((count,asset)=>count+asset.sceneKeys.length,0)).toBe(110);
  const byId=Object.fromEntries(assets.map(asset=>[asset.id,asset.sceneKeys]));
  expect(byId['G2-FON-002']).toContain('mision-01/briefing');
  expect(byId['G2-M35-A']).toContain('mision-35/preludio-01');
  expect(byId['G2-M35-B']).toContain('mision-35/preludio-06');
  expect(byId['G2-M35-C']).toContain('mision-35/preludio-11');
  expect(byId['G2-M36-B']).toContain('mision-36/duelo');
});

test('solo se acepta el WebP publicado: no se almacena una respuesta HTML accidental',async()=>{
  const asset=publishedG2StudioAssets('/Decreto-Real/').find(item=>item.id==='G2-M35-C')!;
  const htmlFetch=(async()=>new Response('<html>Error 200</html>',{status:200})) as typeof fetch;
  await expect(fetchPublishedG2File(asset,htmlFetch)).rejects.toThrow(/Tamaño inválido|firma WebP/);
  const failedFetch=(async()=>new Response('No encontrado',{status:404})) as typeof fetch;
  await expect(fetchPublishedG2File(asset,failedFetch)).rejects.toThrow(/descargar/);
});
