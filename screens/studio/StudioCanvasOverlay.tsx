import React from 'react';
import {
  STUDIO_GRID_COLUMNS, STUDIO_GRID_MAJOR_EVERY, STUDIO_SAFE_ACTION, STUDIO_SAFE_TITLE,
  gridStep, nudgeDelta, snapRotation, snapScale, type StageBox, type StudioGridColumns,
} from '../../campaign/studio/grid';
import { layerOrDefault, withBackgroundFrame, withLayer } from '../../campaign/studio/ops';
import { isBackgroundLocked, type StudioLayer } from '../../campaign/studio/schema';
import { BACKGROUND_ID, elementForLayer, stageBoxOf } from './stageGeometry';
import { actionTargets, moveLayersUpdate } from './studioActions';
import { useStudio } from './StudioContext';

type Props={sceneKey:string;stageRef:React.RefObject<HTMLElement|null>};
type Measured={boxes:Record<string,StageBox>;dialogueTop:number|null;width:number;height:number};

const sameBoxes=(a:Record<string,StageBox>,b:Record<string,StageBox>)=>{
  const ka=Object.keys(a),kb=Object.keys(b);
  if(ka.length!==kb.length)return false;
  return ka.every(k=>b[k]&&['left','top','right','bottom'].every(p=>
    Math.abs(a[k][p as keyof StageBox]-b[k][p as keyof StageBox])<.01));
};
const pct=(n:number)=>n+'%';

/**
 * Lienzo de Studio (solo con el editor abierto): grilla, ejes, márgenes de
 * seguridad, guías inteligentes, caja de selección con asas de escala y
 * rotación, barra de herramientas y atajos de teclado. Las capas visuales
 * no reciben eventos (`pointer-events:none`), así que nunca impiden
 * seleccionar o arrastrar.
 */
