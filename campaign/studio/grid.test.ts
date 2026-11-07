import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_EDITOR_PREFS, STUDIO_EDITOR_PREFS_KEY, STUDIO_GRID_COLUMNS, alignBoxes, alignReferenceBox,
  boxGuideLines, gridLines, gridStep, mergeTargets, normalizeEditorPrefs, nudgeDelta, readEditorPrefs,
  saveEditorPrefs, snapDrag, snapMove, snapRotation, snapScale, snapThreshold, snapValue, stageGuideLines,
  type StageBox,
} from './grid.ts';

const VIEWPORTS=[
  {name:'mobile-390',width:390,height:844},
  {name:'mobile-320',width:320,height:568},
  // En horizontal y en escritorio el escenario mide 540 px de ancho (no el viewport).
  {name:'landscape',width:540,height:390},
  {name:'desktop-1280',width:540,height:800},
];
const close=(a:number,b:number,eps=1e-6)=>assert.ok(Math.abs(a-b)<=eps,a+' ≈ '+b);

test('grid cells are square in pixels for every density and stage size',()=>{
  for(const vp of VIEWPORTS)for(const columns of STUDIO_GRID_COLUMNS){
    const step=gridStep(vp,columns);
    close(step.x*vp.width/100,step.y*vp.height/100);
    close(step.x,100/columns);
    const lines=gridLines(step.x);
    assert.equal(lines.length,columns+1);
    assert.equal(lines.at(-1),100);
  }
  assert.throws(()=>gridStep({width:0,height:10},12),/no válidos/);
});

test('snapValue snaps only within the threshold',()=>{
  const lines=gridLines(100/12);
  close(snapValue(8.1,lines,.5),100/12,1e-3);
  assert.equal(snapValue(7,lines,.5),7);
  const th=snapThreshold({width:390,height:844});
  close(th.x,100*8/390);
  close(th.y,100*8/844);
});

test('snapMove aligns left, center or right edges and reports the guide',()=>{
  const box:StageBox={left:10,top:20,right:30,bottom:60};
  const targets={x:[25,50],y:[0,100]};
  // Centro (20) + dx 4.6 = 24.6 → se imanta a 25.
  const r=snapMove(box,4.6,0,targets,{x:1,y:1});
  close(r.dx,5);assert.equal(r.guideX,25);assert.equal(r.guideY,null);
  // Borde derecho (30) + 19.4 = 49.4 → 50.
  close(snapMove(box,19.4,0,targets,{x:1,y:1}).dx,20);
  // Fuera del umbral: desplazamiento libre.
  const free=snapMove(box,7,3,targets,{x:1,y:1});
  assert.deepEqual(free,{dx:7,dy:3,guideX:null,guideY:null});
  // Abajo (60) + 39.5 → 100.
  close(snapMove(box,0,39.5,targets,{x:1,y:1}).dy,40);
});

test('stage guides include axes and both safe margins; smart guides use other boxes',()=>{
  assert.deepEqual(stageGuideLines().x,[0,5,10,50,90,95,100]);
  const g=boxGuideLines([{left:10,top:20,right:30,bottom:60}]);
  assert.deepEqual(g,{x:[10,20,30],y:[20,40,60]});
  assert.deepEqual(mergeTargets(g,{x:[1],y:[2]}).x,[10,20,30,1]);
});

test('alignment: top, middle, bottom and «igualar suelo» across several characters',()=>{
  const boxes:StageBox[]=[
    {left:5,top:20,right:40,bottom:70},
    {left:55,top:30,right:90,bottom:82},
  ];
  assert.deepEqual(alignBoxes(boxes,'bottom','selection'),[{dx:0,dy:12},{dx:0,dy:0}]);
  assert.deepEqual(alignBoxes(boxes,'top','selection'),[{dx:0,dy:0},{dx:0,dy:-10}]);
  assert.deepEqual(alignBoxes(boxes,'middle','stage'),[{dx:0,dy:5},{dx:0,dy:-6}]);
  assert.deepEqual(alignBoxes([boxes[0]],'center','stage'),[{dx:27.5,dy:0}]);
  assert.deepEqual(alignBoxes([boxes[0]],'left','safe'),[{dx:0,dy:0}]);
  assert.deepEqual(alignBoxes([boxes[1]],'right','safe'),[{dx:5,dy:0}]);
  assert.deepEqual(alignReferenceBox('safe',[]),{left:5,top:5,right:95,bottom:95});
  assert.throws(()=>alignReferenceBox('selection',[]),/seleccionados/);
});

