import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {
  NARRATIVE_SPRITES,isNarrativeSpriteId,narrativeSpriteOptions,
  resolveNarrativeCardSprite,resolveNarrativeSprite,narrativePortraitVisible,
} from './narrativeSprites.ts';
import {GUIDED_STEPS} from '../guidedOpeningDuel.ts';
import {normalizeStudioDocumentV3} from './schema.ts';
import {withNarrativeCard} from './ops.ts';

test('all narrative sprite references exist in the versioned art catalog',()=>{
  const catalog=JSON.parse(readFileSync(new URL('../../public/artes/catalogo.json',import.meta.url),'utf8')) as
    {items:{path:string}[]};
  const entries=new Set(catalog.items.map(item=>item.path));
  const ids=new Set<string>();
  for(const sprite of NARRATIVE_SPRITES){
    assert.ok(!ids.has(sprite.id),'duplicate sprite id: '+sprite.id);
    ids.add(sprite.id);
    assert.ok(entries.has('public/'+sprite.path),'missing catalog entry: '+sprite.path);
    assert.ok(!sprite.path.startsWith('/'));
    assert.ok(!sprite.path.includes('..'));
    assert.equal(isNarrativeSpriteId(sprite.id),true);
  }
  assert.equal(isNarrativeSpriteId('https://example.com/image.png'),false);
  assert.equal(isNarrativeSpriteId('../../secret'),false);
  assert.ok(narrativeSpriteOptions('Xervias').length>=4);
  assert.ok(narrativeSpriteOptions('Domingo Quispe').length>=4);
});

test('every guided intervention selects a sprite matching the speaking character',()=>{
  const published=JSON.parse(readFileSync(new URL('../../public/studio/composiciones.json',import.meta.url),'utf8'));
  for(const step of GUIDED_STEPS){
    const card=published.scenes['tutorial/'+step.id]?.narrative;
    const selected=resolveNarrativeCardSprite(card,step.speaker);
    if((card?.speaker??step.speaker)==='Sistema')assert.equal(selected,undefined);
    else assert.equal(selected?.speaker,card?.speaker??step.speaker);
  }
  assert.equal(resolveNarrativeSprite('Xervias','decidido')?.id,'xervias-objecion');
  assert.equal(resolveNarrativeSprite('Domingo Quispe','enojado')?.id,'domingo-furioso');
  assert.equal(resolveNarrativeSprite('Domingo Quispe','preocupado')?.id,'domingo-derrotado');
});

test('only registered, same-character overrides are accepted; unsafe ids are discarded',()=>{
  const doc=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g01':{narrative:{speaker:'Xervias',tone:'neutral',spriteId:'domingo-furioso'}},
    'tutorial/g02':{narrative:{speaker:'Xervias',tone:'neutral',spriteId:'https://attacker.invalid/img'}},
    'tutorial/g10':{narrative:{speaker:'Domingo Quispe',tone:'neutral',spriteId:'domingo-burlon'}},
  }});
  assert.equal(doc.scenes['tutorial/g02'].narrative?.spriteId,undefined);
  assert.equal(resolveNarrativeCardSprite(doc.scenes['tutorial/g01'].narrative,'Xervias')?.id,'xervias-tutorial');
  assert.equal(resolveNarrativeCardSprite(doc.scenes['tutorial/g10'].narrative,'Domingo Quispe')?.id,'domingo-burlon');
  assert.equal(resolveNarrativeCardSprite({speaker:'Sistema',tone:'enojado',spriteId:'domingo-furioso'},'Sistema'),undefined);
  const restored=normalizeStudioDocumentV3(JSON.parse(JSON.stringify(doc)));
  assert.deepEqual(restored,doc);
});

test('director audiovisual muestra retratos solo donde corresponde y permite overrides',()=>{
  const step={speaker:'Xervias'};
  assert.equal(narrativePortraitVisible(step),true);
  assert.equal(narrativePortraitVisible({...step,action:'attack1'}),false);
  assert.equal(narrativePortraitVisible({...step,action:'attack1'},{speaker:'Xervias',portraitMode:'show'}),true);
  assert.equal(narrativePortraitVisible(step,{speaker:'Xervias',portraitMode:'hide'}),false);
  assert.equal(narrativePortraitVisible({...step,action:'attack1'},{speaker:'Xervias',portraitMode:'auto'}),false);
  assert.equal(narrativePortraitVisible({speaker:'Sistema'},{speaker:'Sistema',portraitMode:'show'}),false);
  assert.equal(narrativePortraitVisible(step,{speaker:'Domingo Quispe',portraitMode:'show'}),true);
});

