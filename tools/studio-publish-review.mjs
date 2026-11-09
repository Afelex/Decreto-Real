/** Revisión sin efectos secundarios previa a publicar un ZIP de DRStudio. */
import { readFile } from 'node:fs/promises';
import { resolve, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { parseStudioPackage, buildStudioPackage } from '../campaign/studio/package.ts';
import { normalizeStudioDocumentV3 } from '../campaign/studio/schema.ts';
import { referencedAssetIds, withoutUnusedAssets } from '../campaign/studio/ops.ts';

export function inspectStudioPublication(zipBytes, currentDocument = {version:3, scenes:{}}) {
  const parsed = parseStudioPackage(zipBytes);
  if (parsed.format !== 'zip') throw new Error('La publicación requiere el ZIP exportado por DRStudio.');
  // La validación de firmas, referencias y tamaños es idéntica a la del publicador.
  buildStudioPackage(parsed.doc, parsed.media);
  const incoming = withoutUnusedAssets(normalizeStudioDocumentV3(parsed.doc));
  const current = normalizeStudioDocumentV3(currentDocument);
  const oldScenes = current.scenes ?? {};
  const newScenes = incoming.scenes ?? {};
  const oldKeys = Object.keys(oldScenes);
  const newKeys = Object.keys(newScenes);
  const added = newKeys.filter(key => !Object.hasOwn(oldScenes, key)).sort();
  const removed = oldKeys.filter(key => !Object.hasOwn(newScenes, key)).sort();
  const changed = newKeys.filter(key => Object.hasOwn(oldScenes, key)
    && JSON.stringify(oldScenes[key]) !== JSON.stringify(newScenes[key])).sort();
  const usedBefore = referencedAssetIds(current);
  const usedAfter = referencedAssetIds(incoming);
  const removedMedia = [...usedBefore].filter(id => !usedAfter.has(id)).sort();
  const addedMedia = [...usedAfter].filter(id => !usedBefore.has(id)).sort();
  return {
    valid: true, format: parsed.format,
    scenes: {before:oldKeys.length, after:newKeys.length, added, changed, removed},
    media: {before:usedBefore.size, after:usedAfter.size, added:addedMedia, removed:removedMedia},
    requiresRemovalConfirmation: removed.length > 0 || removedMedia.length > 0,
  };
}

export async function reviewStudioPublication(zipPath, repositoryRoot = '.') {
  const zip = new Uint8Array(await readFile(resolve(zipPath)));
  const publishedPath = join(resolve(repositoryRoot), 'public/studio/composiciones.json');
  let published;
  try { published = JSON.parse(await readFile(publishedPath, 'utf8')); }
  catch (error) {
    if (error.code !== 'ENOENT') throw error;
    // No existe todavía un manifiesto publicado: primera publicación.
    published = {version:3, scenes:{}};
  }
  return inspectStudioPublication(zip, published);
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  const [zip, root = '.'] = process.argv.slice(2);
  if (!zip) throw new Error('Uso: node --experimental-strip-types tools/studio-publish-review.mjs paquete.zip [repositorio]');
  const report = await reviewStudioPublication(zip, root);
  console.log(JSON.stringify(report, null, 2));
  if (report.requiresRemovalConfirmation) {
    console.error('ATENCIÓN: hay escenas o recursos que desaparecerían. Revisa el informe antes de publicar.');
    process.exitCode = 2;
  }
}
