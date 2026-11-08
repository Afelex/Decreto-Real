import test from 'node:test';
import assert from 'node:assert/strict';
import {analyzeNarrativeLayout,intersectionArea,layoutCost,moveRect,occludedFraction,
  suggestClearance,type SafetyRect,type SafetyZone} from './tutorialOverlap.ts';

const bounds:SafetyRect={left:0,top:0,right:390,bottom:844};
const hand:SafetyZone={id:'hand',name:'Mano de cartas',
  rect:{left:20,top:650,right:370,bottom:790},weight:6,threshold:.1};
const finish:SafetyZone={id:'finish',name:'Fin de turno',
  rect:{left:306,top:780,right:385,bottom:842},weight:8,threshold:.06};

test('detecta la fracción tapada de una zona funcional',()=>{
  const dialog:SafetyRect={left:20,top:650,right:195,bottom:790};
  assert.equal(intersectionArea(dialog,hand.rect),175*140);
  assert.equal(occludedFraction(dialog,hand.rect),.5);
  assert.equal(occludedFraction(hand.rect,dialog),1);
  assert.equal(occludedFraction(dialog,{left:0,top:0,right:0,bottom:0}),0);
  const findings=analyzeNarrativeLayout([{id:'dialog',name:'Diálogo',rect:dialog}],[
    hand,{id:'sky',name:'Fondo',rect:{left:0,top:0,right:390,bottom:200}},
  ]);
  assert.equal(findings.length,1);
  assert.equal(findings[0].subjectId,'dialog');
  assert.equal(findings[0].fraction,.5);
});

test('propone despejar diálogos que tapan cartas y respeta los bordes',()=>{
  const dialog:SafetyRect={left:22,top:645,right:350,bottom:780};
  const zones=[hand,finish];
  const move=suggestClearance(dialog,zones,bounds);
  assert.ok(move);
  assert.ok(move.after<move.before);
  const after=moveRect(dialog,move.dx,move.dy);
  assert.ok(layoutCost(after,zones,bounds)<layoutCost(dialog,zones,bounds));
  assert.ok(move.dx!==0||move.dy!==0);
  assert.equal(suggestClearance({left:18,top:230,right:330,bottom:345},zones,bounds),null);
});

test('no propone movimientos para geometrías inválidas o sin mejorar',()=>{
  const zero:SafetyRect={left:0,top:0,right:0,bottom:0};
  assert.equal(suggestClearance(zero,[hand],bounds),null);
  assert.equal(suggestClearance(bounds,[hand],zero),null);
  const empty:SafetyZone={id:'empty',name:'Ausente',rect:zero};
  assert.equal(analyzeNarrativeLayout([{id:'dialog',name:'Diálogo',rect:bounds}],[empty]).length,0);
});
