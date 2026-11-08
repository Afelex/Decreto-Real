import React from 'react';
import {
  boxGuideLines, gridStep, mergeTargets, snapDrag, snapThreshold, stageGuideLines,
  type GridStep, type SnapTargets, type StageBox,
} from '../../campaign/studio/grid';
import { getLayer, layerOrDefault, withBackgroundFrame, withLayer } from '../../campaign/studio/ops';
import { isBackgroundLocked, type StudioLayer } from '../../campaign/studio/schema';
import { BACKGROUND_ID, elementForLayer, layerBoxes, presentLayerIds, stageBoxOf } from './stageGeometry';
import { useStudio } from './StudioContext';

type Drag={
  id:string;pointerId:number;startX:number;startY:number;
  width:number;height:number;
  origin:{x:number;y:number};layer:StudioLayer|null;
  box:StageBox|null;guides:SnapTargets|null;grid:{step:GridStep}|null;threshold:GridStep;
  dx:number;dy:number;frame:number;moved:boolean;
};

/**
 * Gesto de selección y arrastre de Studio sobre cualquier capa (o el fondo):
 * coordenadas en % del escenario, una sola entrada de deshacer por gesto,
 * imantado a la grilla y a las guías inteligentes (Alt lo suspende) y
 * selección múltiple con Shift o con el modo «Seleccionar varios».
 */
export function useStudioDrag(sceneKey:string|null,stageRef:React.RefObject<HTMLElement|null>,fallbackSceneKey?:string){
  const studio=useStudio();
  const drag=React.useRef<Drag|null>(null);
  const studioRef=React.useRef(studio);
  studioRef.current=studio;

  const apply=(d:Drag)=>{
    if(!sceneKey)return;
    const x=d.origin.x+d.dx,y=d.origin.y+d.dy;
    studioRef.current.preview(doc=>d.id===BACKGROUND_ID
      ? withBackgroundFrame(doc,sceneKey,{x,y})
      : withLayer(doc,sceneKey,{...(d.layer as StudioLayer),x,y}));
  };
  const finish=(event:React.PointerEvent<HTMLElement>,id:string)=>{
    const d=drag.current;
    if(!d||d.pointerId!==event.pointerId||d.id!==id)return;
    if(d.frame)cancelAnimationFrame(d.frame);
    if(d.moved)apply(d);
    drag.current=null;
    studioRef.current.commit();
    studioRef.current.setGuides({x:null,y:null});
    if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };

  // Mientras se compara con el original no se edita.
  return (id:string)=>!studio.editing||!sceneKey||studio.compare?{}:{
    onPointerDown:(event:React.PointerEvent<HTMLElement>)=>{
      const s=studioRef.current;
      const stage=stageRef.current;
      if(!stage)return;
      event.preventDefault();event.stopPropagation();
      if(event.shiftKey||s.multiMode){s.toggleGroup(id);return;}
      s.select(id);
      if(!s.group.includes(id))s.clearGroup();
      const background=s.doc.scenes[sceneKey]?.background;
      // La primera vez que se arrastra un elemento en una intervención,
      // parte de su composición global y crea una sobrescritura individual.
      const layer=id===BACKGROUND_ID?null:(getLayer(s.doc,sceneKey,id)??
        (fallbackSceneKey?getLayer(s.doc,fallbackSceneKey,id):undefined)??
        layerOrDefault(s.doc,sceneKey,id));
      if(id!==BACKGROUND_ID&&!layer)return;
      if(id===BACKGROUND_ID?isBackgroundLocked(background):layer?.locked)return; // bloqueado: solo se selecciona
      const rect=stage.getBoundingClientRect();
      if(!rect.width||!rect.height)return;
      const element=elementForLayer(stage,id);
      const box=element?stageBoxOf(stage,element):null;
      const {snap,smart}=s.prefs;
      const step=gridStep(rect,s.prefs.columns);
      const others=smart?Object.values(layerBoxes(stage,presentLayerIds(stage).filter(other=>other!==id))):[];
      s.begin();
      drag.current={
        id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,
        width:rect.width,height:rect.height,
        origin:id===BACKGROUND_ID?{x:background?.x??0,y:background?.y??0}:{x:layer!.x,y:layer!.y},
        layer,box,
        guides:smart?mergeTargets(stageGuideLines(),boxGuideLines(others)):null,
        grid:snap?{step}:null,
        threshold:snapThreshold(rect),
        dx:0,dy:0,frame:0,moved:false,
      };
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove:(event:React.PointerEvent<HTMLElement>)=>{
      const d=drag.current;
      if(!d||d.pointerId!==event.pointerId||d.id!==id)return;
      event.preventDefault();event.stopPropagation();
      let dx=100*(event.clientX-d.startX)/d.width;
      let dy=100*(event.clientY-d.startY)/d.height;
      let guides={x:null as number|null,y:null as number|null};
      if((d.guides||d.grid)&&d.box&&!event.altKey){
        const snapped=snapDrag(d.box,dx,dy,{
          ...(d.guides?{guides:d.guides}:{}),...(d.grid?{grid:d.grid}:{}),threshold:d.threshold,
        });
        dx=snapped.dx;dy=snapped.dy;
        guides={x:snapped.guideX,y:snapped.guideY};
      }
      d.dx=dx;d.dy=dy;d.moved=true;
      const current=studioRef.current.guides;
      if(current.x!==guides.x||current.y!==guides.y)studioRef.current.setGuides(guides);
      if(d.frame)return;
      d.frame=requestAnimationFrame(()=>{d.frame=0;if(drag.current===d)apply(d);});
    },
    onPointerUp:(event:React.PointerEvent<HTMLElement>)=>finish(event,id),
    onPointerCancel:(event:React.PointerEvent<HTMLElement>)=>finish(event,id),
  };
}
