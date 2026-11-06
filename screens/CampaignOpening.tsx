import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { awardMissionStars, loadCampaignProgress, saveCampaignProgress } from '../campaign/campaign';
import { getCampaignStorage } from '../campaign/campaignQA';
import GameBoard from './GameBoard';
import { GUIDED_STEPS } from '../campaign/guidedOpeningDuel';
import { useAudio } from '../contexts/AudioContext';
import CampaignPauseMenu from './CampaignPauseMenu';
import { isPrologueArtManifest, prologueArtManifestUrl, prologueArtUrl, PROLOGUE_COMPLETE_KEY, type PrologueArtId } from '../campaign/prologueArt';
import StoryDialogue from './StoryDialogue';
import { prologueV2Url, prologueV2ManifestUrl, isV2Complete, INVOCATION_CARD_URL, type V2ArtId } from '../campaign/prologueV2';
import './campaign-opening.css';
import './story-dialogue.css';

export const PROLOGUE_CHECKPOINT_KEY = 'decreto-real.campania.prologo-cinematico.v1';

type SceneId = 'pergamino' | 'arresto' | 'xervias' | 'revision' | 'desafio' | 'anillo' | 'versus';
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
  {scene:'versus',title:'El duelo comienza',speaker:'Crónica',text:'Las dos Cartas Doradas de Invocación Real responden a la energía de sus portadores. El desafío ha sido aceptado. ¡Comienza el Decreto Real!'},
];

export const AFTER_DUEL_BEATS = [
  {phase:'desenlace',speaker:'Domingo Quispe',text:'¡¿Qué?! ¡Mi anillo...! ¡No puedo mantener el vínculo!'},
  {phase:'desenlace',speaker:'Crónica',text:'Las cartas desaparecen. Domingo cae de rodillas y pierde el conocimiento tras la descarga mística.'},
  {phase:'desenlace',speaker:'Madre',text:'¡Dios mío! ¿Qué le ocurrió? ¿Está muerto?'},
  {phase:'desenlace',speaker:'Xervias',text:'No. Está vivo. Al perder un Decreto Real, el vínculo místico con el anillo se rompe por unos instantes.'},
  {phase:'desenlace',speaker:'Xervias',text:'Esa descarga puede dejar al vencido inconsciente. Pronto despertará.'},
  {phase:'desenlace',speaker:'Domingo Quispe',text:'¿Qué... qué pasó? ¿Por qué no siento la energía de mi anillo?'},
  {phase:'desenlace',speaker:'Xervias',text:'Has perdido. Mi Decreto Final rompió tu vínculo místico. Este arresto queda suspendido hasta verificar la orden.'},
  {phase:'desenlace',speaker:'Domingo Quispe',text:'Pero... el documento tenía el sello de la Corona...'},
  {phase:'desenlace',speaker:'Madre',text:'Gracias, joven soldado. No sabemos qué habría sido de nosotros.'},
  {phase:'zhinchi',speaker:'Zhinchi',text:'¡Alto! ¿Qué sucede aquí?'},
  {phase:'zhinchi',speaker:'Xervias',text:'¡Capitán Zhinchi!'},
  {phase:'zhinchi',speaker:'Zhinchi',text:'Xervias, explícame esta situación. ¿Por qué hay un soldado derrotado y una familia bajo amenaza?'},
  {phase:'zhinchi',speaker:'Xervias',text:'Este guardia quiso detenerlos con un decreto sospechoso. Le pedí verificarlo, se negó y tuve que invocar el Decreto Real.'},
  {phase:'cetro',speaker:'Zhinchi',text:'Déjame examinar esa orden.'},
  {phase:'cetro',speaker:'Crónica',text:'Zhinchi toma el documento y acerca al sello su pequeño cetro de mando, que lleva sujeto al cinturón.'},
  {phase:'cetro',speaker:'Zhinchi',text:'La marca parece auténtica... pero mi cetro no percibe ninguna resonancia mística.'},
  {phase:'cetro',speaker:'Xervias',text:'¡Mi anillo detectó lo mismo, capitán!'},
  {phase:'cetro',speaker:'Zhinchi',text:'Entonces tenías razón. El sello no es legítimo. Alguien está falsificando las órdenes de la Corona.'},
  {phase:'resolucion',speaker:'Madre',text:'¿Entonces podemos irnos?'},
  {phase:'resolucion',speaker:'Zhinchi',text:'Sí. Este arresto queda suspendido. Pueden retirarse en paz.'},
  {phase:'resolucion',speaker:'Zhinchi',text:'Domingo Quispe, vendrás conmigo. Tendrás que explicar quién te entregó este documento.'},
  {phase:'resolucion',speaker:'Domingo Quispe',text:'Capitán... yo solo cumplía órdenes.'},
  {phase:'resolucion',speaker:'Zhinchi',text:'Entonces podrás demostrarlo en tu declaración. No volverás a detener a nadie por esta orden.'},
  {phase:'resolucion',speaker:'Zhinchi',text:'Xervias, me ocuparé del detenido y del papeleo. Espérame cuando termine. Quiero que me acompañes.'},
  {phase:'resolucion',speaker:'Xervias',text:'¡Sí, capitán!'},
  {phase:'reflexion',speaker:'Crónica',text:'La familia se aleja a salvo. El capitán se marcha con el guardia. Xervias queda solo frente a la plaza.'},
  {phase:'reflexion',speaker:'Xervias',text:'Un sello falso... y, sin embargo, parecía auténtico a simple vista.'},
  {phase:'reflexion',speaker:'Xervias',text:'¿Quién podría hacer algo así? ¿Y cuántas órdenes más habrán sido alteradas?'},
] as const;

