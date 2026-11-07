import test from 'node:test';
import assert from 'node:assert/strict';
import { defaultLayerTransform, emptyStudioDocumentV3, type StudioLayer } from './schema.ts';
import { getLayer, withLayer, withLayerPatch } from './ops.ts';
import {
  STUDIO_HISTORY_LIMIT, canRedo, canUndo, createStudioHistory, isStudioDirty, studioHistoryReducer as reduce,
} from './history.ts';

const KEY='prologo/arresto-01';
const madre:StudioLayer={id:'actor-madre',kind:'actor',actor:'Madre',...defaultLayerTransform('actor','Madre')};
const x=(s:ReturnType<typeof createStudioHistory>)=>getLayer(s.doc,KEY,'actor-madre')?.x;

test('apply creates one undo entry; undo and redo walk the history',()=>{
  let s=createStudioHistory(emptyStudioDocumentV3());
  assert.equal(isStudioDirty(s),false);
  s=reduce(s,{type:'apply',update:d=>withLayer(d,KEY,{...madre,x:5})});
  s=reduce(s,{type:'apply',update:d=>withLayerPatch(d,KEY,'actor-madre',{x:9})});
  assert.equal(x(s),9);
  assert.equal(isStudioDirty(s),true);
  s=reduce(s,{type:'undo'});
  assert.equal(x(s),5);
  assert.equal(canRedo(s),true);
  s=reduce(s,{type:'redo'});
  assert.equal(x(s),9);
  s=reduce(s,{type:'undo'});s=reduce(s,{type:'undo'});
  assert.equal(x(s),undefined);
  assert.equal(isStudioDirty(s),false,'undoing back to the saved document is clean again');
  assert.equal(canUndo(s),false);
});

test('a drag transaction yields a single undo entry, and a plain tap yields none',()=>{
  let s=createStudioHistory(withLayer(emptyStudioDocumentV3(),KEY,madre));
  // Tocar para seleccionar: begin + commit sin cambios.
  s=reduce(s,{type:'begin'});
  s=reduce(s,{type:'commit'});
  assert.equal(s.past.length,0);
  // Arrastre con muchos movimientos.
  s=reduce(s,{type:'begin'});
  for(let i=1;i<=30;i++)s=reduce(s,{type:'preview',update:d=>withLayerPatch(d,KEY,'actor-madre',{x:i})});
  assert.equal(canUndo(s),true,'undo is available while the gesture is open');
  s=reduce(s,{type:'commit'});
  assert.equal(x(s),30);
  assert.equal(s.past.length,1);
  s=reduce(s,{type:'undo'});
  assert.equal(x(s),0);
});

test('an open transaction is settled before the next action and can be cancelled',()=>{
  let s=createStudioHistory(withLayer(emptyStudioDocumentV3(),KEY,madre));
  s=reduce(s,{type:'begin'});
  s=reduce(s,{type:'preview',update:d=>withLayerPatch(d,KEY,'actor-madre',{x:4})});
  s=reduce(s,{type:'undo'});
  assert.equal(x(s),0,'undo first closes the gesture, then reverts it');
  s=reduce(s,{type:'begin'});
  s=reduce(s,{type:'preview',update:d=>withLayerPatch(d,KEY,'actor-madre',{x:7})});
  s=reduce(s,{type:'cancel'});
  assert.equal(x(s),0);
  assert.equal(s.pending,null);
});

test('saving marks the current document; new edits clear the redo stack',()=>{
  let s=createStudioHistory(emptyStudioDocumentV3());
  s=reduce(s,{type:'apply',update:d=>withLayer(d,KEY,madre)});
  s=reduce(s,{type:'saved'});
  assert.equal(isStudioDirty(s),false);
  s=reduce(s,{type:'apply',update:d=>withLayerPatch(d,KEY,'actor-madre',{y:3})});
  s=reduce(s,{type:'undo'});
  assert.equal(isStudioDirty(s),false);
  s=reduce(s,{type:'apply',update:d=>withLayerPatch(d,KEY,'actor-madre',{y:8})});
  assert.equal(canRedo(s),false);
});

test('failing operations never throw from the reducer and keep the document',()=>{
  const start=createStudioHistory(emptyStudioDocumentV3());
  const s=reduce(start,{type:'apply',update:d=>withLayerPatch(d,KEY,'no-existe',{x:1})});
  assert.equal(s.doc,start.doc);
  assert.match(s.error??'',/no existe/);
  const cleared=reduce(s,{type:'apply',update:d=>withLayer(d,KEY,madre)});
  assert.equal(cleared.error,null);
});

test('replace (import) is undoable and history is bounded',()=>{
  let s=createStudioHistory(emptyStudioDocumentV3());
  const imported=withLayer(emptyStudioDocumentV3(),KEY,{...madre,x:-40});
  s=reduce(s,{type:'replace',doc:imported});
  assert.equal(x(s),-40);
  s=reduce(s,{type:'undo'});
  assert.equal(x(s),undefined);
  for(let i=0;i<STUDIO_HISTORY_LIMIT+20;i++)
    s=reduce(s,{type:'apply',update:d=>withLayer(d,KEY,{...madre,x:i%90})});
  assert.equal(s.past.length,STUDIO_HISTORY_LIMIT);
});
