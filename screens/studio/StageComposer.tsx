import React from 'react';
import type { PrologueComposition } from '../../campaign/studio/composition';
import type { StudioLayer, StudioMediaLayer } from '../../campaign/studio/schema';
import { BACKGROUND_ID } from './stageGeometry';
import { useStudio } from './StudioContext';
import { useStudioDrag } from './useStudioDrag';

const BUBBLE_DEFAULT={x:0,y:0,scale:1,rotation:0,mirror:false,z:47};
/** El globo conserva su inclinación nativa mientras no se mueva. */
const bubbleMoved=(layer:StudioLayer|undefined)=>Boolean(layer&&(
  layer.x!==BUBBLE_DEFAULT.x||layer.y!==BUBBLE_DEFAULT.y||layer.scale!==BUBBLE_DEFAULT.scale||
  layer.rotation!==BUBBLE_DEFAULT.rotation||layer.mirror!==BUBBLE_DEFAULT.mirror||layer.z!==BUBBLE_DEFAULT.z));

/**
 * Variables CSS de una capa: x/y en % del escenario (unitarios; el CSS los
 * multiplica por el tamaño medido) y `z` en el plano único de capas.
 */
export function studioLayerStyle(layer:StudioLayer):React.CSSProperties {
  return {
    '--studio-x':layer.x,'--studio-y':layer.y,
    '--studio-scale':layer.scale,'--studio-mirror':layer.mirror?-1:1,
    '--studio-rot':layer.rotation+'deg','--studio-layer':layer.z,
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

/**
 * Plano único de capas: actores, capas añadidas, globo y elementos
 * cinematográficos comparten un mismo contexto de apilamiento. Solo se activa
 * en QA (editor abierto o escena con capas); el juego público no cambia.
 */
export function useStudioPlane(sceneKey:string|null):boolean {
  const studio=useStudio();
  return studio.active&&(studio.editing||Boolean(studio.scene(sceneKey)?.layers?.length));
}

/** Fondo de la intervención: recurso local opcional y encuadre editable. */
export function StudioBackdrop({sceneKey,src,stageRef}:{sceneKey:string|null;src:string;stageRef:React.RefObject<HTMLElement|null>}){
  const studio=useStudio();
  const handlers=useStudioDrag(sceneKey,stageRef);
  const background=studio.scene(sceneKey)?.background;
  const assetId=background?.assetId;
  const rendered=assetId?(studio.mediaUrls[assetId]??src):src;
  const isVideo=Boolean(assetId&&studio.doc.assets?.[assetId]?.mime.startsWith('video/'));
  const framed=Boolean(background&&(background.x!==undefined||background.y!==undefined||background.scale!==undefined));
  const props={
    className:'dcop-backdrop'+(framed?' dcop-studio-framed':'')+
      (studio.editing&&studio.selected===BACKGROUND_ID?' dcop-studio-selected':''),
    style:framed?{'--studio-x':background?.x??0,'--studio-y':background?.y??0,
      '--studio-bg-scale':background?.scale??1} as React.CSSProperties:undefined,
    ...handlers(BACKGROUND_ID),
  };
  return isVideo
    ? <video {...props} src={rendered} autoPlay muted loop playsInline data-testid="studio-video-background"/>
    : <img {...props} src={rendered} alt=""/>;
}

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
 * cada elemento se puede seleccionar y arrastrar.
 */
export default function StageComposer({composition,sceneKey,stageRef,showRingFallback,children}:Props){
  const studio=useStudio();
  const {editing}=studio;
  const handlers=useStudioDrag(sceneKey,stageRef);
  const scene=studio.scene(sceneKey);
  const layers=scene?.layers??[];
  const layer=(id:string)=>layers.find(item=>item.id===id);
  useStageSizeVars(stageRef,studio.active);

  const src=(assetId:string|undefined,fallback:string)=>assetId?(studio.mediaUrls[assetId]??fallback):fallback;
  const picked=(id:string)=>editing&&(studio.selected===id||studio.group.includes(id));
  const stateClass=(id:string,adjusted:boolean)=>{
    const l=layer(id);
    return (adjusted?' dcop-studio-adjusted':'')+
      (picked(id)?' dcop-studio-selected':'')+
      (l?.visible===false?' dcop-studio-hidden':'')+
      (l?.locked?' dcop-studio-locked':'');
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
        className={'dcop-studio-extra'+(picked(extra.id)?' dcop-studio-extra-selected':'')+
          (!extra.visible?' dcop-studio-hidden':'')+(extra.locked?' dcop-studio-locked':'')}
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
        (picked('bubble')?' dcop-studio-bubble-selected':'')}
      style={bubbleAdjusted&&bubbleLayer?studioLayerStyle(bubbleLayer):undefined}
      data-studio-actor={editing?'bubble':undefined}
      {...handlers('bubble')}>
      {bubbleLayer?.kind==='bubble'&&bubbleLayer.text!==undefined?bubbleLayer.text:bubble.text}
    </div>}
  </>;
}
