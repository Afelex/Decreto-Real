import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { awardMissionStars, loadCampaignProgress, saveCampaignProgress } from '../campaign/campaign';
import { getCampaignStorage } from '../campaign/campaignQA';
import { GUIDED_CARD_POOL, GUIDED_STEPS, guidedDuelAt, type GuidedAction } from '../campaign/guidedOpeningDuel';
import { useAudio } from '../contexts/AudioContext';
import CampaignPauseMenu from './CampaignPauseMenu';
import './campaign-opening.css';

export const PROLOGUE_CHECKPOINT_KEY = 'decreto-real.campania.prologo-cinematico.v1';

type SceneId = 'pergamino' | 'arresto' | 'xervias' | 'revision' | 'desafio' | 'anillo';
type OpeningBeat = {scene: SceneId; speaker: string; text: string; title: string};

export const OPENING_BEATS: readonly OpeningBeat[] = [
  {scene:'pergamino',title:'El misterio del Sello Real',speaker:'Crónica',text:'Virreinato del Perú, siglo XVII. El Sello Real da autoridad a las órdenes de la Corona. Pero han aparecido decretos contradictorios: unos liberan a familias y otros ordenan encarcelarlas. Todos llevan el mismo sello. ¿Quién está cambiando las órdenes?'},
  {scene:'arresto',title:'Una orden inesperada',speaker:'Madre',text:'¡Por favor! ¡No hemos hecho nada! ¡Mis hijos no han cometido ningún crimen!'},
  {scene:'arresto',title:'Una orden inesperada',speaker:'Domingo Quispe',text:'Lo siento, señora. Tenemos órdenes de llevarlos bajo custodia. El documento tiene el Sello Real.'},
  {scene:'arresto',title:'Una orden inesperada',speaker:'Madre',text:'¡Pero ayer nos dijeron que éramos libres! ¿Por qué ahora quieren encarcelarnos?'},
  {scene:'xervias',title:'Un joven soldado interviene',speaker:'Xervias',text:'¡Un momento! ¿Qué está sucediendo aquí?'},
  {scene:'xervias',title:'Un joven soldado interviene',speaker:'Domingo Quispe',text:'No te metas. Estamos cumpliendo una orden de la Corona.'},
  {scene:'xervias',title:'Un joven soldado interviene',speaker:'Madre',text:'¡Joven soldado, ayúdenos! ¡Le suplico que escuche nuestra historia!'},
  {scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Permíteme revisar ese decreto. Si es legítimo, debe poder comprobarse.'},
  {scene:'revision',title:'Un decreto bajo sospecha',speaker:'Domingo Quispe',text:'¡No puedes cuestionar el Sello Real! ¡Una orden es una orden!'},
  {scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Artículo VII de la Orden: cuando exista duda razonable sobre un decreto, un soldado puede solicitar su verificación antes de ejecutarlo.'},
  {scene:'revision',title:'Un decreto bajo sospecha',speaker:'Xervias',text:'Mi anillo percibe la energía del sello, pero no la reconoce en el texto. Algo no concuerda. Necesitamos investigar.'},
  {scene:'desafio',title:'El honor de la Corona',speaker:'Domingo Quispe',text:'¡Silencio! Acabas de graduarte de la academia. ¡No eres nadie para cuestionarme!'},
  {scene:'desafio',title:'El honor de la Corona',speaker:'Xervias',text:'¿Nadie? Soy soldado de este reino. He jurado proteger a quienes no pueden defenderse.'},
  {scene:'desafio',title:'El honor de la Corona',speaker:'Xervias',text:'En nombre de la justicia y del honor de la Corona, exijo que suspendas este arresto hasta aclarar la verdad.'},
  {scene:'desafio',title:'El honor de la Corona',speaker:'Domingo Quispe',text:'¡No pienso obedecerte! ¡Soy Domingo Quispe, guardia del pregón, y tengo autoridad para detenerlos!'},
  {scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'Este anillo representa mi fidelidad al reino... y mi deber de proteger a los inocentes.'},
  {scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'¡Activo el DECRETO REAL!'},
  {scene:'anillo',title:'El juramento de Xervias',speaker:'Domingo Quispe',text:'¿Qué estás haciendo? ¡¿Te atreves a declararme un duelo?!'},
  {scene:'anillo',title:'El juramento de Xervias',speaker:'Xervias',text:'He declarado Decreto Real porque tu orden es dudosa y pretendes lastimar a una familia. Defendamos nuestras razones en el duelo.'},
  {scene:'anillo',title:'El juramento de Xervias',speaker:'Domingo Quispe',text:'¡Muy bien! Invocaré mi propio Decreto Real. ¡Ahora estás en problemas!'},
];

export const AFTER_DUEL_BEATS = [
  {speaker:'Domingo Quispe',text:'¡¿Qué?! ¡Mi anillo...! ¡No puedo mantener el vínculo!'},
  {speaker:'Crónica',text:'Una descarga dorada rodea al guardia. Sus cartas desaparecen. Cae de rodillas y pierde el conocimiento.'},
  {speaker:'Madre',text:'¡Dios mío! ¿Qué le ha ocurrido? ¿Está muerto?'},
  {speaker:'Xervias',text:'No, tranquila. Sigue vivo. Cuando alguien pierde un Decreto Real, la conexión mística con el anillo se rompe por unos instantes.'},
  {speaker:'Xervias',text:'Esa descarga puede dejarlo inconsciente un momento. Pronto despertará.'},
  {speaker:'Domingo Quispe',text:'¿Qué... qué pasó? ¿Por qué no siento la energía de mi anillo?'},
  {speaker:'Xervias',text:'Has perdido. Mi Decreto Final rompió tu vínculo místico y te hizo perder el conocimiento. El arresto queda suspendido hasta comprobar la orden.'},
  {speaker:'Domingo Quispe',text:'Está bien... No arrestaremos a la familia. Pero ese documento llevaba el sello de la Corona.'},
  {speaker:'Madre',text:'Gracias, joven soldado. No sabemos qué habría sido de nosotros.'},
  {speaker:'Xervias',text:'Todavía no hemos resuelto el misterio. Alguien está utilizando el Sello Real para causar daño... y descubriré quién.'},
] as const;

function checkpoint() {
  try {
    const raw=getCampaignStorage()?.getItem(PROLOGUE_CHECKPOINT_KEY);
    if (!raw) return {beat:0,duel:0,after:0};
    const p=JSON.parse(raw) as {beat:number;duel:number;after:number};
    return {
      beat:Number.isInteger(p.beat)?Math.max(0,Math.min(OPENING_BEATS.length+1,p.beat)):0,
      duel:Number.isInteger(p.duel)?Math.max(0,Math.min(GUIDED_STEPS.length-1,p.duel)):0,
      after:Number.isInteger(p.after)?Math.max(0,Math.min(AFTER_DUEL_BEATS.length-1,p.after)):0,
    };
  } catch {return {beat:0,duel:0,after:0};}
}

const portraits: Record<string,string> = {
  'Xervias':'./retratos/jugador.webp',
  'Domingo Quispe':'./campania/arte/retratos/rival-01-domingo-quispe.webp',
};
const cardActions: readonly GuidedAction[] = ['attack1','attack2','attack3','impact1','impact2','impact3','impact4','order','defense'];

const GuidedStoryBattle: React.FC<{value:number;advance:()=>void;finish:()=>void}> = ({value,advance,finish}) => {
  const {playSound}=useAudio();
  const state=guidedDuelAt(value);
  const current=GUIDED_STEPS[value];
  const action=current?.action;
  const cardAction=!!action&&cardActions.includes(action);
  const drag=React.useRef<{x:number;y:number;active:boolean}|null>(null);
  const [hint,setHint]=React.useState('');
  React.useEffect(()=>setHint(''),[value]);
  const perform=(played?:GuidedAction)=>{
    if (played && action!==played) {setHint('Sigue la indicación de Xervias.');return;}
    if (!action && played) return;
    if (played) playSound(played.startsWith('impact')?'IMPACT':played.startsWith('attack')?'ATTACK':played==='defense'?'DEFENSE':'CLICK');
    else playSound('CLICK');
    if (value>=GUIDED_STEPS.length-1) finish();
    else advance();
  };
  const handlePointerUp=(event: React.PointerEvent<HTMLButtonElement>,cardId:string)=>{
    if (!drag.current) return;
    const moved=Math.hypot(event.clientX-drag.current.x,event.clientY-drag.current.y)>24;
    drag.current.active=moved;
    if (moved) {
      const target=document.elementFromPoint(event.clientX,event.clientY);
      if (target?.closest('.dcop-duel-field')) perform(cardId as GuidedAction);
      else setHint('Arrastra la carta hasta el centro del campo.');
    }
  };
  return <section className="dcop-battle" aria-label="Duelo guiado de Xervias contra Domingo Quispe">
    <div className="dcop-duel-rival">
      <img src={portraits['Domingo Quispe']} alt="Domingo Quispe" />
      <div><strong>DOMINGO QUISPE</strong><span>PV {state.rivalHp}/20</span><div className="dcop-hp"><i style={{width:(state.rivalHp/20*100)+'%'}}/></div></div>
    </div>
    <div className="dcop-duel-field">
      <small>{state.won?'¡DECRETO FINAL!':'CAMPO DEL DECRETO REAL'}</small>
      <div className="dcop-impact-track" aria-label={'Impactos '+state.impacts+' de 4'}>
        {['I','II','III','FINAL'].map((rank,index)=><div key={rank} className={index<state.impacts?'sealed':''}>{rank}</div>)}
      </div>
      {action==='coin' ? <button type="button" className="dcop-coin" onClick={()=>perform('coin')} aria-label="Lanzar moneda">☀<small>Lanzar</small></button> :
        <span className="dcop-field-emblem" aria-hidden="true">{state.won?'✷':'✦'}</span>}
      <small>{state.coin?'Moneda: CARA · Comienza Xervias':'Comienzo del duelo'}</small>
    </div>
    <div className="dcop-duel-you">
      <img src={portraits['Xervias']} alt="Xervias"/>
      <div><strong>XERVIAS · TURNO {state.turn}</strong><span>PV {state.playerHp}/20</span><div className="dcop-hp red"><i style={{width:(state.playerHp/20*100)+'%'}}/></div></div>
    </div>
    <div className="dcop-duel-hand" role="group" aria-label="Tu mano de cartas">
      {state.hand.map(id=>{
        const card=GUIDED_CARD_POOL.find(item=>item.id===id)!;
        const playable=cardAction && action===card.id;
        return <button type="button" key={id} disabled={!playable} aria-label={card.name+' '+card.effect}
          className={'dcop-card'+(playable?' active':'')}
          onPointerDown={e=>{drag.current={x:e.clientX,y:e.clientY,active:false};}}
          onPointerUp={e=>handlePointerUp(e,id)}
          onClick={()=>{if(drag.current?.active){drag.current=null;return;} perform(id as GuidedAction);}}>
          <img src={card.image} alt="" draggable={false}/>
          <span>{card.name}</span><small>{card.effect}</small>
        </button>;
      })}
    </div>
    <section className="dcop-duel-coach" aria-live="polite">
      <div className="dcop-coach-person">
        {portraits[current.speaker] && <img src={portraits[current.speaker]} alt=""/>}
        <div><small>DUelo guiado · Paso {value+1} de {GUIDED_STEPS.length}</small><strong>{current.speaker}</strong></div>
      </div>
      <p>{current.text}</p>
      {hint && <small className="dcop-hint" role="status">{hint}</small>}
      {!cardAction && action!=='coin' &&
        <button type="button" className="dcop-next" onClick={()=>perform()}>{current.label??(value===GUIDED_STEPS.length-1?'Ver desenlace':'Continuar ›')}</button>}
      {cardAction && <small className="dcop-tap-hint">Toca la carta iluminada o arrástrala al campo.</small>}
    </section>
  </section>;
};

const CampaignOpening:React.FC=()=>{
  const navigate=useNavigate();
  const [query]=useSearchParams();
  const saved=React.useMemo(checkpoint,[]);
  const override=query.get('escena');
  const startBeat=React.useMemo(()=>{
    if (override==='duelo') return OPENING_BEATS.length;
    if (override==='desenlace') return OPENING_BEATS.length+1;
    if (override) {const i=OPENING_BEATS.findIndex(row=>row.scene===override);if(i>=0)return i;}
    return saved.beat;
  },[override,saved.beat]);
  const [beat,setBeat]=React.useState(startBeat);
  const [duel,setDuel]=React.useState(override?0:saved.duel);
  const [after,setAfter]=React.useState(override?0:saved.after);
  const {playSound}=useAudio();
  React.useEffect(()=>{
    try{getCampaignStorage()?.setItem(PROLOGUE_CHECKPOINT_KEY,JSON.stringify({beat,duel,after}));}catch{/* no storage */}
  },[beat,duel,after]);
  const finish=()=>{
    const store=getCampaignStorage();
    const progress=loadCampaignProgress(store);
    const awarded=awardMissionStars(progress,'01',3);
    const savedProgress=saveCampaignProgress(store,awarded);
    if (!savedProgress){ /* Game remains traversable even if storage is unavailable */ }
    try{store?.removeItem(PROLOGUE_CHECKPOINT_KEY);}catch{/* private mode */}
    navigate('/campania/conversacion/01');
  };
  const prologue=beat<OPENING_BEATS.length?OPENING_BEATS[beat]:null;
  const isBattle=beat===OPENING_BEATS.length;
  const isAfter=beat>OPENING_BEATS.length;
  const scene=prologue?.scene ?? (isBattle?'duelo':'desenlace');
  const story=isAfter?AFTER_DUEL_BEATS[after]:prologue;
  const speaker=story?.speaker??'';
  const advance=()=>{
    playSound('CLICK');
    if (isAfter){if(after>=AFTER_DUEL_BEATS.length-1)finish();else setAfter(v=>v+1);}
    else setBeat(v=>v+1);
  };
  return <main className={'dcop-screen dcop-'+scene} aria-label="Prólogo de campaña: El Sello Real">
    <div className="dcop-stage">
      <CampaignPauseMenu/>
      <div className="dcop-art" aria-hidden="true">
        <img className="dcop-backdrop" src={scene==='pergamino'?'./portada/portada-poster.jpg':'./escenarios/plaza-virreinal-v2.svg'} alt=""/>
        {scene==='pergamino' && <div className="dcop-scroll-held">
          <div className="dcop-parchment">
            <span>† CORONA SOLAR †</span><b>POR ORDEN DE LA CORONA</b>
            <p>Dos órdenes opuestas.<br/>Un mismo Sello Real.<br/>¿Cuál dice la verdad?</p>
            <div className="dcop-wax">✷</div>
          </div>
          <div className="dcop-hand left"/><div className="dcop-hand right"/>
        </div>}
        {(scene==='arresto'||scene==='xervias'||scene==='revision'||scene==='desafio')&&
          <div className="dcop-scene-figures">
            <div className="dcop-civil" aria-hidden="true"><span>♟</span><small>LA FAMILIA</small></div>
            <div className="dcop-guard"><img src={portraits['Domingo Quispe']} alt=""/><small>GUARDIA</small></div>
            {scene!=='arresto' && <div className="dcop-hero"><img src={portraits['Xervias']} alt=""/><small>XERVIAS</small></div>}
          </div>}
        {scene==='anillo'&&<div className="dcop-ring-hero">
          <img src={portraits['Xervias']} alt=""/>
          <span className="dcop-magic-ring">✦</span>
          <img className="dcop-summoned-card" src="./cartas/decreto-impacto.webp" alt=""/>
        </div>}
        {scene==='desenlace'&&<div className="dcop-outcome-art"><img src={portraits['Domingo Quispe']} alt=""/><span>✦</span><img src={portraits['Xervias']} alt=""/></div>}
      </div>
      {isBattle ? <GuidedStoryBattle value={duel} advance={()=>setDuel(v=>Math.min(GUIDED_STEPS.length-1,v+1))} finish={()=>{setBeat(OPENING_BEATS.length+1);setAfter(0);}}/> :
        <section className={'dcop-narrative'+(scene==='pergamino'?' parchment-narrative':'')} aria-live="polite">
          <div className="dcop-chapter-title"><small>DECRETO REAL · PRÓLOGO</small><h1>{isAfter?'El precio de la victoria':prologue?.title}</h1></div>
          <div className="dcop-speech">
            {portraits[speaker] && <img src={portraits[speaker]} alt=""/>}
            <div><strong>{speaker}</strong><p>{story?.text}</p></div>
          </div>
          <footer><span>{isAfter?'DESENLACE '+(after+1)+'/'+AFTER_DUEL_BEATS.length:'ESCENA '+(beat+1)+'/'+OPENING_BEATS.length}</span>
            <button type="button" onClick={advance}>{(isAfter&&after===AFTER_DUEL_BEATS.length-1)?'Continuar historia ›':beat===OPENING_BEATS.length-1?'Comenzar duelo ⚔':'Continuar ›'}</button></footer>
        </section>}
    </div>
  </main>;
};
export default CampaignOpening;
