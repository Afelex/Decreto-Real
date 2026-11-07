/**
 * Decreto Real Studio v3 — matemática pura de la grilla, el ajuste magnético
 * (snap), las guías y la alineación. Todo se expresa en % del ESCENARIO:
 * x en % del ancho y y en % del alto. Sin DOM ni React.
 */

export const STUDIO_GRID_COLUMNS = [6,8,12,16,24] as const;
export type StudioGridColumns = typeof STUDIO_GRID_COLUMNS[number];
/** Umbral de imantado en píxeles CSS. */
export const STUDIO_SNAP_THRESHOLD_PX = 8;
/** Cada cuántas celdas se dibuja una línea principal. */
export const STUDIO_GRID_MAJOR_EVERY = 4;
/** Márgenes de seguridad por lado, en % del escenario. */
export const STUDIO_SAFE_ACTION = 5;
export const STUDIO_SAFE_TITLE = 10;
/** Paso de escala con ajuste activo (5 %) y de rotación (15°). */
export const STUDIO_SCALE_SNAP = .05;
export const STUDIO_ROTATION_SNAP = 15;
/** Nudge con flechas sin ajuste (en % del escenario). */
export const STUDIO_FREE_NUDGE = .5;

export type StageSize = {width:number;height:number};
/** Caja en % del escenario. */
export type StageBox = {left:number;top:number;right:number;bottom:number};
export type GridStep = {x:number;y:number};

/**
 * Paso de la grilla. Las celdas son CUADRADAS: el paso horizontal es
 * 100/columnas % del ancho y el vertical, el mismo tamaño en píxeles
 * expresado en % del alto.
 */
export function gridStep(stage:StageSize,columns:number):GridStep {
  if(!(stage.width>0)||!(stage.height>0)||!(columns>0))throw new Error('Escenario o densidad no válidos.');
  const cellPx=stage.width/columns;
  return {x:100/columns,y:100*cellPx/stage.height};
}
/** Posiciones (en %) de las líneas de la grilla dentro de 0–100. */
export function gridLines(step:number):number[] {
  const lines:number[]=[];
  for(let i=0;i*step<=100+1e-9;i++)lines.push(round4(i*step));
  return lines;
}
/** Umbral de imantado en % (horizontal y vertical) para un escenario. */
export function snapThreshold(stage:StageSize,px=STUDIO_SNAP_THRESHOLD_PX):GridStep {
  return {x:100*px/stage.width,y:100*px/stage.height};
}

const round4=(n:number)=>Math.round(n*10000)/10000;
const nearest=(value:number,targets:readonly number[])=>{
  let best:number|null=null;
  for(const t of targets)if(best===null||Math.abs(t-value)<Math.abs(best-value))best=t;
  return best;
};

/** Imanta un valor a la línea más cercana si está dentro del umbral. */
export function snapValue(value:number,lines:readonly number[],threshold:number):number {
  const best=nearest(value,lines);
  return best!==null&&Math.abs(best-value)<=threshold?best:value;
}

export const boxCenterX=(b:StageBox)=>(b.left+b.right)/2;
export const boxCenterY=(b:StageBox)=>(b.top+b.bottom)/2;
export const moveBox=(b:StageBox,dx:number,dy:number):StageBox=>
  ({left:b.left+dx,right:b.right+dx,top:b.top+dy,bottom:b.bottom+dy});

export type SnapTargets = {x:readonly number[];y:readonly number[]};
export type SnapResult = {dx:number;dy:number;
  /** Línea a la que se imantó cada eje (para dibujar la guía), o null. */
  guideX:number|null;guideY:number|null};

/**
 * Ajusta el desplazamiento (dx, dy) de una caja para que su borde izquierdo,
 * centro o borde derecho (y arriba/centro/abajo) caiga en el objetivo más
 * cercano dentro del umbral. Cada eje se resuelve por separado.
 */
