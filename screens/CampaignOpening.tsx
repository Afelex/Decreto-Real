import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { awardMissionStars, loadCampaignProgress, saveCampaignProgress } from '../campaign/campaign';
import { getCampaignStorage } from '../campaign/campaignQA';
import GameBoard from './GameBoard';
import { GUIDED_STEPS } from '../campaign/guidedOpeningDuel';
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
  // A resumed cinematic duel restarts from the same real initial deck, never a fake restored match.
  const duel=0;
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
      {!isBattle && <CampaignPauseMenu/>}
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
            <div className="dcop-civil" aria-hidden="true"><img src="./campania/escenas/familia-suplicando.svg" alt=""/><small>LA FAMILIA</small></div>
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
      {isBattle ? <GameBoard guidedOpening
        onReturn={()=>navigate('/')}
        onOutcome={(result)=>{if(result.won){setBeat(OPENING_BEATS.length+1);setAfter(0);}}}
        presentation={{background:'./escenarios/plaza-virreinal-v2.svg',backgroundVideo:null,
          playerPortrait:portraits['Xervias'],opponentPortrait:portraits['Domingo Quispe']}}/> :
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