export default function StudioCanvasOverlay({sceneKey,stageRef}:Props){
  const studio=useStudio();
  const {prefs}=studio;
  const [settingsOpen,setSettingsOpen]=React.useState(false);
  const [toolsExpanded,setToolsExpanded]=React.useState(false);
  const [measured,setMeasured]=React.useState<Measured>({boxes:{},dialogueTop:null,width:0,height:0});
  const targets=actionTargets(studio.selected,studio.group);
  const targetKey=targets.join('|');

  // Mide la selección y el panel de diálogo después de cada cambio.
  const measure=React.useCallback(()=>{
    const stage=stageRef.current;
    if(!stage)return;
    const rect=stage.getBoundingClientRect();
    const boxes:Record<string,StageBox>={};
    for(const id of targetKey?targetKey.split('|'):[]){
      const el=elementForLayer(stage,id);
      if(el)boxes[id]=stageBoxOf(stage,el);
    }
    const narrative=stage.querySelector('.dcop-narrative');
    const dialogueTop=narrative?stageBoxOf(stage,narrative).top:null;
    setMeasured(prev=>prev.width===rect.width&&prev.height===rect.height&&prev.dialogueTop===dialogueTop&&
      sameBoxes(prev.boxes,boxes)?prev:{boxes,dialogueTop,width:rect.width,height:rect.height});
  },[stageRef,targetKey]);
  React.useLayoutEffect(()=>{
    measure();
    const frame=requestAnimationFrame(measure);
    const late=window.setTimeout(measure,550); // transiciones CSS del fondo
    return ()=>{cancelAnimationFrame(frame);window.clearTimeout(late);};
  });
  React.useEffect(()=>{
    window.addEventListener('resize',measure);
    return ()=>window.removeEventListener('resize',measure);
  },[measure]);

  const stepFor=(columns:number)=>{
    const rect=stageRef.current?.getBoundingClientRect();
    return rect&&rect.width&&rect.height?gridStep(rect,columns):{x:.5,y:.5};
  };

  // Atajos: G (grilla), flechas (mover), Escape (vaciar selección múltiple).
  const studioRef=React.useRef(studio);
  studioRef.current=studio;
  React.useEffect(()=>{
    const onKey=(event:KeyboardEvent)=>{
      const s=studioRef.current;
      const target=event.target as HTMLElement|null;
      if(target&&(['INPUT','TEXTAREA','SELECT'].includes(target.tagName)||target.isContentEditable))return;
      if(event.ctrlKey||event.metaKey)return;
      if(event.key==='g'||event.key==='G'){event.preventDefault();s.setPrefs({grid:!s.prefs.grid});return;}
      if(event.key==='Escape'){s.clearGroup();return;}
      const dir=({ArrowLeft:'left',ArrowRight:'right',ArrowUp:'up',ArrowDown:'down'} as const)[event.key as 'ArrowLeft'];
      if(!dir)return;
      const ids=actionTargets(s.selected,s.group);
      if(!ids.length)return;
      event.preventDefault();
      const {dx,dy}=nudgeDelta(dir,s.prefs.snap&&!event.altKey,stepFor(s.prefs.columns));
      s.apply(moveLayersUpdate(sceneKey,ids.map(id=>({id,dx,dy}))),'Elemento movido');
    };
    window.addEventListener('keydown',onKey);
    return ()=>window.removeEventListener('keydown',onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[sceneKey]);

  // Asas de escala y rotación sobre el elemento principal.
  const primary=studio.selected;
  const primaryBox=primary?measured.boxes[primary]:undefined;
  const isBackground=primary===BACKGROUND_ID;
  const primaryLayer:StudioLayer|null=primary&&!isBackground?layerOrDefault(studio.doc,sceneKey,primary):null;
  const background=studio.scene(sceneKey)?.background;
  const locked=isBackground?isBackgroundLocked(background):Boolean(primaryLayer?.locked);
  const handleDrag=React.useRef<{kind:'scale'|'rotate';pointerId:number;cx:number;cy:number;
    startDist:number;startAngle:number;scale:number;rotation:number}|null>(null);
  const startHandle=(kind:'scale'|'rotate')=>(event:React.PointerEvent<HTMLElement>)=>{
    const stage=stageRef.current;
    if(!stage||!primaryBox||!primary)return;
    event.preventDefault();event.stopPropagation();
    const s=stage.getBoundingClientRect();
    const cx=s.left+s.width*(primaryBox.left+primaryBox.right)/200;
    const cy=s.top+s.height*(primaryBox.top+primaryBox.bottom)/200;
    handleDrag.current={kind,pointerId:event.pointerId,cx,cy,
      startDist:Math.max(1,Math.hypot(event.clientX-cx,event.clientY-cy)),
      startAngle:Math.atan2(event.clientY-cy,event.clientX-cx),
      scale:isBackground?background?.scale??1:primaryLayer?.scale??1,
      rotation:primaryLayer?.rotation??0};
    studio.begin();
    event.currentTarget.setPointerCapture?.(event.pointerId);
  };
  const moveHandle=(event:React.PointerEvent<HTMLElement>)=>{
    const h=handleDrag.current;
    if(!h||h.pointerId!==event.pointerId||!primary)return;
    event.preventDefault();event.stopPropagation();
    const snap=prefs.snap&&!event.altKey;
    if(h.kind==='scale'){
      const scale=snapScale(h.scale*Math.hypot(event.clientX-h.cx,event.clientY-h.cy)/h.startDist,snap);
      studio.preview(doc=>{
        if(isBackground)return withBackgroundFrame(doc,sceneKey,{scale});
        const layer=layerOrDefault(doc,sceneKey,primary);
        return layer?withLayer(doc,sceneKey,{...layer,scale}):doc;
      });
    }else{
      const angle=Math.atan2(event.clientY-h.cy,event.clientX-h.cx);
      const rotation=snapRotation(h.rotation+(angle-h.startAngle)*180/Math.PI,snap);
      studio.preview(doc=>{
        const layer=layerOrDefault(doc,sceneKey,primary);
        return layer?withLayer(doc,sceneKey,{...layer,rotation}):doc;
      });
    }
  };
  const endHandle=(event:React.PointerEvent<HTMLElement>)=>{
    const h=handleDrag.current;
    if(!h||h.pointerId!==event.pointerId)return;
    handleDrag.current=null;
    studio.commit();
  };

  const step=measured.width&&measured.height?gridStep(measured,prefs.columns):null;
  const toggle=(key:'grid'|'snap'|'axes'|'safe'|'smart',label:string,icon:string,testid:string)=>
    <button type="button" aria-pressed={prefs[key]} data-testid={testid} title={label}
      className={prefs[key]?'dr-studio-tool-on':''}
      onClick={()=>studio.setPrefs({[key]:!prefs[key]})}>
      <span aria-hidden="true">{icon}</span><span className="dr-studio-tool-label">{label}</span>
    </button>;

  return <>
    <div className="dr-studio-canvas" aria-hidden="true" data-testid="studio-canvas">
      {prefs.grid&&step&&<div className="dr-studio-grid" data-testid="studio-grid"
        data-columns={prefs.columns} data-cell-px={(measured.width/prefs.columns).toFixed(2)}
        style={{opacity:prefs.opacity,
          '--grid-cell':(measured.width/prefs.columns)+'px',
          '--grid-major':(measured.width/prefs.columns*STUDIO_GRID_MAJOR_EVERY)+'px'} as React.CSSProperties}/>}
      {prefs.axes&&<div className="dr-studio-axes" data-testid="studio-axes">
        <span className="dr-studio-axis-x"/><span className="dr-studio-axis-y"/>
      </div>}
      {prefs.safe&&<div className="dr-studio-safe" data-testid="studio-safe-margins">
        <span className="dr-studio-safe-action" style={{inset:pct(STUDIO_SAFE_ACTION)}}/>
        <span className="dr-studio-safe-title" style={{inset:pct(STUDIO_SAFE_TITLE)}}/>
        {measured.dialogueTop!==null&&<span className="dr-studio-dialogue-band" data-testid="studio-dialogue-band"
          style={{top:pct(measured.dialogueTop)}}/>}
      </div>}
      {studio.guides.x!==null&&<span className="dr-studio-guide dr-studio-guide-x" data-testid="studio-guide-x"
        style={{left:pct(studio.guides.x)}}/>}
      {studio.guides.y!==null&&<span className="dr-studio-guide dr-studio-guide-y" data-testid="studio-guide-y"
        style={{top:pct(studio.guides.y)}}/>}
      {targets.filter(id=>id!==primary&&measured.boxes[id]).map(id=>{
        const b=measured.boxes[id];
        return <span key={id} className="dr-studio-group-box" data-testid="studio-group-box"
          style={{left:pct(b.left),top:pct(b.top),width:pct(b.right-b.left),height:pct(b.bottom-b.top)}}/>;
      })}
    </div>
    {primaryBox&&!studio.compare&&<div className={'dr-studio-selection'+(locked?' dr-studio-selection-locked':'')}
      data-testid="studio-selection-box"
      style={{left:pct(primaryBox.left),top:pct(primaryBox.top),
        width:pct(primaryBox.right-primaryBox.left),height:pct(primaryBox.bottom-primaryBox.top)}}>
      {locked?<span className="dr-studio-lock-badge" aria-label="Bloqueado">🔒</span>:<>
        <button type="button" className="dr-studio-handle dr-studio-handle-scale" data-testid="studio-handle-scale"
          aria-label="Escalar" onPointerDown={startHandle('scale')} onPointerMove={moveHandle}
          onPointerUp={endHandle} onPointerCancel={endHandle}/>
        {!isBackground&&<button type="button" className="dr-studio-handle dr-studio-handle-rotate" data-testid="studio-handle-rotate"
          aria-label="Rotar" onPointerDown={startHandle('rotate')} onPointerMove={moveHandle}
          onPointerUp={endHandle} onPointerCancel={endHandle}/>}
      </>}
    </div>}
    <button type="button" className="dr-studio-tools-toggle" aria-expanded={toolsExpanded}
      data-testid="studio-tools-toggle" onClick={()=>setToolsExpanded(v=>!v)}
      aria-label={toolsExpanded?"Ocultar herramientas del lienzo":"Mostrar herramientas del lienzo"}>
      {toolsExpanded?"✕ Cerrar":"⚙ Herramientas"}
    </button>
    <div className={"dr-studio-toolbar"+(toolsExpanded?"":" dr-studio-toolbar-collapsed")}
      role="toolbar" aria-label="Lienzo de Studio">
      {toggle('grid','Grilla','▦','studio-grid-toggle')}
      {toggle('snap','Ajuste','🧲','studio-snap-toggle')}
      {toggle('axes','Ejes','✛','studio-axes-toggle')}
      {toggle('safe','Márgenes','▭','studio-safe-toggle')}
      {toggle('smart','Guías','⌖','studio-smart-toggle')}
      <button type="button" aria-pressed={studio.compare} data-testid="studio-compare"
        title="Comparar con el original (sin ediciones)" className={studio.compare?'dr-studio-tool-on':''}
        onClick={()=>studio.setCompare(!studio.compare)}>
        <span aria-hidden="true">◐</span><span className="dr-studio-tool-label">Original</span>
      </button>
      <button type="button" aria-expanded={settingsOpen} data-testid="studio-canvas-settings"
        title="Densidad y transparencia" onClick={()=>setSettingsOpen(v=>!v)}>
        <span aria-hidden="true">⚙</span><span className="dr-studio-tool-label">Opciones</span>
      </button>
      {settingsOpen&&<div className="dr-studio-tool-popover" role="group" aria-label="Opciones de la grilla">
        <label>Densidad
          <select data-testid="studio-grid-columns" value={prefs.columns}
            onChange={e=>studio.setPrefs({columns:Number(e.target.value) as StudioGridColumns})}>
            {STUDIO_GRID_COLUMNS.map(n=><option key={n} value={n}>{n} columnas</option>)}
          </select>
        </label>
        <label>Transparencia <output>{Math.round(prefs.opacity*100)}%</output>
          <input type="range" min=".1" max=".8" step=".05" value={prefs.opacity} data-testid="studio-grid-opacity"
            onChange={e=>studio.setPrefs({opacity:Number(e.target.value)})}/>
        </label>
        <small>G: grilla · Flechas: mover · Alt: sin ajuste</small>
      </div>}
    </div>
  </>;
}