test('nudges move one cell with snap and 0.5 % without it',()=>{
  const step=gridStep({width:390,height:844},12);
  assert.deepEqual(nudgeDelta('right',true,step),{dx:step.x,dy:0});
  assert.deepEqual(nudgeDelta('up',true,step),{dx:0,dy:-step.y});
  assert.deepEqual(nudgeDelta('left',false,step),{dx:-.5,dy:0});
  assert.deepEqual(nudgeDelta('down',false,step),{dx:0,dy:.5});
});

test('scale snaps to 5 % and rotation to 15° only when snapping',()=>{
  close(snapScale(1.234,true),1.25);
  assert.equal(snapScale(1.234,false),1.234);
  assert.equal(snapRotation(37,true),30);
  assert.equal(snapRotation(37,false),37);
  assert.equal(snapRotation(190,false),-170);
  assert.equal(snapRotation(-180,false),180);
});

test('editor preferences are validated and stored outside the document',()=>{
  assert.deepEqual(normalizeEditorPrefs(null),DEFAULT_EDITOR_PREFS);
  assert.deepEqual(normalizeEditorPrefs({grid:true,columns:7,opacity:5,snap:'sí',axes:true}),
    {...DEFAULT_EDITOR_PREFS,grid:true,opacity:.8,axes:true});
  assert.equal(normalizeEditorPrefs({columns:24,opacity:0}).opacity,.1);
  const data=new Map<string,string>();
  const storage={getItem:(k:string)=>data.get(k)??null,setItem:(k:string,v:string)=>{data.set(k,v);}};
  assert.equal(saveEditorPrefs(storage,{...DEFAULT_EDITOR_PREFS,snap:true,columns:24}),true);
  assert.deepEqual([...data.keys()],[STUDIO_EDITOR_PREFS_KEY]);
  assert.equal(readEditorPrefs(storage).columns,24);
  const blocked={getItem:()=>{throw new Error('x');},setItem:()=>{throw new Error('x');}};
  assert.deepEqual(readEditorPrefs(blocked),DEFAULT_EDITOR_PREFS);
  assert.equal(saveEditorPrefs(blocked,DEFAULT_EDITOR_PREFS),false);
});

test('snapDrag: the grid always lands on a line; guides win within the threshold',()=>{
  const step=gridStep({width:390,height:844},12);
  const box:StageBox={left:60,top:20,right:90,bottom:70};
  const threshold=snapThreshold({width:390,height:844});
  for(const dx of [-9.49,-3.1,-15.7,4.44]){
    const r=snapDrag(box,dx,0,{grid:{step},threshold});
    const moved=[box.left+r.dx,(box.left+box.right)/2+r.dx,box.right+r.dx];
    const best=Math.min(...moved.map(v=>Math.abs(v-Math.round(v/step.x)*step.x)));
    assert.ok(best<1e-3,'dx '+dx+' → '+best);
    assert.equal(r.guideX,null);
  }
  // Una guía cercana (borde derecho a 50 + 0.4 %) gana a la grilla.
  const guided=snapDrag(box,-39.6,0,{grid:{step},guides:{x:[50],y:[]},threshold});
  close(guided.dx,-40);assert.equal(guided.guideX,50);
  // Sin grilla ni guía cercana: libre.
  assert.deepEqual(snapDrag(box,-9.49,1,{guides:{x:[0],y:[0]},threshold}),{dx:-9.49,dy:1,guideX:null,guideY:null});
});