export function snapMove(box:StageBox,dx:number,dy:number,targets:SnapTargets,threshold:GridStep):SnapResult {
  const moved=moveBox(box,dx,dy);
  const axis=(points:number[],lines:readonly number[],limit:number)=>{
    let best:{offset:number;line:number}|null=null;
    for(const point of points)for(const line of lines){
      const offset=line-point;
      if(Math.abs(offset)<=limit&&(!best||Math.abs(offset)<Math.abs(best.offset)))best={offset,line};
    }
    return best;
  };
  const sx=axis([moved.left,boxCenterX(moved),moved.right],targets.x,threshold.x);
  const sy=axis([moved.top,boxCenterY(moved),moved.bottom],targets.y,threshold.y);
  return {
    dx:sx?dx+sx.offset:dx,dy:sy?dy+sy.offset:dy,
    guideX:sx?round4(sx.line):null,guideY:sy?round4(sy.line):null,
  };
}

/**
 * Imantado completo de un arrastre, eje por eje:
 * 1. Guías inteligentes (si hay): solo dentro del umbral, y tienen prioridad.
 * 2. Grilla (si el ajuste está activo): SIEMPRE a la línea más cercana, de modo
 *    que el borde, centro o ancla de la caja termina sobre una línea.
 * Devuelve la guía usada en cada eje solo cuando proviene de las guías.
 */
export function snapDrag(box:StageBox,dx:number,dy:number,opts:{
  guides?:SnapTargets;grid?:{step:GridStep};threshold:GridStep;
}):SnapResult {
  const guided=opts.guides?snapMove(box,dx,dy,opts.guides,opts.threshold):null;
  const gridSnap=opts.grid?snapMove(box,dx,dy,{x:gridLines(opts.grid.step.x),y:gridLines(opts.grid.step.y)},
    {x:opts.grid.step.x,y:opts.grid.step.y}):null;
  const pick=(axis:'x'|'y')=>{
    const guide=guided?.[axis==='x'?'guideX':'guideY']??null;
    if(guided&&guide!==null)return {d:guided[axis==='x'?'dx':'dy'],guide};
    if(gridSnap)return {d:gridSnap[axis==='x'?'dx':'dy'],guide:null};
    return {d:axis==='x'?dx:dy,guide:null};
  };
  const x=pick('x'),y=pick('y');
  return {dx:x.d,dy:y.d,guideX:x.guide,guideY:y.guide};
}

/** Objetivos fijos de las guías: bordes, eje central y márgenes de seguridad. */
export function stageGuideLines():SnapTargets {
  const fixed=[0,STUDIO_SAFE_ACTION,STUDIO_SAFE_TITLE,50,100-STUDIO_SAFE_TITLE,100-STUDIO_SAFE_ACTION,100];
  return {x:fixed,y:fixed};
}
/** Objetivos de guías inteligentes: bordes y centros de otras capas. */
export function boxGuideLines(boxes:readonly StageBox[]):SnapTargets {
  return {
    x:boxes.flatMap(b=>[b.left,boxCenterX(b),b.right]),
    y:boxes.flatMap(b=>[b.top,boxCenterY(b),b.bottom]),
  };
}
export const mergeTargets=(...all:SnapTargets[]):SnapTargets=>({
  x:all.flatMap(t=>t.x),y:all.flatMap(t=>t.y),
});

/** Escala imantada a pasos de 5 % cuando el ajuste está activo. */
export const snapScale=(scale:number,snap:boolean)=>snap?Math.round(scale/STUDIO_SCALE_SNAP)*STUDIO_SCALE_SNAP:scale;
/** Rotación normalizada a −180…180, imantada a 15° cuando el ajuste está activo. */
export function snapRotation(degrees:number,snap:boolean):number {
  let d=((degrees+180)%360+360)%360-180;
  if(snap)d=Math.round(d/STUDIO_ROTATION_SNAP)*STUDIO_ROTATION_SNAP;
  return d===-180?180:d;
}

export type AlignMode = 'top'|'middle'|'bottom'|'left'|'center'|'right';
export type AlignReference = 'stage'|'safe'|'selection';

/** Caja de referencia para alinear. */
export function alignReferenceBox(reference:AlignReference,boxes:readonly StageBox[]):StageBox {
  if(reference==='stage')return {left:0,top:0,right:100,bottom:100};
  if(reference==='safe')return {left:STUDIO_SAFE_ACTION,top:STUDIO_SAFE_ACTION,
    right:100-STUDIO_SAFE_ACTION,bottom:100-STUDIO_SAFE_ACTION};
  if(!boxes.length)throw new Error('No hay elementos seleccionados.');
  return {
    left:Math.min(...boxes.map(b=>b.left)),top:Math.min(...boxes.map(b=>b.top)),
    right:Math.max(...boxes.map(b=>b.right)),bottom:Math.max(...boxes.map(b=>b.bottom)),
  };
}

