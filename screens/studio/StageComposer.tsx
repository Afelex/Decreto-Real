import React from 'react';
import type { PrologueComposition } from '../../campaign/studio/composition';
import { layerOrDefault, withLayer } from '../../campaign/studio/ops';
import type { StudioLayer, StudioMediaLayer } from '../../campaign/studio/schema';
import { useStudio } from './StudioContext';

/**
 * Orden de pintado provisional (fase 2): los actores siguen dentro del grupo
 * teatral de figuras, así que el `z` del plano único se traduce a la escala
 * que entiende el DOM actual (equivalente al orden de Studio v2). La fase 3
 * sustituye este adaptador por un plano de capas real.
 */
export function interimCssLayer(layer:StudioLayer):number {
  if(layer.kind==='actor')return Math.min(30,Math.max(1,layer.z-10));
  return layer.z<=2?layer.z:Math.min(60,Math.max(3,layer.z-40));
}
const BUBBLE_DEFAULT={x:0,y:0,scale:1,rotation:0,mirror:false,z:47};
/** El globo conserva su inclinación nativa mientras no se mueva. */
const bubbleMoved=(layer:StudioLayer|undefined)=>Boolean(layer&&(
  layer.x!==BUBBLE_DEFAULT.x||layer.y!==BUBBLE_DEFAULT.y||layer.scale!==BUBBLE_DEFAULT.scale||
  layer.rotation!==BUBBLE_DEFAULT.rotation||layer.mirror!==BUBBLE_DEFAULT.mirror||layer.z!==BUBBLE_DEFAULT.z));

/** Variables CSS: x/y en % del escenario (unitarios); el CSS los multiplica por su tamaño medido. */
export function studioLayerStyle(layer:StudioLayer):React.CSSProperties {
  return {
    '--studio-x':layer.x,'--studio-y':layer.y,
    '--studio-scale':layer.scale,'--studio-mirror':layer.mirror?-1:1,
    '--studio-rot':layer.rotation+'deg','--studio-layer':interimCssLayer(layer),
    ...(layer.opacity<1?{opacity:layer.opacity}:{}),
  } as React.CSSProperties;
}

/** Publica el tamaño real del escenario como variables CSS (`--dr-stage-w/h`). */
function useStageSizeVars(stageRef:React.RefObject<HTMLElement|null>,enabled:boolean){
  // Efecto pasivo: la ref del escenario (elemento padre) ya está asignada.
  React.useEffect(()=>{
    const stage=stageRef.current;
    if(!enabled||!stage)return;
    const apply=()=>{
      const rect=stage.getBoundingClientRect();
      stage.style.setProperty('--dr-stage-w',rect.width+'px');
      stage.style.setProperty('--dr-stage-h',rect.height+'px');
    };
    apply();
    if(typeof ResizeObserver==='undefined')return;
    const observer=new ResizeObserver(apply);
    observer.observe(stage);
    return ()=>observer.disconnect();
  },[stageRef,enabled]);
}

type Drag={id:string;pointerId:number;startX:number;startY:number;origin:StudioLayer;
  width:number;height:number;frame:number;lastX:number;lastY:number};

type Props={
  composition:PrologueComposition;
  sceneKey:string|null;
  stageRef:React.RefObject<HTMLElement|null>;
  showRingFallback:boolean;
  /** Elementos cinematográficos fijos que se pintan entre las capas añadidas y el globo. */
  children?:React.ReactNode;
};

/**
 * Pinta los actores, el niño, las capas añadidas y el globo de una
 * intervención: composición base + capas de Studio. Con el editor abierto,
 * cada elemento se puede seleccionar y arrastrar (una entrada de deshacer por
 * gesto) con coordenadas relativas al escenario.
 */
