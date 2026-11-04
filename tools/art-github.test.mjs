import test from 'node:test';
import assert from 'node:assert/strict';
import {catalogo,seleccion,ejecutar} from './art-github.mjs';

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
