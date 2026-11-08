import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {normalizeStudioDocumentV3} from './schema.ts';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {analyzeGuidedReading,analyzeGuidedSequence,estimatedMobileLines} from './tutorialReading.ts';

test('auditoría recorre exactamente las 32 intervenciones en orden',()=>{
  const summary=analyzeGuidedSequence(GUIDED_STEPS);
  assert.equal(summary.reports.length,32);
  assert.equal(summary.reports[0].stepId,'g00');
  assert.equal(summary.reports[31].stepId,'g31');
  assert.ok(summary.affected>0,'La explicación extensa original debe ser revisable');
  assert.ok(summary.affected<32,'No todos los pasos deben ser avisos');
  assert.equal(summary.affected,summary.reports.filter(r=>r.issues.length>0).length);
  assert.ok(summary.reports.every(r=>r.estimatedSeconds>=2));
});

test('detecta texto vacío sin modificar acciones y aclara instrucciones ambiguas',()=>{
  const action=GUIDED_STEPS.find(s=>s.id==='g05')!;
  assert.equal(action.action,'attack1');
  const missing=analyzeGuidedReading(action,' ');
  assert.equal(missing.issues[0].code,'empty');
  assert.equal(missing.issues[0].level,'high');
  const vague=analyzeGuidedReading(action,'Ahora.');
  assert.ok(vague.issues.some(i=>i.code==='action-unclear'));
  const clear=analyzeGuidedReading(action,'Arrastra la carta de Ataque al campo.');
  assert.equal(clear.issues.length,0);
  assert.equal(action.text,'El Ataque quita 2 puntos de vida al adversario. Usa la primera carta.');
});

test('los saltos de línea y textos extensos elevan el aviso de lectura',()=>{
  const step=GUIDED_STEPS[5];
  const huge='Explica un Ataque. '.repeat(24);
  const report=analyzeGuidedReading(step,huge);
  assert.ok(report.issues.some(i=>i.code==='very-long'));
  assert.ok(report.issues.some(i=>i.code==='dense'));
  const withLines='Primera línea.\nSegunda línea.';
  assert.equal(estimatedMobileLines(withLines),2);
  assert.ok(estimatedMobileLines('Uno '.repeat(70))>4);
});

test('la revisión usa el borrador editado de cada intervención, no un guion cacheado',()=>{
  const original=analyzeGuidedSequence(GUIDED_STEPS);
  const local=analyzeGuidedSequence(GUIDED_STEPS,step=>
    step.id==='g05'?'':step.text);
  assert.equal(local.reports[5].stepId,'g05');
  assert.ok(local.reports[5].issues.some(i=>i.code==='empty'));
  assert.equal(original.reports[5].issues.some(i=>i.code==='empty'),false);
  assert.deepEqual(GUIDED_STEPS[5].text,'El Ataque quita 2 puntos de vida al adversario. Usa la primera carta.');
});

test('primer borrador editorial mejora ocho intervenciones sin tocar las 32 fichas',()=>{
  const raw=readFileSync(new URL('../../public/studio/composiciones.json',import.meta.url),'utf8');
  const doc=normalizeStudioDocumentV3(JSON.parse(raw));
  const revised=['g02','g04','g08','g14','g17','g19','g23','g29'];
  for(const id of revised){
    const scene=doc.scenes['tutorial/'+id];
    assert.ok(scene?.narrative,'Se debe conservar la ficha narrativa de '+id);
    assert.ok(scene?.dialogue?.text,'Falta el texto de '+id);
    assert.ok(scene.dialogue.text.length<GUIDED_STEPS.find(s=>s.id===id)!.text.length);
  }
  const first=analyzeGuidedSequence(GUIDED_STEPS);
  const final=analyzeGuidedSequence(GUIDED_STEPS,step=>
    doc.scenes['tutorial/'+step.id]?.dialogue?.text??step.text);
  assert.ok(final.affected<=first.affected);
  assert.ok(final.high<=first.high);
  assert.equal(doc.scenes['tutorial/g13'].dialogue?.text,undefined);
  assert.equal(doc.scenes['tutorial/g02'].narrative?.speaker,'Xervias');
  assert.equal(GUIDED_STEPS.length,32);
});