export default function StageComposer({composition,sceneKey,stageRef,showRingFallback,children}:Props){
  const studio=useStudio();
  const {editing}=studio;
  const scene=studio.scene(sceneKey);
  const layers=scene?.layers??[];
  const layer=(id:string)=>layers.find(item=>item.id===id);
  const drag=React.useRef<Drag|null>(null);
  useStageSizeVars(stageRef,studio.active);

  const src=(assetId:string|undefined,fallback:string)=>assetId?(studio.mediaUrls[assetId]??fallback):fallback;
  const stateClass=(id:string,adjusted:boolean)=>{
    const l=layer(id);
    return (adjusted?' dcop-studio-adjusted':'')+
      (editing&&studio.selected===id?' dcop-studio-selected':'')+
      (l?.visible===false?' dcop-studio-hidden':'');
  };

  const flush=(d:Drag)=>{
    if(!sceneKey)return;
    const next={...d.origin,
      x:d.origin.x+100*(d.lastX-d.startX)/d.width,
      y:d.origin.y+100*(d.lastY-d.startY)/d.height,
    } as StudioLayer;
    studio.preview(doc=>withLayer(doc,sceneKey,next));
  };
  const handlers=(id:string)=>!editing||!sceneKey?{}:{
    onPointerDown:(event:React.PointerEvent<HTMLElement>)=>{
      const origin=layerOrDefault(studio.doc,sceneKey,id);
      const rect=stageRef.current?.getBoundingClientRect();
      if(!origin||!rect||!rect.width||!rect.height)return;
      event.preventDefault();event.stopPropagation();
      studio.select(id);
      studio.begin();
      drag.current={id,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,origin,
        width:rect.width,height:rect.height,frame:0,lastX:event.clientX,lastY:event.clientY};
      event.currentTarget.setPointerCapture?.(event.pointerId);
    },
    onPointerMove:(event:React.PointerEvent<HTMLElement>)=>{
      const d=drag.current;
      if(!d||d.pointerId!==event.pointerId||d.id!==id)return;
      event.preventDefault();event.stopPropagation();
      d.lastX=event.clientX;d.lastY=event.clientY;
      if(d.frame)return;
      d.frame=requestAnimationFrame(()=>{d.frame=0;if(drag.current===d)flush(d);});
    },
    onPointerUp:(event:React.PointerEvent<HTMLElement>)=>end(event,id),
    onPointerCancel:(event:React.PointerEvent<HTMLElement>)=>end(event,id),
  };
  const end=(event:React.PointerEvent<HTMLElement>,id:string)=>{
    const d=drag.current;
    if(!d||d.pointerId!==event.pointerId||d.id!==id)return;
    if(d.frame)cancelAnimationFrame(d.frame);
    if(d.lastX!==d.startX||d.lastY!==d.startY)flush(d);
    drag.current=null;
    studio.commit();
    if(event.currentTarget.hasPointerCapture?.(event.pointerId))event.currentTarget.releasePointerCapture(event.pointerId);
  };

  const media=layers.filter((l):l is StudioMediaLayer=>l.kind==='image'||l.kind==='effect');
  const bubbleLayer=layer('bubble');
  const bubble=composition.bubble;
  const bubbleAdjusted=bubbleMoved(bubbleLayer);
  const {actors}=composition;
  return <>
    {actors.length>0&&<div className={'dcop-scene-figures dcop-cast-'+actors.length+
      (composition.familyRight?' dcop-family-right':'')}>
      {actors.map(actor=>{
        const own=layer(actor.layerId);
        const childLayer=actor.child?layer(actor.child.layerId):undefined;
        return <div key={actor.actor}
          className={(actor.actor==='Xervias'?'dcop-hero':actor.actor==='Madre'?'dcop-civil':'dcop-guard')+
            (actor.actor==='Domingo Quispe'?' dcop-actor-domingo':'')+
            ' '+(actor.actor===composition.speaker?'dcop-speaking':'dcop-dim')+stateClass(actor.layerId,Boolean(own))}
          style={own?studioLayerStyle(own):undefined}
          data-studio-actor={editing?actor.layerId:undefined}
          data-testid={actor.actor==='Domingo Quispe'&&composition.isCounterInvocationShot?'domingo-integrated-invocation':undefined}
          {...handlers(actor.layerId)}>
          <img src={src(own?.kind==='actor'?own.assetId:undefined,actor.src)} alt=""/>
          {actor.child&&<img
            className={'dcop-child-sprite'+stateClass(actor.child.layerId,Boolean(childLayer))}
            style={childLayer?studioLayerStyle(childLayer):undefined}
            data-studio-actor={editing?actor.child.layerId:undefined}
            src={src(childLayer?.kind==='actor'?childLayer.assetId:undefined,actor.child.src)}
            alt=""
            {...handlers(actor.child.layerId)}/>}
          {actor.actor==='Xervias'&&showRingFallback&&<span className="dcop-ring-energy-fallback" aria-hidden="true"/>}
        </div>;
      })}
    </div>}
    {media.map(extra=>{
      const url=studio.mediaUrls[extra.assetId];
      const isVideo=studio.doc.assets?.[extra.assetId]?.mime.startsWith('video/');
      return <div key={extra.id}
        className={'dcop-studio-extra'+(editing&&studio.selected===extra.id?' dcop-studio-extra-selected':'')+
          (!extra.visible?' dcop-studio-hidden':'')}
        style={studioLayerStyle(extra)}
        data-testid="studio-added-layer"
        data-studio-actor={editing?extra.id:undefined}
        {...handlers(extra.id)}>
        {url&&(isVideo?
          <video src={url} autoPlay muted loop playsInline aria-label={extra.name}/>:
          <img src={url} alt={editing?extra.name:''}/>)}
      </div>;
    })}
    {children}
    {bubble&&bubbleLayer?.visible!==false&&<div
      className={'dcop-quick-bubble '+bubble.side+
        (bubbleAdjusted?' dcop-studio-bubble-adjusted':'')+
        (editing&&studio.selected==='bubble'?' dcop-studio-bubble-selected':'')}
      style={bubbleAdjusted&&bubbleLayer?studioLayerStyle(bubbleLayer):undefined}
      data-studio-actor={editing?'bubble':undefined}
      {...handlers('bubble')}>
      {bubbleLayer?.kind==='bubble'&&bubbleLayer.text!==undefined?bubbleLayer.text:bubble.text}
    </div>}
  </>;
}

