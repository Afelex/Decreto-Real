import React from 'react';
import type { PrologueComposition } from '../../campaign/studio/composition';
import { useStudio } from './StudioContext';

export type TimelineItem = {
  index:number;sceneKey:string;label:string;composition:PrologueComposition;
};
type Props={items:readonly TimelineItem[];current:number;onNavigate:(index:number)=>void;onClose:()=>void};

/**
 * Línea de tiempo de las 49 intervenciones: miniatura (fondo y personajes de
 * la composición, con el fondo propio de Studio si existe), marca de editada
 * y de «oculta a los jugadores». Tocar una tarjeta abre esa intervención.
 */
export default function StudioTimeline({items,current,onNavigate,onClose}:Props){
  const studio=useStudio();
  const [onlyEdited,setOnlyEdited]=React.useState(false);
  const currentRef=React.useRef<HTMLButtonElement|null>(null);
  React.useEffect(()=>{currentRef.current?.scrollIntoView?.({block:'nearest',inline:'center'});},[current]);
  const shown=items.filter(item=>!onlyEdited||studio.doc.scenes[item.sceneKey]);
  const editedCount=items.filter(item=>studio.doc.scenes[item.sceneKey]).length;
  return <section className="dr-studio-timeline" aria-label="Línea de tiempo de intervenciones" data-testid="studio-timeline">
    <header>
      <strong>Línea de tiempo</strong>
      <span>{editedCount} editadas de {items.length}</span>
      <label><input type="checkbox" checked={onlyEdited} data-testid="studio-timeline-edited"
        onChange={e=>setOnlyEdited(e.target.checked)}/> Solo editadas</label>
      <button type="button" onClick={onClose} aria-label="Cerrar línea de tiempo">×</button>
    </header>
    <ol>
      {shown.map(item=>{
        const scene=studio.doc.scenes[item.sceneKey];
        const bgAsset=scene?.background?.assetId;
        const bg=bgAsset&&studio.mediaUrls[bgAsset]&&!studio.doc.assets?.[bgAsset]?.mime.startsWith('video/')
          ?studio.mediaUrls[bgAsset]:item.composition.background;
        const active=item.index===current;
        return <li key={item.sceneKey}>
          <button type="button" ref={active?currentRef:undefined}
            className={'dr-studio-timeline-card'+(active?' dr-studio-timeline-current':'')}
            aria-current={active?'step':undefined}
            data-testid="studio-timeline-item" data-scene={item.sceneKey}
            data-edited={scene?'true':'false'} data-devonly={scene?.devOnly?'true':'false'}
            onClick={()=>{onNavigate(item.index);}}>
            <span className="dr-studio-thumb" style={{backgroundImage:'url("'+bg.replace(/"/g,'%22')+'")'}} aria-hidden="true">
              {item.composition.actors.map(actor=>{
                const replaced=scene?.layers?.find(l=>l.id===actor.layerId);
                const src=replaced?.kind==='actor'&&replaced.assetId?studio.mediaUrls[replaced.assetId]??actor.src:actor.src;
                return <img key={actor.actor} src={src} alt="" loading="lazy"
                  className={replaced?.visible===false?'dr-studio-thumb-hidden':''}/>;
              })}
              {item.composition.bubble&&<i className="dr-studio-thumb-bubble"/>}
            </span>
            <span className="dr-studio-timeline-label">
              <b>{item.index+1}</b> {item.label}
            </span>
            <span className="dr-studio-timeline-marks">
              {scene&&<span title="Editada" className="dr-studio-mark-edited">●</span>}
              {scene?.devOnly&&<span title="Oculta a los jugadores" className="dr-studio-mark-dev">DEV</span>}
              {scene?.dialogue?.text&&<span title="Texto modificado">✎</span>}
            </span>
          </button>
        </li>;
      })}
    </ol>
  </section>;
}