/**
 * Desplazamientos (en %) que alinean cada caja con la referencia.
 * `bottom` con referencia `selection` es «Igualar suelo»: todos los pies a la
 * línea más baja del grupo.
 */
export function alignBoxes(boxes:readonly StageBox[],mode:AlignMode,reference:AlignReference):{dx:number;dy:number}[] {
  const ref=alignReferenceBox(reference,boxes);
  return boxes.map(b=>{
    switch(mode){
      case 'left':return {dx:ref.left-b.left,dy:0};
      case 'center':return {dx:boxCenterX(ref)-boxCenterX(b),dy:0};
      case 'right':return {dx:ref.right-b.right,dy:0};
      case 'top':return {dx:0,dy:ref.top-b.top};
      case 'middle':return {dx:0,dy:boxCenterY(ref)-boxCenterY(b)};
      case 'bottom':return {dx:0,dy:ref.bottom-b.bottom};
    }
  }).map(d=>({dx:round4(d.dx),dy:round4(d.dy)}));
}

/** Desplazamiento de un nudge con flechas: una celda con ajuste, 0,5 % sin él. */
export function nudgeDelta(direction:'left'|'right'|'up'|'down',snap:boolean,step:GridStep):{dx:number;dy:number} {
  const sx=snap?step.x:STUDIO_FREE_NUDGE;
  const sy=snap?step.y:STUDIO_FREE_NUDGE;
  if(direction==='left')return {dx:-sx,dy:0};
  if(direction==='right')return {dx:sx,dy:0};
  if(direction==='up')return {dx:0,dy:-sy};
  return {dx:0,dy:sy};
}

// ——— Preferencias del editor (NUNCA forman parte del documento ni del respaldo) ———

export const STUDIO_EDITOR_PREFS_KEY = 'decreto-real.studio.preferencias-editor.v1';
export type StudioEditorPrefs = {
  grid:boolean;columns:StudioGridColumns;opacity:number;
  snap:boolean;axes:boolean;safe:boolean;smart:boolean;
  /** Posición del inspector en pantallas estrechas. */
  dock:'top'|'bottom';
};
export const DEFAULT_EDITOR_PREFS:Readonly<StudioEditorPrefs> = Object.freeze({
  grid:false,columns:12,opacity:.35,snap:false,axes:false,safe:false,smart:false,dock:'top',
});
export function normalizeEditorPrefs(value:unknown):StudioEditorPrefs {
  const v=value&&typeof value==='object'?value as Record<string,unknown>:{};
  const bool=(key:keyof StudioEditorPrefs)=>typeof v[key]==='boolean'?v[key] as boolean:DEFAULT_EDITOR_PREFS[key] as boolean;
  const columns=(STUDIO_GRID_COLUMNS as readonly number[]).includes(v.columns as number)
    ?v.columns as StudioGridColumns:DEFAULT_EDITOR_PREFS.columns;
  const opacity=typeof v.opacity==='number'&&Number.isFinite(v.opacity)
    ?Math.round(Math.min(.8,Math.max(.1,v.opacity))*100)/100:DEFAULT_EDITOR_PREFS.opacity;
  return {grid:bool('grid'),columns,opacity,snap:bool('snap'),axes:bool('axes'),safe:bool('safe'),smart:bool('smart'),
    dock:v.dock==='bottom'?'bottom':'top'};
}
type PrefsStorage = Pick<Storage,'getItem'|'setItem'>;
export function readEditorPrefs(storage:PrefsStorage|null|undefined):StudioEditorPrefs {
  try{const raw=storage?.getItem(STUDIO_EDITOR_PREFS_KEY);return normalizeEditorPrefs(raw?JSON.parse(raw):null);}
  catch{return {...DEFAULT_EDITOR_PREFS};}
}
export function saveEditorPrefs(storage:PrefsStorage|null|undefined,prefs:StudioEditorPrefs):boolean {
  try{storage?.setItem(STUDIO_EDITOR_PREFS_KEY,JSON.stringify(normalizeEditorPrefs(prefs)));return Boolean(storage);}
  catch{return false;}
}
