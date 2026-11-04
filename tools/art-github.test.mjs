import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogo,seleccion,ejecutar,construirSolicitud} from './art-github.mjs';

test('existen 18 fondos y 29 retratos canónicos, total 47',()=>{
  const items=catalogo();
  assert.equal(items.length,47);
  assert.equal(items.filter(i=>i.kind==='fondo').length,18);
  assert.equal(items.filter(i=>i.kind==='retrato').length,29);
  assert.equal(new Set(items.map(i=>i.id)).size,47);
  assert.equal(new Set(items.map(i=>i.filename)).size,47);
});
test('excluye ocho generales y Sigumán, pero incluye los tres rivales previos finales',()=>{
  const items=catalogo();
  for(const id of ['06','10','14','18','22','26','30','34','38']) assert.ok(!items.some(i=>i.id==='rival-'+id));
  for(const id of ['35','36','37','01','02']) assert.ok(items.some(i=>i.id==='rival-'+id));
  assert.ok(items.some(i=>i.title.startsWith('Leocadio del Alba')));
  assert.ok(items.some(i=>i.title.startsWith('Vándalo Rojo')));
  assert.ok(items.some(i=>i.title.startsWith('Bruno Serrat')));
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

test('callao obliga a banderas blancas con aspa roja sin escudo ni tricolor',()=>{
  const fondo=catalogo().find(item=>item.id==='fondo-1-base');
  assert.ok(fondo.prompt.includes('MANDATORY CALLAO FLAG'));
  assert.ok(fondo.prompt.includes('Cross of Burgundy'));
  assert.ok(fondo.prompt.includes('red-X') || fondo.prompt.includes('red X') || fondo.prompt.includes('JAGGED RED'));
  assert.ok(fondo.prompt.includes('NO coat of arms') || fondo.prompt.includes('NO coat of arms of Spain'));
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
  assert.match(edit.payload.prompt,/CALLAO FLAG/);
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
