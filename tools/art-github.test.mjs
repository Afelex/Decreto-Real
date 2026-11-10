import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {join} from 'node:path';
import {catalogo,seleccion,ejecutar,construirSolicitud} from './art-github.mjs';

test('existen 18 fondos y 29 retratos canónicos, total 47',()=>{
  const items=catalogo();
  assert.equal(items.length,47);
  assert.equal(items.filter(i=>i.kind==='fondo').length,18);
  assert.equal(items.filter(i=>i.kind==='retrato').length,29);
  assert.equal(new Set(items.map(i=>i.id)).size,47);
  assert.equal(new Set(items.map(i=>i.filename)).size,47);
});
test('excluye ocho generales y Sigumán final, incluye Vándalo, Gaspar y Sigumán humano',()=>{
  const items=catalogo();
  for(const id of ['06','10','14','18','22','26','30','34','38']) assert.ok(!items.some(i=>i.id==='rival-'+id));
  for(const id of ['35','36','37','01','02']) assert.ok(items.some(i=>i.id==='rival-'+id));
  assert.ok(items.some(i=>i.title.startsWith('Vándalo Rojo')));
  assert.ok(items.some(i=>i.title.startsWith('Gaspar de Armenta')));
  assert.ok(items.some(i=>i.title.startsWith('Sigumán')));
});
test('cada región produce dos fondos y tres rivales; prólogo tiene dos',()=>{
  for(const id of ['1','2','3','4','5','6','7','8','f']){
    const group=seleccion(id==='f'?'final':'region-'+id);
    assert.equal(group.length,5);
    assert.equal(group.filter(i=>i.kind==='fondo').length,2);
    assert.equal(group.filter(i=>i.kind==='retrato').length,3);
  }
  assert.equal(seleccion('prologo').length,2);
  assert.equal(seleccion('piloto-4').length,4);
  assert.equal(seleccion('una-imagen').length,1);
});
test('nunca inicia generación sin confirmación SI o clave',async()=>{
  await assert.rejects(ejecutar({modo:'generar',confirmar:'NO',apiKey:'nada'}),/escribe SI/);
  await assert.rejects(ejecutar({modo:'generar',confirmar:'SI',apiKey:''}),/Falta el secreto/);
});

test('Callao obliga a banderas lisas rojas o blancas sin símbolos',()=>{
  const fondo=catalogo().find(item=>item.id==='fondo-1-base');
  assert.ok(fondo.prompt.includes('CALLAO FLAG RULE'));
  assert.ok(fondo.prompt.includes('plain solid white'));
  assert.ok(fondo.prompt.includes('plain solid red'));
  assert.ok(!fondo.prompt.includes('Cross of Burgundy'));
  assert.ok(fondo.prompt.includes('NO diagonal marks'));
  assert.ok(fondo.prompt.includes('NO X marks'));
  assert.ok(fondo.prompt.includes('NO photorealism') || fondo.prompt.includes('NOT a photograph'));
});
test('todas las imágenes enfatizan trazos 2D y evitan el render realista',()=>{
  for(const item of catalogo()){
    assert.match(item.prompt,/2D|anime/i);
    assert.match(item.prompt,/ink contour|ink-lined|line-art|cel.shad/i);
    assert.match(item.prompt,/NOT a photograph|NOT 3D|NO photorealism/i);
  }
});
test('jefe se edita a partir del fondo base en lugar de generar escenario distinto',()=>{
  const fondo=catalogo().find(item=>item.id==='fondo-1-base');
  const jefe=catalogo().find(item=>item.id==='fondo-1-jefe');
  const start=construirSolicitud(fondo,'low');
  assert.ok(start.url.endsWith('/images/generations'));
  assert.equal(start.payload.quality,'low');
  assert.throws(()=>construirSolicitud(jefe,'low'),/Falta el fondo base/);
  const base=Buffer.from('webp-test-data');
  const edit=construirSolicitud(jefe,'low',base);
  assert.ok(edit.url.endsWith('/images/edits'));
  assert.equal(edit.payload.images[0].image_url,'data:image/webp;base64,'+base.toString('base64'));
  assert.match(edit.payload.prompt,/provided input|PROVIDED BASE IMAGE/i);
  assert.match(edit.payload.prompt,/CALLAO FLAG RULE/);
});

test('Callao: un clic prepara solo el jefe y otro los tres rivales reales',()=>{
 const base=seleccion('jefe-callao-aprobado');
 assert.deepEqual(base.map(i=>i.id),['fondo-1-jefe']);
 const rivals=seleccion('rivales-callao');
 assert.deepEqual(rivals.map(i=>i.id),['rival-03','rival-04','rival-05']);
});
test('el modo plan del jefe aprobado no llama a la API y no necesita credenciales',async()=>{
 const r=await ejecutar({grupo:'jefe-callao-aprobado',modo:'plan',calidad:'low',confirmar:'NO',apiKey:''});
 assert.equal(r.items.length,1);
 assert.equal(r.results.length,0);
});
test('frena la edición del jefe si no está presente la base aprobada',async()=>{
 await assert.rejects(
  ejecutar({grupo:'jefe-callao-aprobado',modo:'generar',calidad:'low',confirmar:'SI',apiKey:'prueba-invalida'}),
  /No se encontró el fondo aprobado/
 );
});