test('dirección artística inicial está publicada y solo usa ilustraciones aprobadas',()=>{
  const doc=normalizeStudioDocumentV3(JSON.parse(readFileSync(
    new URL('../../public/studio/composiciones.json',import.meta.url),'utf8')));
  const directed=['g00','g01','g02','g10','g11','g16','g22','g27','g28','g29'];
  for(const id of directed){
    const step=GUIDED_STEPS.find(s=>s.id===id)!;
    const card=doc.scenes['tutorial/'+id]?.narrative;
    assert.ok(card?.spriteId,'Falta ilustración elegida: '+id);
    assert.equal(resolveNarrativeCardSprite(card,step.speaker)?.id,card.spriteId);
  }
  for(const id of ['g10','g16','g22','g27']){
    const step=GUIDED_STEPS.find(s=>s.id===id)!;
    const card=doc.scenes['tutorial/'+id]?.narrative;
    assert.equal(step.action?.startsWith('rival'),true);
    assert.equal(card?.portraitMode,'show');
    assert.equal(narrativePortraitVisible(step,card),true);
  }
  assert.equal(doc.scenes['tutorial/g05'].narrative?.portraitMode,undefined);
  assert.equal(narrativePortraitVisible(GUIDED_STEPS[5],doc.scenes['tutorial/g05']?.narrative),false);
});

test('documentos importados ignoran modo de aparición desconocido y conservan selección válida',()=>{
  const doc=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g00':{narrative:{speaker:'Domingo Quispe',spriteId:'domingo-arrogante',portraitMode:'show'}},
    'tutorial/g05':{narrative:{speaker:'Xervias',portraitMode:'hide'}},
    'tutorial/g06':{narrative:{speaker:'Xervias',portraitMode:'always-and-run-code'}},
  }});
  assert.equal(doc.scenes['tutorial/g00'].narrative?.portraitMode,'show');
  assert.equal(doc.scenes['tutorial/g05'].narrative?.portraitMode,'hide');
  assert.equal(doc.scenes['tutorial/g06'].narrative?.portraitMode,undefined);
  assert.deepEqual(normalizeStudioDocumentV3(JSON.parse(JSON.stringify(doc))),doc);
});

test('animación por intervención se valida, guarda y no cambia las acciones',()=>{
  const initial=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g00':{narrative:{speaker:'Domingo Quispe',enterMotion:'slide-right',
      exitMotion:'zoom',motionDurationMs:520}},
    'tutorial/g01':{narrative:{speaker:'Xervias',enterMotion:'código arbitrario',
      exitMotion:'fade',motionDurationMs:999999}},
    'tutorial/g02':{narrative:{speaker:'Xervias',motionDurationMs:-900,enterMotion:'none'}},
  }});
  assert.equal(initial.scenes['tutorial/g00'].narrative?.enterMotion,'slide-right');
  assert.equal(initial.scenes['tutorial/g00'].narrative?.exitMotion,'zoom');
  assert.equal(initial.scenes['tutorial/g00'].narrative?.motionDurationMs,520);
  assert.equal(initial.scenes['tutorial/g01'].narrative?.enterMotion,undefined);
  assert.equal(initial.scenes['tutorial/g01'].narrative?.motionDurationMs,1200);
  assert.equal(initial.scenes['tutorial/g02'].narrative?.motionDurationMs,120);
  let draft=withNarrativeCard(initial,'tutorial/g00',{enterMotion:'slide-left',
    exitMotion:'fade',motionDurationMs:260});
  assert.equal(draft.scenes['tutorial/g00'].narrative?.enterMotion,'slide-left');
  assert.equal(initial.scenes['tutorial/g00'].narrative?.enterMotion,'slide-right');
  draft=withNarrativeCard(draft,'tutorial/g00',{enterMotion:null,exitMotion:null,motionDurationMs:null});
  assert.equal(draft.scenes['tutorial/g00'].narrative?.enterMotion,undefined);
  assert.equal(draft.scenes['tutorial/g00'].narrative?.motionDurationMs,undefined);
  assert.equal(draft.scenes['tutorial/g00'].narrative?.speaker,'Domingo Quispe');
  assert.deepEqual(normalizeStudioDocumentV3(JSON.parse(JSON.stringify(initial))),initial);
});
test('primera dirección de diez momentos usa transiciones permitidas',()=>{
  const published=normalizeStudioDocumentV3(JSON.parse(readFileSync(
    new URL('../../public/studio/composiciones.json',import.meta.url),'utf8')));
  const chosen=['g00','g01','g02','g10','g11','g16','g22','g27','g28','g29'];
  const allowed=new Set(['none','fade','slide-left','slide-right','zoom']);
  for(const id of chosen){
    const scene=published.scenes['tutorial/'+id];
    assert.ok(allowed.has(scene.narrative?.enterMotion??''));
    assert.ok(allowed.has(scene.narrative?.exitMotion??''));
    assert.ok((scene.narrative?.motionDurationMs??0)>=120);
    assert.ok(scene.narrative?.spriteId);
    assert.ok(published.scenes['tutorial/'+id+'-movil'].layers);
  }
  assert.equal(published.scenes['tutorial/g05'].narrative?.enterMotion,undefined);
  assert.equal(GUIDED_STEPS.length,32);
});