function checkpoint() {
  try {
    const raw=getCampaignStorage()?.getItem(PROLOGUE_CHECKPOINT_KEY);
    if (!raw) return {beat:0,duel:0,after:0};
    const p=JSON.parse(raw) as {beat:number;duel:number;after:number};
    return {
      beat:Number.isInteger(p.beat)?Math.max(0,Math.min(OPENING_BEATS.length+2,p.beat)):0,
      duel:Number.isInteger(p.duel)?Math.max(0,Math.min(GUIDED_STEPS.length-1,p.duel)):0,
      after:Number.isInteger(p.after)?Math.max(0,Math.min(AFTER_DUEL_BEATS.length-1,p.after)):0,
    };
  } catch {return {beat:0,duel:0,after:0};}
}

const portraits: Record<string,string> = {
  Xervias:'./retratos/jugador.webp',
  'Domingo Quispe':'./campania/arte/retratos/rival-01-domingo-quispe.webp',
  Zhinchi:'./retratos/rival.webp',
  Madre:'./campania/escenas/familia-suplicando.svg',
};
const phaseTitles: Record<string,string> = {
  desenlace:'El precio de la victoria',
  zhinchi:'La llegada del capitán',
  cetro:'El sello bajo sospecha',
  resolucion:'Una decisión justa',
  reflexion:'El misterio continúa',
};

