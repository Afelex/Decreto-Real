#!/usr/bin/env node
/**
 * Import approved G3 UI artwork with strict archive paths and SHA-256 checks.
 * Run only with the approved archive; existing mismatched files are never overwritten.
 */
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const zipFile = process.argv[2];
if (!zipFile || !fs.existsSync(zipFile)) {
  console.error('Uso: node tools/importar-g3-ui.mjs incoming/DecretoReal_G3_Imagenes_Integracion.zip');
  process.exit(1);
}

const names = [
  'ui_puertas_reales_maestro_v01.png',
  'ui_presentacion_jugador_rojo_v01.png',
  'ui_presentacion_rival_azul_v01.png',
  'ui_boton_menu_base_v01.png',
  'ui_boton_menu_pulsado_v01.png',
  'ui_boton_accion_base_v01.png',
  'ui_victoria_cartela_v01.png',
  'ui_derrota_cartela_v01.png',
  'ui_sello_resultado_v01.png',
];
const webps = [
  'ui_puertas_reales_izquierda_v01.webp',
  'ui_puertas_reales_derecha_v01.webp',
  ...names.slice(1).map(name => name.replace(/\.png$/, '.webp')),
];
const allowed = new Set([
  'manifest.json', 'README.txt',
  ...names.map(name => 'maestros_png/' + name),
  ...webps.map(name => 'public/interfaz/g3/' + name),
]);
const listing = execFileSync('unzip', ['-Z1', zipFile], { encoding: 'utf8' })
  .split(/\r?\n/).filter(Boolean);
const unexpected = listing.filter(name => !allowed.has(name));
if (unexpected.length || listing.length !== allowed.size || new Set(listing).size !== listing.length) {
  throw new Error('Contenido ZIP inesperado, repetido o incompleto: ' + unexpected.join(', '));
}
const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'dr-g3-ui-'));
const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
try {
  execFileSync('unzip', ['-q', zipFile, '-d', tmpDir]);
  const manifest = JSON.parse(fs.readFileSync(path.join(tmpDir, 'manifest.json'), 'utf8'));
  if (!Array.isArray(manifest.assets) || manifest.assets.length !== webps.length) {
    throw new Error('Catálogo de G3 incompleto');
  }
  const map = new Map(manifest.assets.map(asset => [asset.relative_path, asset]));
  for (const name of webps) {
    const relative = 'public/interfaz/g3/' + name;
    const entry = map.get(relative);
    const file = path.join(tmpDir, relative);
    if (!entry || !fs.statSync(file).isFile() || sha256(file) !== entry.sha256) {
      throw new Error('SHA-256 incorrecto: ' + relative);
    }
    const header = fs.readFileSync(file).subarray(0, 12);
    if (header.toString('ascii', 0, 4) !== 'RIFF' || header.toString('ascii', 8, 12) !== 'WEBP') {
      throw new Error('Archivo WebP inválido: ' + relative);
    }
  }
  const targets = [
    ...names.map(name => ['maestros_png/' + name, 'art-reference/g3-ui/maestros_png/' + name]),
    ...webps.map(name => ['public/interfaz/g3/' + name, 'public/interfaz/g3/' + name]),
  ];
  for (const [from, to] of targets) {
    const src = path.join(tmpDir, from);
    const dst = path.resolve(to);
    if (fs.existsSync(dst)) {
      if (sha256(src) !== sha256(dst)) throw new Error('Conflicto con un asset existente: ' + to);
      continue;
    }
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    fs.copyFileSync(src, dst);
  }
  console.log('Verificados e importados', names.length, 'maestros y', webps.length, 'derivados web.');
} finally {
  fs.rmSync(tmpDir, { recursive: true, force: true });
}
