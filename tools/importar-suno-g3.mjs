#!/usr/bin/env node
/**
 * Instala las seis composiciones G3 SOLO tras comprobar el ZIP aprobado y
 * hashes individuales. Nunca borra los WAV maestros de la biblioteca original.
 * Conserva los SFX y evita sobrescribir un archivo diferente.
 */
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import crypto from 'node:crypto';
import { execFileSync } from 'node:child_process';

const zipFile = process.argv[2];
if (!zipFile || !fs.existsSync(zipFile)) {
  console.error('Uso: node tools/importar-suno-g3.mjs incoming/DecretoReal_G3_Audio_Integracion.zip');
  process.exit(1);
}

const names = [
  'mus_menu_reinos_del_peru_v01.mp3',
  'mus_presentacion_duelo_v01.mp3',
  'mus_combate_ia_v01.mp3',
  'mus_combate_tension_critica_v01.mp3',
  'mus_victoria_v01.mp3',
  'mus_derrota_v01.mp3',
];
const prefix = 'public/audio/suno-g3/';
const allowed = new Set([
  'manifest.json', 'README.txt', ...names.map(name => prefix + name),
]);
const zipEntries = execFileSync('unzip', ['-Z1', zipFile], { encoding:'utf8' })
  .split(/\r?\n/).filter(Boolean);
const unapproved = zipEntries.filter(name => !allowed.has(name));
if (unapproved.length || zipEntries.length !== allowed.size ||
    new Set(zipEntries).size !== zipEntries.length) {
  throw new Error('ZIP incompleto o con rutas inesperadas: ' + unapproved.join(', '));
}

const sha256 = file => crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex');
const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'decreto-real-suno-g3-'));
try {
  execFileSync('unzip', ['-q', zipFile, '-d', temp]);
  const manifest = JSON.parse(fs.readFileSync(path.join(temp,'manifest.json'), 'utf8'));
  if (manifest.project !== 'Decreto Real' || !Array.isArray(manifest.files) ||
      manifest.files.length !== names.length) throw new Error('Manifiesto G3 inválido');
  const entries = new Map(manifest.files.map(item => [item.relative_path, item]));
  if (entries.size !== names.length) throw new Error('Manifiesto con archivos repetidos');
  for (const name of names) {
    const relative = prefix + name;
    const entry = entries.get(relative);
    const input = path.join(temp,relative);
    if (!entry || entry.codec !== 'mp3' || entry.bitrate_kbps !== 160 ||
        !Number.isFinite(entry.duration_sec) || entry.duration_sec <= 0 ||
        entry.bytes !== fs.statSync(input).size || sha256(input) !== entry.sha256)
      throw new Error('MP3 inválido o alterado: ' + name);
    const magic = fs.readFileSync(input).subarray(0,4);
    if (magic.toString('ascii',0,3) !== 'ID3' && magic[0] !== 0xff)
      throw new Error('Cabecera MP3 no válida: ' + name);
    if (fs.existsSync(relative)) {
      if (sha256(relative) !== sha256(input))
        throw new Error('Conflicto: el archivo existente es diferente: ' + name);
    }
  }

  const source = 'game/audioAssets.ts';
  const before = fs.readFileSync(source,'utf8');
  const marker = 'export const SUNO_G3_READY = false; // SUNO_G3_IMPORT_FLAG';
  const updated = 'export const SUNO_G3_READY = true; // SUNO_G3_IMPORT_FLAG';
  if (!before.includes(marker) && !before.includes(updated))
    throw new Error('No se encontró la bandera de activación musical oficial');
  for (const name of names) {
    const relative=prefix+name;
    if (!fs.existsSync(relative)) {
      fs.mkdirSync(path.dirname(relative),{recursive:true});
      fs.copyFileSync(path.join(temp,relative),relative);
    }
  }
  if (before.includes(marker))
    fs.writeFileSync(source,before.replace(marker,updated),'utf8');
  console.log('OK: seis pistas Suno G3 verificadas; catálogo musical activado.');
} finally {
  fs.rmSync(temp,{recursive:true,force:true});
}
