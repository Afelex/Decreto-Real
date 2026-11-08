import React from 'react';
import type {StudioPortraitMotion} from '../../campaign/studio/schema';

export type PortraitMotionSettings={
  enter:StudioPortraitMotion;
  exit:StudioPortraitMotion;
  durationMs:number;
};
type PortraitFrame=PortraitMotionSettings&{id:string;src:string};
type Props={
  stepId:string|null;
  visible:boolean;
  src:string;
  motion:PortraitMotionSettings;
  attrs:React.HTMLAttributes<HTMLDivElement>;
};

/** Mantiene la ilustración saliente durante su animación y recién después
 * incorpora la siguiente. Así la salida funciona también entre personajes.
 * El wrapper conserva las posiciones/arrastre calculados por DRStudio;
 * SOLO la imagen interior recibe transformaciones de animación.
 */
export function NarrativePortrait({stepId,visible,src,motion,attrs}:Props){
  const incomingKey=stepId?stepId+'|'+src+'|'+motion.enter+'|'+motion.exit+'|'+motion.durationMs:null;
  const [display,setDisplay]=React.useState<PortraitFrame|null>(()=>
    visible&&incomingKey?{id:incomingKey,src,...motion}:null);
  const [phase,setPhase]=React.useState<'enter'|'exit'>('enter');
  React.useEffect(()=>{
    const incoming=visible&&incomingKey?{id:incomingKey,src,...motion}:null;
    if(!display&&!incoming)return;
    if(display?.id===incoming?.id)return;
    if(!display){
      setDisplay(incoming);
      setPhase('enter');
      return;
    }
    setPhase('exit');
    const reducedMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches??false;
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
  return <div {...attrs}
    className={(attrs.className??'')+' dr-narrative-portrait dr-narrative-'+phase}
    style={style} aria-hidden="true" data-testid="guided-large-actor"
    data-narrative-enter={display.enter} data-narrative-exit={display.exit}
    data-narrative-step={display.id.split('|')[0]}>
    <img src={display.src} alt=""/>
  </div>;
}
