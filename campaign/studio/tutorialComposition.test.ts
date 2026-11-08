import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {defaultLayerTransform, emptyStudioDocumentV3, normalizeStudioDocumentV3, type StudioLayer} from './schema.ts';
import {getLayer,inheritPublishedTutorialLayouts,tutorialLayoutKey,withDialogue,withLayer} from './ops.ts';
import {proposeTutorialComposition,tutorialCompositionMood,withMissingTutorialCompositions,
  withProposedTutorialComposition} from './tutorialComposition.ts';

const profiles=['movil','horizontal','escritorio'] as const;
const find=(id:string)=>GUIDED_STEPS.find(s=>s.id===id)!;
const native=(id:string,x:number):StudioLayer=>({id,kind:'native',...defaultLayerTransform('native'),x});

test('director narrativo propone 32 pasos distintos con campos visuales válidos',()=>{
  const plan=GUIDED_STEPS.map(step=>proposeTutorialComposition(step,'movil',{speaker:step.speaker}));
  assert.equal(plan.length,32);
  assert.equal(tutorialCompositionMood(find('g00')),'dialogo');
  assert.equal(tutorialCompositionMood(find('g03')),'moneda');
  assert.equal(tutorialCompositionMood(find('g08')),'combo');
  assert.equal(tutorialCompositionMood(find('g10')),'replica');
  assert.equal(tutorialCompositionMood(find('g31')),'desenlace');
  assert.ok(plan[0].some(l=>l.id==='native-tablero-tutorial-rival'));
  assert.ok(plan[1].some(l=>l.id==='native-tablero-tutorial-jugador'));
  assert.ok(!plan[5].some(l=>l.id.includes('tutorial-jugador')));
  assert.ok(plan[3].some(l=>l.id==='native-tablero-moneda'));
  assert.ok(plan[8].some(l=>l.id==='native-tablero-combo-menu'));
  assert.ok(!plan[31].some(l=>l.id.includes('tutorial-jugador')));
  for(const layers of plan){
    assert.ok(layers.some(l=>l.id==='native-tablero-tutorial-dialogo'));
    for(const layer of layers)assert.equal(layer.kind,'native');
  }
});

test('las fichas narrativas dirigen el retrato sin modificar el texto ni las reglas',()=>{
  const step=find('g01');
  const normal=proposeTutorialComposition(step,'movil',{speaker:'Xervias',tone:'sereno'});
  const dramatic=proposeTutorialComposition(step,'movil',{speaker:'Domingo Quispe',tone:'enojado'});
  assert.ok(normal.some(l=>l.id==='native-tablero-tutorial-jugador'));
  assert.ok(dramatic.some(l=>l.id==='native-tablero-tutorial-rival'));
  assert.equal(step.action,undefined);
  assert.equal(step.speaker,'Xervias');
  assert.equal(step.text,GUIDED_STEPS[1].text);
});

test('completar pasos es no destructivo y rehacer solo afecta un paso',()=>{
  const blank=emptyStudioDocumentV3();
  const step=find('g08');
  const key=tutorialLayoutKey(step.id,'movil');
  const custom=native('native-tablero-tutorial-dialogo',24);
  let doc=withDialogue(blank,'tutorial/g08',{text:'Mi propio diálogo'});
  doc=withLayer(doc,key,custom);
  const complete=withMissingTutorialCompositions(doc,'movil');
  assert.equal(getLayer(complete,key,custom.id)?.x,24);
  assert.equal(complete.scenes['tutorial/g08'].dialogue?.text,'Mi propio diálogo');
  assert.ok(getLayer(complete,key,'native-tablero-combo-menu'));
  assert.ok(getLayer(complete,tutorialLayoutKey('g09','movil'),custom.id));
  assert.strictEqual(withMissingTutorialCompositions(complete,'movil'),complete);
  const replaced=withProposedTutorialComposition(complete,step,'movil',true);
  assert.notEqual(getLayer(replaced,key,custom.id)?.x,24);
  assert.deepEqual(replaced.scenes['tutorial/g08'],complete.scenes['tutorial/g08']);
  assert.deepEqual(replaced.scenes[tutorialLayoutKey('g09','movil')],
    complete.scenes[tutorialLayoutKey('g09','movil')]);
});

test('borrador móvil preexistente tiene prioridad sobre propuesta publicada',()=>{
  let local=withLayer(emptyStudioDocumentV3(),'tablero/movil',
    native('native-tablero-tutorial-dialogo',-15));
  const localKey=tutorialLayoutKey('g08','movil');
  local=withLayer(local,localKey,native('native-tablero-combo-menu',17));
  let published=withMissingTutorialCompositions(emptyStudioDocumentV3(),'movil');
  published=withMissingTutorialCompositions(published,'horizontal');
  const merged=inheritPublishedTutorialLayouts(local,published);
  assert.equal(getLayer(merged,'tablero/movil','native-tablero-tutorial-dialogo')?.x,-15);
  assert.equal(getLayer(merged,localKey,'native-tablero-tutorial-dialogo'),undefined);
  assert.equal(getLayer(merged,localKey,'native-tablero-combo-menu')?.x,17);
  assert.equal(getLayer(merged,tutorialLayoutKey('g08','horizontal'),'native-tablero-tutorial-dialogo')?.x,0);
  assert.ok(getLayer(merged,tutorialLayoutKey('g03','movil'),'native-tablero-moneda'));
  assert.strictEqual(inheritPublishedTutorialLayouts(merged,published),merged);
  assert.equal(local.scenes[localKey].layers?.length,1);
});

test('las 96 propuestas publicadas coinciden con el plan y preservan las 32 fichas',()=>{
  const raw=readFileSync(new URL('../../public/studio/composiciones.json',import.meta.url),'utf8');
  const published=normalizeStudioDocumentV3(JSON.parse(raw));
  assert.equal(GUIDED_STEPS.length,32);
  for(const step of GUIDED_STEPS)for(const profile of profiles){
    const key=tutorialLayoutKey(step.id,profile);
    const expected=proposeTutorialComposition(step,profile,published.scenes['tutorial/'+step.id]?.narrative);
    const actual=published.scenes[key]?.layers??[];
    assert.deepEqual(actual,[...expected].sort((a,b)=>a.z-b.z||a.id.localeCompare(b.id)),key);
    assert.ok(published.scenes['tutorial/'+step.id]?.narrative);
  }
});
