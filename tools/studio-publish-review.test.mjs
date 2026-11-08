import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildStudioPackage } from '../campaign/studio/package.ts';
import { inspectStudioPublication } from './studio-publish-review.mjs';

const pack = (scenes) => buildStudioPackage({version:3, scenes}, []);
const scene = (text) => ({dialogue:{text}});

test('revisión previa detecta escenas agregadas y cambiadas sin advertir borrados', () => {
  const old = {version:3,scenes:{'prologo/a':scene('Antes')}};
  const result = inspectStudioPublication(pack({
    'prologo/a':scene('Después'),'prologo/b':scene('Nuevo'),
  }), old);
  assert.equal(result.valid,true);
  assert.deepEqual(result.scenes.added,['prologo/b']);
  assert.deepEqual(result.scenes.changed,['prologo/a']);
  assert.deepEqual(result.scenes.removed,[]);
  assert.equal(result.requiresRemovalConfirmation,false);
});

test('revisión previa advierte cuando una escena publicada desaparece', () => {
  const old = {version:3,scenes:{'prologo/a':scene('Antes'),'prologo/b':scene('Se pierde')}};
  const result = inspectStudioPublication(pack({'prologo/a':scene('Antes')}), old);
  assert.deepEqual(result.scenes.removed,['prologo/b']);
  assert.equal(result.requiresRemovalConfirmation,true);
});

test('rechaza contenido que no sea el paquete ZIP válido de DRStudio', () => {
  assert.throws(() => inspectStudioPublication(new TextEncoder().encode('contenido inválido')), /respaldo/i);
});
