import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync, readFileSync, existsSync, rmSync} from 'node:fs';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {inventarioGlobal, origenPara, prepararPaquete} from './art-bundle.mjs';

test('el catálogo global conserva cinco aprobadas y produce 42 nuevas, sin repetir',()=>{
  const {all,pending,done}=inventarioGlobal();
  assert.equal(all.length,47);
  assert.equal(pending.length,42);
  assert.equal(done.length,5);
  assert.equal(new Set(pending.map(i=>i.id)).size,42);
  for(const id of ['fondo-1-base','fondo-1-jefe','rival-03','rival-04','rival-05']){
    assert.ok(done.some(i=>i.id===id));
    assert.ok(!pending.some(i=>i.id===id));
  }
});

test('el único botón produce nueve grupos: prólogo, siete regiones y final',()=>{
  const {pending}=inventarioGlobal();
  const groups=Object.groupBy(pending,p=>p.grupo);
  assert.deepEqual(Object.keys(groups).sort(),['final','prologo','region-2','region-3','region-4','region-5','region-6','region-7','region-8']);
  assert.equal(groups.prologo.length,2);
  for(const [group,images] of Object.entries(groups)) if(group!=='prologo') assert.equal(images.length,5);
});

test('los originales del Callao se recuperan sin llamar a OpenAI',()=>{
  const {done,pending}=inventarioGlobal();
  for(const image of done) assert.match(origenPara(image),/aprobados/);
  for(const image of pending) assert.match(origenPara(image),/lotes\/arte-42-/);
});

test('modo plan gratuito genera una galería y manifiesto de las 47 imágenes sin producir ninguna',()=>{
  const target=mkdtempSync(join(tmpdir(),'decreto-real-arte-plan-'));
  try {
    const out=prepararPaquete({modo:'plan',salida:target});
    assert.equal(out.pending.length,42);
    assert.equal(out.done.length,5);
    assert.ok(existsSync(join(target,'galeria.html')));
    const manifest=JSON.parse(readFileSync(join(target,'manifest.json'),'utf8'));
    assert.equal(manifest.modo,'plan');
    assert.equal(manifest.esperadas,47);
    assert.equal(manifest.completadas,0);
    assert.equal(manifest.items.length,47);
  } finally {
    rmSync(target,{recursive:true,force:true});
  }
});
