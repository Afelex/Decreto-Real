import React from 'react';
import type {StudioPortraitMotion} from '../../campaign/studio/schema';

export type PortraitMotionSettings={
  enter:StudioPortraitMotion;
  exit:StudioPortraitMotion;
  durationMs:number;
};
type PortraitFrame=PortraitMotionSettings&{id:string;src:string};
type Props={
  /** La clave es gestionada por React; presente aquí por el tipado JSX del proyecto. */
  key?:React.Key;
  stepId:string|null;
  visible:boolean;
  src:string;
  motion:PortraitMotionSettings;
  attrs:React.HTMLAttributes<HTMLDivElement>;
};

/** Conserva la salida del personaje previo sin mover las capas de DRStudio.
 * Cuando cambia la expresión del MISMO personaje, superpone brevemente el
 * sprite anterior mientras entra el nuevo (crossfade o desplazamiento).
 * Un solo <img> es el sprite actual: el anterior es un fondo decorativo.
 * Así los lectores de pantalla y las herramientas de inspección siguen
 * viendo una sola imagen activa por actor.
 */
export function NarrativePortrait({stepId,visible,src,motion,attrs}:Props){
  const incomingKey=stepId?stepId+'|'+src+'|'+motion.enter+'|'+motion.exit+'|'+motion.durationMs:null;
  const [display,setDisplay]=React.useState<PortraitFrame|null>(()=>{
    return visible&&incomingKey?{id:incomingKey,src,...motion}:null;
  });
  const [outgoing,setOutgoing]=React.useState<PortraitFrame|null>(null);
  const [phase,setPhase]=React.useState<'enter'|'exit'>('enter');
  React.useEffect(()=>{
    const incoming=visible&&incomingKey?{id:incomingKey,src,...motion}:null;
    if(!display&&!incoming)return;
    if(display?.id===incoming?.id)return;
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
    // Entre expresiones no dejamos una pantalla vacía entre la salida y
    // la entrada. Las transiciones no bloquean diálogo ni acciones.
    if(display&&incoming&&display.src!==incoming.src){
      setDisplay(incoming);
      setPhase('enter');
      if(reducedMotion||display.exit==='none'){
        setOutgoing(null);
        return;
      }
      setOutgoing(display);
      const delay=Math.max(display.durationMs, incoming.enter==='none'?0:incoming.durationMs);
      const handle=window.setTimeout(()=>setOutgoing(null),delay);
      return ()=>window.clearTimeout(handle);
    }
    setOutgoing(null);
    if(!display){
      setDisplay(incoming);
      setPhase('enter');
      return;
    }
    setPhase('exit');
    const delay=display.exit==='none'||reducedMotion?0:display.durationMs;
    const handle=window.setTimeout(()=>{
      setDisplay(incoming);
      setPhase('enter');
    },delay);
    return ()=>window.clearTimeout(handle);
  },[incomingKey,visible,src,motion.enter,motion.exit,motion.durationMs]);
  if(!display)return null;
  const style={
    ...attrs.style,
    '--dr-narrative-motion-duration':display.durationMs+'ms',
  } as React.CSSProperties;
  const outgoingStyle=outgoing?{
    backgroundImage:'url('+JSON.stringify(outgoing.src)+')',
    '--dr-narrative-motion-duration':outgoing.durationMs+'ms',
  } as React.CSSProperties:undefined;
  return <div {...attrs}
    className={(attrs.className??'')+' dr-narrative-portrait dr-narrative-'+phase}
    style={style} aria-hidden="true" data-testid="guided-large-actor"
    data-narrative-enter={display.enter} data-narrative-exit={display.exit}
    data-narrative-step={display.id.split('|')[0]}
    data-narrative-crossfade={outgoing?'true':'false'}>
    {outgoing&&<span aria-hidden="true" className="dr-narrative-crossfade-out"
      data-narrative-exit={outgoing.exit} style={outgoingStyle}/>}
    <img src={display.src} alt=""/>
  </div>;
}