test('jefes deben cambiar de escenario, no solo recolorear el fondo base',()=>{
  const items=catalogo();
  for (const region of ['1','2','3','4','5','6','7','8','f']){
    const boss=items.find(i=>i.id==='fondo-'+region+'-jefe');
    assert.ok(boss?.promptEdicion,region);
    assert.match(boss.promptEdicion,/CLEARLY DIFFERENT BOSS BATTLE ARENA/);
    assert.match(boss.promptEdicion,/Recompose at least 40 percent/);
    assert.match(boss.promptEdicion,/NEW VIEWPOINT|New viewpoint|New camera|new nearby viewpoint/i);
    assert.match(boss.promptEdicion,/NO|DO NOT/);
  }
  const callao=items.find(i=>i.id==='fondo-1-jefe');
  assert.match(callao.promptEdicion,/CALLAO ADMIRAL BOSS ARENA/);
  assert.match(callao.promptEdicion,/coastal cannons|coastal cannons|coastal|naval command/i);
  assert.match(callao.promptEdicion,/plain white or plain red/i);
});

test('se conserva la imagen original de Xervias como referencia de estilo',()=>{
  const ref=readFileSync(join(import.meta.dirname,'..','art-reference','xervias-estilo.webp'));
  assert.ok(ref.length>100);
  assert.equal(ref.subarray(0,4).toString(),'RIFF');
  const portrait=catalogo().find(i=>i.id==='rival-03');
  assert.equal(portrait.styleReference,'art-reference/xervias-estilo.webp');
  assert.match(portrait.prompt,/Xervias/i);
  assert.match(portrait.prompt,/DO NOT|NEVER|Do not/);
  assert.match(portrait.prompt,/checkerboard/i);
  assert.match(portrait.prompt,/plain white or plain red/i);
});
test('retrato nuevo usa referencia visual sin copiar a Xervias',()=>{
  const rival=catalogo().find(i=>i.id==='rival-03');
  assert.throws(()=>construirSolicitud(rival,'low'),/Falta la referencia visual/);
  const ref=Buffer.from('RIFF-style-reference');
  const req=construirSolicitud(rival,'low',null,ref);
  assert.ok(req.url.endsWith('/images/edits'));
  assert.equal(req.payload.images.length,1);
  assert.equal(req.payload.images[0].image_url,'data:image/webp;base64,'+ref.toString('base64'));
  assert.match(req.payload.prompt,/DISTINCT NEW rival/i);
});
test('restilización de rivales conserva el retrato original y aplica estilo Xervias',()=>{
  const rival=catalogo().find(i=>i.id==='rival-03');
  const ref=Buffer.from('RIFF-Xervias-style');
  const original=Buffer.from('RIFF-Elias-existing');
  const req=construirSolicitud(rival,'low',null,ref,original);
  assert.ok(req.url.endsWith('/images/edits'));
  assert.equal(req.payload.images.length,2);
  assert.equal(req.payload.images[0].image_url,'data:image/webp;base64,'+original.toString('base64'));
  assert.equal(req.payload.images[1].image_url,'data:image/webp;base64,'+ref.toString('base64'));
  assert.match(req.payload.prompt,/FIRST image.*ALREADY DESIGNED RIVAL/);
  assert.match(req.payload.prompt,/SECOND image.*XERVIAS PORTRAIT/);
  assert.match(req.payload.prompt,/DO NOT copy Xervias/);
});
test('piloto de un rival y lote de tres rivales se seleccionan sin duplicar',()=>{
  assert.deepEqual(seleccion('rival-callao-estilo-prueba').map(i=>i.id),['rival-03']);
  assert.deepEqual(seleccion('rivales-callao-estilo').map(i=>i.id),['rival-03','rival-04','rival-05']);
});
test('sin referencias originales se cancela antes de gastar API para el piloto',async()=>{
  await assert.rejects(
    ejecutar({grupo:'rival-callao-estilo-prueba',modo:'generar',calidad:'low',confirmar:'SI',apiKey:'solo-prueba'}),
    /No se encontró el retrato original/
  );
});

test('los 18 fondos respetan la composición del duelo real: HUD, dos filas y manos',()=>{
  const fondos=catalogo().filter(i=>i.kind==='fondo');
  assert.equal(fondos.length,18);
  for(const fondo of fondos){
    const content=fondo.id.endsWith('-jefe')?fondo.promptEdicion:fondo.prompt;
    assert.match(content,/DUEL SCREEN COMPATIBILITY/);
    assert.match(content,/TOP 0–35%/);
    assert.match(content,/35–63%/);
    assert.match(content,/BOTTOM 63–100%/);
    assert.match(content,/1024x1536/);
    assert.match(content,/Do NOT render any UI/);
  }
});

test('todos los lotes se etiquetan DR-G2-2026 sin sobreescribir la G1',()=>{
  for(const item of catalogo()){
    assert.equal(item.generation,'DR-G2-2026');
    assert.ok(item.publishPath.startsWith('public/artes/generaciones/DR-G2-2026/'));
    assert.ok(item.publishPath.endsWith(item.filename));
    for(const prompt of [item.prompt,item.promptEdicion,item.promptRestilizar].filter(Boolean))
      assert.ok(!/Cross of Burgundy|aspa de Borgoña/i.test(prompt));
  }
});