const CampaignOpening:React.FC=()=>{
  const navigate=useNavigate();
  const [query]=useSearchParams();
  const saved=React.useMemo(checkpoint,[]);
  const override=query.get('escena');
  const startBeat=React.useMemo(()=>{
    if(override==='duelo')return OPENING_BEATS.length;
    if(override==='fin')return OPENING_BEATS.length+2;
    if(override==='desenlace'||override==='zhinchi'||override==='cetro'||override==='resolucion'||override==='reflexion')
      return OPENING_BEATS.length+1;
    if(override){const index=OPENING_BEATS.findIndex(x=>x.scene===override);if(index>=0)return index;}
    return saved.beat;
  },[override,saved.beat]);
  const [beat,setBeat]=React.useState(startBeat);
  // Combat returns to the beginning of the real board if the player leaves mid-duel.
  const duel=0;
  const initialAfter=override && ['desenlace','zhinchi','cetro','resolucion','reflexion'].includes(override)
    ? Math.max(0,AFTER_DUEL_BEATS.findIndex(x=>x.phase===override)) : override?0:saved.after;
  const [after,setAfter]=React.useState(initialAfter);
  // React Router can reuse this screen when only ?escena= changes.
  // QA jumps must update both the story phase and its dialogue index.
  React.useEffect(()=>{
    if(!override)return;
    if(override==='fin'){
      setBeat(OPENING_BEATS.length+2);
      setAfter(0);
      return;
    }
    if(override==='duelo'){
      setBeat(OPENING_BEATS.length);
      setAfter(0);
      return;
    }
    if(['desenlace','zhinchi','cetro','resolucion','reflexion'].includes(override)){
      const target=AFTER_DUEL_BEATS.findIndex(item=>item.phase===override);
      if(target>=0){
        setBeat(OPENING_BEATS.length+1);
        setAfter(target);
      }
      return;
    }
    const target=OPENING_BEATS.findIndex(item=>item.scene===override);
    if(target>=0){
      setBeat(target);
      setAfter(0);
    }
  },[override]);
  const [artReady,setArtReady]=React.useState(false);
  const [v2Ready,setV2Ready]=React.useState(false);
  const {playSound}=useAudio();
  React.useEffect(()=>{
    if(typeof fetch!=='function')return;
    const controller=new AbortController();
    fetch(prologueArtManifestUrl(),{signal:controller.signal,cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(m=>{if(!controller.signal.aborted)setArtReady(isPrologueArtManifest(m));})
      .catch(()=>{/* Original art remains fully functional until complete generation. */});
    return ()=>controller.abort();
  },[]);
  React.useEffect(()=>{
    const controller=new AbortController();
    fetch(prologueV2ManifestUrl(),{signal:controller.signal,cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(m=>{if(!controller.signal.aborted)setV2Ready(isV2Complete(m));})
      .catch(()=>{/* Keep original assets until v2 is complete. */});
    return ()=>controller.abort();
  },[]);
  React.useEffect(()=>{
    try{getCampaignStorage()?.setItem(PROLOGUE_CHECKPOINT_KEY,JSON.stringify({beat,duel,after}));}
    catch{/* Private browsing may disable storage. */}
  },[beat,duel,after]);
  const art=(id:PrologueArtId,fallback:string)=>artReady?prologueArtUrl(id):fallback;
  const v2art=(id:V2ArtId,fallback:string)=>v2Ready?prologueV2Url(id):fallback;
  const finish=()=>{
    const store=getCampaignStorage();
    const progress=loadCampaignProgress(store);
    saveCampaignProgress(store,awardMissionStars(progress,'01',3));
    try{store?.setItem(PROLOGUE_COMPLETE_KEY,'1');}catch{/* optional storage */}
    setBeat(OPENING_BEATS.length+2);
  };
  const prologue=beat<OPENING_BEATS.length?OPENING_BEATS[beat]:null;
  const isBattle=beat===OPENING_BEATS.length;
  const isAfter=beat===OPENING_BEATS.length+1;
  const isFinal=beat>=OPENING_BEATS.length+2;
  const story=isAfter?AFTER_DUEL_BEATS[after]:prologue;
  const scene=prologue?.scene??(isBattle?'duelo':isFinal?'fin':AFTER_DUEL_BEATS[after]?.phase??'desenlace');
  const speaker=story?.speaker??'';
  const xervias=art(scene==='anillo'?'X02':scene==='reflexion'?'X04':scene==='desafio'?'X01':'X01',portraits.Xervias);
  // Domingo is a distinct character. Pointing is reserved for the mocking reply,
  // never for the beginning of the arrest, and he never holds standard cards.
  const domingoPose:V2ArtId=scene==='desenlace'?'D04':
    scene==='desafio'&&beat===11?'D03':
    (scene==='desafio'||scene==='revision'||scene==='anillo')?'D02':'D01';
  const domingoFallback=art(
    domingoPose==='D04'?'D04':domingoPose==='D03'?'D02':domingoPose==='D02'?'D03':'D01',
    portraits['Domingo Quispe']
  );
  const domingo=v2art(domingoPose,domingoFallback);
  const domingoDuelPortrait=v2art('D05',portraits['Domingo Quispe']);
  const zhinchi=art(scene==='cetro'?(after===13?'Z02':'Z03'):scene==='resolucion'?'Z04':'Z01',portraits.Zhinchi);
  const mother=art(scene==='arresto'?'M02':scene==='desenlace'?'M03':scene==='resolucion'?'M04':'M01',portraits.Madre);
  const isInvocationShot=scene==='anillo' && story?.speaker==='Xervias' && story.text.includes('¡Activo el DECRETO REAL!');
  const isCounterInvocationShot=scene==='anillo' && story?.speaker==='Domingo Quispe' && story.text.startsWith('¡Muy bien!');
  const isVersus=scene==='versus';
  const isScepterShot=scene==='cetro' && (after===14||after===15);
  // Existing first background contains a person and is deliberately retired.
  const background=scene==='pergamino'?v2art('F01',art('F02','./escenarios/plaza-virreinal-v2.svg')):
    isInvocationShot?art('P02','./escenarios/plaza-virreinal-v2.svg'):
    isScepterShot?art('P03','./escenarios/plaza-virreinal-v2.svg'):
    art('F02','./escenarios/plaza-virreinal-v2.svg');
  type Actor={id:'Xervias'|'Zhinchi'|'Domingo Quispe'|'Madre';src:string;child?:boolean};
  const actors:Actor[]=[];
  const add=(id:Actor['id'],src:string,child=false)=>actors.push({id,src,child});
  if(scene==='arresto'){add('Madre',mother,true);add('Domingo Quispe',domingo);}
  else if(['xervias','revision','desafio'].includes(scene)){
    if(speaker==='Madre'){add('Madre',mother,true);add('Xervias',xervias);}
    else{add('Xervias',xervias);add('Domingo Quispe',domingo);}
  }
  else if(scene==='anillo'&&!isInvocationShot){add('Xervias',xervias);add('Domingo Quispe',domingo);}
  else if(scene==='desenlace'){
    if(speaker==='Madre'){add('Madre',mother,true);add('Domingo Quispe',domingo);}
    else{add('Xervias',xervias);add('Domingo Quispe',domingo);}
  }
  else if(scene==='zhinchi'){
    if(speaker==='Zhinchi'&&after===9){add('Xervias',xervias);add('Domingo Quispe',domingo);}
    else{add('Xervias',xervias);add('Zhinchi',zhinchi);}
  }
  else if(scene==='cetro'&&!isScepterShot){add('Xervias',xervias);add('Zhinchi',zhinchi);}
  else if(scene==='resolucion'){
    if(speaker==='Madre'){add('Madre',mother,true);add('Zhinchi',zhinchi);}
    else if(speaker==='Domingo Quispe'){add('Domingo Quispe',domingo);add('Zhinchi',zhinchi);}
    else{add('Xervias',xervias);add('Zhinchi',zhinchi);}
  }
  else if(scene==='reflexion'&&speaker==='Xervias'){add('Xervias',xervias);}
  const quickBubble=prologue?.scene==='arresto'&&beat===1?'¡Por favor!':
    scene==='xervias'&&speaker==='Xervias'&&beat===4?'¡Un momento!':
    scene==='desafio'&&speaker==='Domingo Quispe'&&story?.text.startsWith('¡Silencio!')?'¡Silencio!':
    scene==='zhinchi'&&after===9?'¡Alto!':null;
  const quickBubbleSide=quickBubble==='¡Alto!'?'right':
    speaker==='Domingo Quispe'?'right':'left';
  const dialogueTone=speaker==='Crónica'?'narrator':
    scene==='reflexion'&&speaker==='Xervias'?'thought':'character';
  const advance=()=>{
    playSound('CLICK');
    if(isAfter){if(after===AFTER_DUEL_BEATS.length-1)finish();else setAfter(i=>i+1);}
    else if(!isFinal)setBeat(i=>i+1);
  };
  return <main className={'dcop-screen dcop-'+scene} aria-label="Prólogo de campaña: El Sello Real">
    <div className="dcop-stage">
      {!isBattle&&!isFinal&&<CampaignPauseMenu/>}
      {!isFinal&&!isBattle&&<div className="dcop-art" aria-hidden="true">
        <img className="dcop-backdrop" src={background} alt=""/>
        {scene==='pergamino'&&<div className="dcop-scroll-held">
          {artReady&&<img className="dcop-scroll-illustration" src={prologueArtUrl('P01')} alt=""/>}
          <div className={'dcop-parchment'+(artReady?' dcop-parchment-overlay':'')}>
            <span>† CORONA SOLAR †</span><b>POR ORDEN DE LA CORONA</b>
            <p>Dos órdenes opuestas.<br/>Un mismo Sello Real.<br/>¿Cuál dice la verdad?</p>
            {!artReady&&<div className="dcop-wax">✷</div>}
          </div>
          {!artReady&&<><div className="dcop-hand left"/><div className="dcop-hand right"/></>}
        </div>}
        {actors.length>0&&<div className={'dcop-scene-figures dcop-cast-'+actors.length}>
          {actors.map(actor=><div key={actor.id}
            className={(actor.id==='Xervias'?'dcop-hero':actor.id==='Madre'?'dcop-civil':'dcop-guard')+
              ' '+(actor.id===speaker?'dcop-speaking':'dcop-dim')}>
            <img src={actor.src} alt=""/>
            {actor.child&&artReady&&<img className="dcop-child-sprite"
              src={prologueArtUrl(scene==='resolucion'?'N02':'N01')} alt=""/>}
          </div>)}
        </div>}
        {isInvocationShot&&<div className="dcop-invocation-shimmer" data-testid="xervias-golden-invocation">
          <img className="dcop-summoned-card" src={INVOCATION_CARD_URL} alt=""/>
        </div>}
        {isCounterInvocationShot&&<div className="dcop-counter-invocation" data-testid="domingo-golden-invocation">
          <img className="dcop-royal-invocation-card" src={INVOCATION_CARD_URL} alt=""/>
          <span className="dcop-counter-aura" aria-hidden="true"/>
        </div>}
        {isVersus&&<div className="dcop-versus" data-testid="cinematic-versus">
          <div className="dcop-versus-side dcop-versus-xervias">
            <img src={portraits.Xervias} alt=""/><strong>XERVIAS</strong>
          </div>
          <div className="dcop-versus-mark" aria-hidden="true">VS</div>
          <div className="dcop-versus-side dcop-versus-domingo">
            <img src={domingoDuelPortrait} alt=""/><strong>DOMINGO QUISPE</strong>
          </div>
        </div>}
        {quickBubble&&<div className={'dcop-quick-bubble '+quickBubbleSide}>{quickBubble}</div>}
      </div>}
      {isFinal?<section className="dcop-final-screen">
        <h1>Fin del Prólogo</h1>
        <button type="button" onClick={()=>navigate('/')}>Volver al menú</button>
      </section>:
      isBattle?<GameBoard guidedOpening
        onReturn={()=>navigate('/')}
        onOutcome={(result)=>{if(result.won){setBeat(OPENING_BEATS.length+1);setAfter(0);}}}
        presentation={{background:art('F02','./escenarios/plaza-virreinal-v2.svg'),backgroundVideo:null,
          playerPortrait:portraits.Xervias,opponentPortrait:domingoDuelPortrait}}/>:
      <StoryDialogue
        beatKey={isAfter?'desenlace-'+after:'apertura-'+beat}
        sceneTitle={isAfter?phaseTitles[scene]??'El precio de la victoria':prologue?.title??'Prólogo'}
        speaker={speaker}
        text={story?.text??''}
        tone={dialogueTone}
        progress={isAfter?'DESENLACE '+(after+1)+'/'+AFTER_DUEL_BEATS.length:
          'ESCENA '+(beat+1)+'/'+OPENING_BEATS.length}
        lastBeforeDuel={beat===OPENING_BEATS.length-1}
        onAdvance={advance}/>
      }
    </div>
  </main>;
};
export default CampaignOpening;
