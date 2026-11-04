#!/usr/bin/env node
/** Copy a previously produced, verified GitHub Actions art package into the campaign.
 * This script never requests image generation or touches combat/gameplay state.
 * Run after downloading artifact DECRETO-REAL-47-IMAGENES from run 41921898124.
 */
import { copyFileSync, existsSync, mkdirSync, readFileSync, statSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { catalogo } from './art-github.mjs';

const repo = resolve(dirname(fileURLToPath(import.meta.url)), '..');
const input = resolve(process.env.ART_PACKAGE_DIR || join(repo, 'art-package'));
const output = join(repo, 'public', 'campania', 'arte');

export function importCampaignArt() {
  const manifestPath = join(input, 'manifest.json');
  if (!existsSync(manifestPath)) throw Error('No se encontró manifest.json en el artefacto aprobado.');
  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  const catalog = catalogo();
  if (manifest.modo !== 'generar' || manifest.completadas !== 47 ||
      manifest.items?.length !== 47 || manifest.faltantes?.length !== 0 ||
      catalog.length !== 47) {
    throw Error('El artefacto no confirma exactamente 47 imágenes completas.');
  }

  const expected = new Map(catalog.map(item => [item.id, item.filename]));
  const found = new Set();
  // Verify EVERYTHING before copying ANYTHING to the public game assets.
  for (const item of manifest.items) {
    if (expected.get(item.id) !== item.archivo || found.has(item.id)) {
      throw Error('Imagen desconocida o duplicada: ' + item.id);
    }
    found.add(item.id);
    const source = join(input, item.archivo);
    if (!existsSync(source) || statSync(source).size < 100) {
      throw Error('Imagen ausente o vacía: ' + item.archivo);
    }
    const header = readFileSync(source).subarray(0, 12);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
      throw Error('No es un WebP válido: ' + item.archivo);
    }
  }
  if (found.size !== 47) throw Error('Hay imágenes faltantes en el artefacto.');

  for (const item of manifest.items) {
    const target = join(output, item.archivo);
    mkdirSync(dirname(target), { recursive: true });
    copyFileSync(join(input, item.archivo), target);
  }
  const backgrounds = manifest.items.filter(item => item.tipo === 'fondo').length;
  const portraits = manifest.items.filter(item => item.tipo === 'retrato').length;
  if (backgrounds !== 18 || portraits !== 29) throw Error('Conteo incorrecto de fondos o retratos.');
  console.log('Integradas ' + found.size + '/47 imágenes: ' + backgrounds + ' fondos y ' + portraits + ' retratos.');
  return { total: found.size, backgrounds, portraits, output };
}

if (process.argv[1] && resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  try { importCampaignArt(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
