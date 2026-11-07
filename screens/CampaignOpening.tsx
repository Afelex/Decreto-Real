import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { awardMissionStars, loadCampaignProgress, saveCampaignProgress } from '../campaign/campaign';
import { getCampaignStorage, isCampaignQaAvailable } from '../campaign/campaignQA';
import {
  readStudioDocument,saveStudioDocument,parseStudioDocument,withStudioTransform,withoutStudioTransform,
  withStudioSettings,withStudioAsset,addStudioExtra,removeStudioExtra,withStudioExtraTransform,withStudioExtraAsset,
  getStudioTransform,studioSceneKey,STUDIO_ACTORS,
  type StudioActor,type StudioTransform,type StudioDocument,type StudioExtra
} from '../campaign/studioLayout';
import {
  addStudioMedia,loadStudioMediaUrls,revokeStudioMediaUrls,exportStudioMedia,
  importStudioMedia,type StudioPortableMedia
} from '../campaign/studioMedia';
import DecretoRealStudioPanel from './DecretoRealStudioPanel';
import GameBoard from './GameBoard';
import { GUIDED_STEPS } from '../campaign/guidedOpeningDuel';
import { useAudio } from '../contexts/AudioContext';
import CampaignPauseMenu from './CampaignPauseMenu';
import { isPrologueArtManifest, prologueArtManifestUrl, prologueArtUrl, PROLOGUE_COMPLETE_KEY, type PrologueArtId } from '../campaign/prologueArt';
import StoryDialogue from './StoryDialogue';
import { prologueV2Url, prologueV2ManifestUrl, isV2Complete, INVOCATION_CARD_URL, type V2ArtId } from '../campaign/prologueV2';
import { prologueV3Url, prologueV3ManifestUrl, isV3Complete, type V3ArtId } from '../campaign/prologueV3';
import './campaign-opening.css';
import './story-dialogue.css';
import './prologue-v2.css';
import './prologue-v3.css';

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
  const studioEnabled=isCampaignQaAvailable()&&query.get('studio')==='1';
  const studioRawStep=query.get('studioStep');
  const parsedStudioStep=studioRawStep===null?NaN:Number(studioRawStep);
  const studioStep=studioEnabled&&Number.isInteger(parsedStudioStep)&&parsedStudioStep>=0&&
    parsedStudioStep<OPENING_BEATS.length+AFTER_DUEL_BEATS.length?parsedStudioStep:null;
  const previewRaw=query.get('previewStep');
  const parsedPreview=previewRaw===null?NaN:Number(previewRaw);
  const previewStep=isCampaignQaAvailable()&&Number.isInteger(parsedPreview)&&
    parsedPreview>=0&&parsedPreview<OPENING_BEATS.length+AFTER_DUEL_BEATS.length?parsedPreview:null;
  const forcedStep=studioStep??previewStep;
  const startBeat=React.useMemo(()=>{
    if(forcedStep!==null)return forcedStep<OPENING_BEATS.length?forcedStep:OPENING_BEATS.length+1;
    if(override==='duelo')return OPENING_BEATS.length;
    if(override==='fin')return OPENING_BEATS.length+2;
    if(override==='desenlace'||override==='zhinchi'||override==='cetro'||override==='resolucion'||override==='reflexion')
      return OPENING_BEATS.length+1;
    if(override){const index=OPENING_BEATS.findIndex(x=>x.scene===override);if(index>=0)return index;}
    return saved.beat;
  },[override,saved.beat,forcedStep]);
  const [beat,setBeat]=React.useState(startBeat);
  // Combat returns to the beginning of the real board if the player leaves mid-duel.
  const duel=0;
  const initialAfter=forcedStep!==null&&forcedStep>=OPENING_BEATS.length
    ? forcedStep-OPENING_BEATS.length : override && ['desenlace','zhinchi','cetro','resolucion','reflexion'].includes(override)
    ? Math.max(0,AFTER_DUEL_BEATS.findIndex(x=>x.phase===override)) : override?0:saved.after;
  const [after,setAfter]=React.useState(initialAfter);
  // React Router can reuse this screen when only ?escena= changes.
  // QA jumps must update both the story phase and its dialogue index.
  React.useEffect(()=>{
    if(forcedStep!==null){
      setBeat(forcedStep<OPENING_BEATS.length?forcedStep:OPENING_BEATS.length+1);
      setAfter(forcedStep>=OPENING_BEATS.length?forcedStep-OPENING_BEATS.length:0);
      return;
    }
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
  },[override,forcedStep]);
  const [artReady,setArtReady]=React.useState(false);
  const [v2Ready,setV2Ready]=React.useState(false);
  const [v3Ready,setV3Ready]=React.useState(false);
  const [studioDoc,setStudioDoc]=React.useState<StudioDocument>(readStudioDocument);
  const [studioSaved,setStudioSaved]=React.useState(()=>JSON.stringify(readStudioDocument()));
  const [studioSelected,setStudioSelected]=React.useState<string|null>(null);
  const [mediaUrls,setMediaUrls]=React.useState<Record<string,string>>({});
  const mediaIds=Object.keys(studioDoc.assets??{}).sort().join('|');
  React.useEffect(()=>{
    if(!isCampaignQaAvailable())return;
    let cancelled=false;
    let urls:Record<string,string>={};
    void loadStudioMediaUrls(mediaIds?mediaIds.split('|'):[])
      .then(next=>{urls=next;if(cancelled)revokeStudioMediaUrls(next);else setMediaUrls(next);})
      .catch(()=>setStudioStatus('No se pudieron cargar algunos archivos locales.'));
    return ()=>{cancelled=true;revokeStudioMediaUrls(urls);};
  },[mediaIds]);
  const [studioHistory,setStudioHistory]=React.useState<StudioDocument[]>([]);
  const [studioStatus,setStudioStatus]=React.useState('');
  const studioDrag=React.useRef<{actor:string;pointerId:number;startX:number;startY:number;origin:StudioTransform}|null>(null);
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
    const controller=new AbortController();
    fetch(prologueV3ManifestUrl(),{signal:controller.signal,cache:'no-store'})
      .then(r=>r.ok?r.json():null)
      .then(m=>{if(!controller.signal.aborted)setV3Ready(isV3Complete(m));})
      .catch(()=>{/* Keep existing sprites until the six PNG assets are complete. */});
    return ()=>controller.abort();
  },[]);
  React.useEffect(()=>{
    if(studioEnabled||previewStep!==null)return; // Studio preview must not alter the player's progress.
    try{getCampaignStorage()?.setItem(PROLOGUE_CHECKPOINT_KEY,JSON.stringify({beat,duel,after}));}
    catch{/* Private browsing may disable storage. */}
  },[beat,duel,after,studioEnabled,previewStep]);
  const art=(id:PrologueArtId,fallback:string)=>artReady?prologueArtUrl(id):fallback;
  const v2art=(id:V2ArtId,fallback:string)=>v2Ready?prologueV2Url(id):fallback;
  const v3art=(id:V3ArtId,fallback:string)=>v3Ready?prologueV3Url(id):fallback;
  const finish=()=>{
    if(previewStep!==null){setBeat(OPENING_BEATS.length+2);return;}
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
  // Beat 16: only the ring emits energy; no invocation card or card silhouette.
  const isRingOnlyShot=scene==='anillo'&&beat===15;
  const xervias=isRingOnlyShot
    ? v3art('X05',art('X01',portraits.Xervias))
    : art(scene==='anillo'?'X02':scene==='reflexion'?'X04':scene==='desafio'?'X01':'X01',portraits.Xervias);
  // Domingo is a distinct character. Pointing is reserved for the mocking reply,
  // never for the beginning of the arrest, and he never holds standard cards.
  const domingoPose:V2ArtId=scene==='desenlace'?'D04':
    scene==='desafio'&&beat===11?'D03':
    (scene==='desafio'||scene==='revision'||scene==='anillo')?'D02':'D01';
  const domingoFallback=art(
    domingoPose==='D04'?'D04':domingoPose==='D03'?'D02':domingoPose==='D02'?'D03':'D01',
    portraits['Domingo Quispe']
  );
  const domingoNormal=v2art(domingoPose,domingoFallback);
  // Beat 15: furious Domingo. Beat 20: his single card is INSIDE his fighting PNG.
  const domingo=scene==='desafio'&&beat===14
    ? v3art('D07',domingoNormal)
    : scene==='anillo'&&beat===19
      ? v3art('D08',domingoNormal)
      : domingoNormal;
  const domingoDuelPortrait=v2art('D05',portraits['Domingo Quispe']);
  const zhinchi=art(scene==='cetro'?(after===13?'Z02':'Z03'):scene==='resolucion'?'Z04':'Z01',portraits.Zhinchi);
  const mother=art(scene==='arresto'?'M02':scene==='desenlace'?'M03':scene==='resolucion'?'M04':'M01',portraits.Madre);
  const isInvocationShot=scene==='anillo' && story?.speaker==='Xervias' && story.text.includes('¡Activo el DECRETO REAL!');
  const isCounterInvocationShot=scene==='anillo' && story?.speaker==='Domingo Quispe' && story.text.startsWith('¡Muy bien!');
  const isVersus=scene==='versus';
  const isScepterShot=scene==='cetro' && (after===14||after===15);
  // Existing first background contains a person and is deliberately retired.
  const cleanPlaza=v2art('F02',art('F02','./escenarios/plaza-virreinal-v2.svg'));
  const background=scene==='pergamino'?v2art('F01',cleanPlaza):
    isInvocationShot?art('P02',cleanPlaza):
    isScepterShot?art('P03',cleanPlaza):
    cleanPlaza;
  type Actor={id:'Xervias'|'Zhinchi'|'Domingo Quispe'|'Madre';src:string;child?:boolean};
  const actors:Actor[]=[];
  const add=(id:Actor['id'],src:string,child=false)=>actors.push({id,src,child});
  if(scene==='arresto'){add('Madre',mother,true);add('Domingo Quispe',domingo);}
  else if(['xervias','revision','desafio'].includes(scene)){
    if(speaker==='Madre'){add('Xervias',xervias);add('Madre',mother,true);}
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
  const studioKey=studioSceneKey(isAfter?'after':'opening',isAfter?after:beat);
  const studioExtras=studioDoc.extras?.[studioKey]??[];
  const studioActors:string[]=[...actors.flatMap(actor=>actor.child?
    [actor.id,'Niño' as const]:[actor.id]),...studioExtras.map(extra=>extra.id)];
  const studioActorLabels:Record<string,string>=Object.fromEntries(studioExtras.map(extra=>
    [extra.id,extra.name+' · '+(extra.kind==='effect'?'Efecto':'Sprite')]));
  const isNativeActor=(id:string):id is StudioActor=>(STUDIO_ACTORS as readonly string[]).includes(id);
  const studioVisibleSelection=studioSelected&&studioActors.includes(studioSelected)?studioSelected:null;
  const studioDirty=JSON.stringify(studioDoc)!==studioSaved;
  const studioSceneSettings=isCampaignQaAvailable()?studioDoc.settings?.[studioKey]:undefined;
  const bubbleVisible=studioSceneSettings?.bubbleVisible!==false;
  const titleVisible=studioSceneSettings?.titleVisible!==false;
  const currentLayout=(actor:StudioActor)=>isCampaignQaAvailable()?studioDoc.scenes[studioKey]?.[actor]:undefined;
  const currentExtra=(id:string)=>studioExtras.find(x=>x.id===id);
  const currentTransform=(id:string):StudioTransform|null=>{
    if(isNativeActor(id))return getStudioTransform(studioDoc,studioKey,id);
    return currentExtra(id)?.transform??null;
  };
  const mediaSource=(id:string|undefined,fallback:string)=>id?(mediaUrls[id]??fallback):fallback;
  const studioStyle=(actor:StudioActor):React.CSSProperties|undefined=>{
    const layout=currentLayout(actor);
    if(!layout)return undefined;
    return {
      '--studio-x':layout.x+'vw','--studio-y':layout.y+'vh',
      '--studio-scale':layout.scale,'--studio-mirror':layout.mirror?-1:1,
      '--studio-layer':layout.layer,
    } as React.CSSProperties;
  };
  const extraStyle=(extra:StudioExtra):React.CSSProperties=>({
    '--studio-x':extra.transform.x+'vw','--studio-y':extra.transform.y+'vh',
    '--studio-scale':extra.transform.scale,
    '--studio-mirror':extra.transform.mirror?-1:1,
    '--studio-layer':extra.transform.layer,
  } as React.CSSProperties);
  const studioClass=(actor:StudioActor)=>(currentLayout(actor)?' dcop-studio-adjusted':'')+
    (studioEnabled&&studioVisibleSelection===actor?' dcop-studio-selected':'')+
    (currentLayout(actor)?.visible===false?' dcop-studio-hidden':'');
  const pushStudioHistory=()=>{
    setStudioHistory(items=>[...items.slice(-24),studioDoc]);
  };
  const changeStudioTarget=(id:string,next:StudioTransform)=>{
    pushStudioHistory();
    setStudioDoc(doc=>isNativeActor(id)?
      withStudioTransform(doc,studioKey,id,next):
      withStudioExtraTransform(doc,studioKey,id,next));
    setStudioStatus('Cambios sin guardar');
  };
  const startStudioDrag=(event:React.PointerEvent<HTMLElement>,actor:string)=>{
    if(!studioEnabled)return;
    const origin=currentTransform(actor);
    if(!origin)return;
    event.preventDefault();event.stopPropagation();
    setStudioSelected(actor);
    pushStudioHistory();
    studioDrag.current={
      actor,pointerId:event.pointerId,startX:event.clientX,startY:event.clientY,origin,
    };
    event.currentTarget.setPointerCapture(event.pointerId);
  };
  const moveStudioDrag=(event:React.PointerEvent<HTMLElement>,actor:string)=>{
    const drag=studioDrag.current;
    if(!studioEnabled||!drag||drag.pointerId!==event.pointerId||drag.actor!==actor)return;
    event.preventDefault();event.stopPropagation();
    const next={...drag.origin,
      x:drag.origin.x+100*(event.clientX-drag.startX)/window.innerWidth,
      y:drag.origin.y+100*(event.clientY-drag.startY)/window.innerHeight,
    };
    setStudioDoc(doc=>isNativeActor(actor)?
      withStudioTransform(doc,studioKey,actor,next):
      withStudioExtraTransform(doc,studioKey,actor,next));
    setStudioStatus('Cambios sin guardar');
  };
  const endStudioDrag=(event:React.PointerEvent<HTMLElement>,actor:string)=>{
    if(studioDrag.current?.pointerId!==event.pointerId||studioDrag.current?.actor!==actor)return;
    studioDrag.current=null;
    if(event.currentTarget.hasPointerCapture(event.pointerId))
      event.currentTarget.releasePointerCapture(event.pointerId);
  };
  const saveBeforeNavigation=()=>{
    if(!studioDirty)return true;
    if(saveStudioDocument(studioDoc)){
      setStudioSaved(JSON.stringify(studioDoc));return true;
    }
    setStudioStatus('No se pudo guardar. Exporta tu proyecto como respaldo.');
    return false;
  };
  const studioNavigate=(next:number)=>{
    if(next<0||next>=OPENING_BEATS.length+AFTER_DUEL_BEATS.length)return;
    if(!saveBeforeNavigation())return;
    setStudioSelected(null);
    navigate('/campania/prologo?studio=1&studioStep='+next);
  };
  const studioSave=()=>{
    if(saveStudioDocument(studioDoc)){
      setStudioSaved(JSON.stringify(studioDoc));
      setStudioStatus('Borrador guardado en este dispositivo');
    }else setStudioStatus('No se pudo guardar. Exporta el proyecto.');
  };
  const studioDownload=(name:string,body:string)=>{
    const blob=new Blob([body],{type:'application/json'});
    const url=URL.createObjectURL(blob);
    const link=document.createElement('a');
    link.href=url;link.download=name;
    document.body.appendChild(link);link.click();link.remove();
    window.setTimeout(()=>URL.revokeObjectURL(url),1000);
  };
  const studioExport=async()=>{
    try{
      setStudioStatus('Preparando respaldo con imágenes y videos…');
      const media=await exportStudioMedia(Object.keys(studioDoc.assets??{}));
      studioDownload('decreto-real-studio-proyecto.json',
        JSON.stringify({studioPackage:2,document:studioDoc,media},null,2));
      setStudioStatus('Proyecto completo exportado con sus archivos multimedia.');
    }catch(err){setStudioStatus(err instanceof Error?err.message:'Error al exportar.');}
  };
  const studioImport=async(file:File)=>{
    try{
      if(file.size>100_000_000)throw new Error('Archivo demasiado grande (máximo 100 MB).');
      const payload:unknown=JSON.parse(await file.text());
      if(payload&&typeof payload==='object'&&(payload as {studioPackage?:number}).studioPackage===2){
        const pack=payload as {document:unknown;media:StudioPortableMedia[]};
        const parsed=parseStudioDocument(JSON.stringify(pack.document));
        if(!Array.isArray(pack.media))throw new Error('Faltan los recursos multimedia.');
        await importStudioMedia(pack.media);
        pushStudioHistory();setStudioDoc(parsed);
      }else{
        const parsed=parseStudioDocument(JSON.stringify(payload));
        pushStudioHistory();setStudioDoc(parsed);
      }
      setStudioSelected(null);
      setStudioStatus('Proyecto importado. Revisa las escenas y pulsa Guardar.');
    }catch(err){setStudioStatus(err instanceof Error?err.message:'No se pudo importar.');}
  };
  const studioUndo=()=>{
    const prev=studioHistory[studioHistory.length-1];if(!prev)return;
    setStudioDoc(prev);setStudioHistory(h=>h.slice(0,-1));setStudioStatus('Última modificación deshecha');
  };
  const studioRestore=()=>{
    if(!studioVisibleSelection)return;
    pushStudioHistory();
    setStudioDoc(doc=>isNativeActor(studioVisibleSelection)?
      withoutStudioTransform(doc,studioKey,studioVisibleSelection):
      withStudioExtraTransform(doc,studioKey,studioVisibleSelection,{
        x:0,y:0,scale:1,mirror:false,layer:8,visible:true,
      }));
    setStudioStatus('Elemento restaurado');
  };
  const studioRemove=()=>{
    if(!studioVisibleSelection)return;
    pushStudioHistory();
    setStudioDoc(doc=>isNativeActor(studioVisibleSelection)?
      withStudioTransform(doc,studioKey,studioVisibleSelection,{
        ...getStudioTransform(doc,studioKey,studioVisibleSelection),visible:false,
      }):removeStudioExtra(doc,studioKey,studioVisibleSelection));
    if(!isNativeActor(studioVisibleSelection))setStudioSelected(null);
    setStudioStatus('Elemento oculto o retirado de esta intervención');
  };
  const studioStoreFile=async(file:File)=>{
    const record=await addStudioMedia(file);
    setStudioDoc(doc=>withStudioAsset(doc,record.id,{name:record.name,mime:record.mime}));
    return record;
  };
  const studioReplace=async(file:File)=>{
    try{
      if(!studioVisibleSelection)throw new Error('Selecciona primero un personaje o un sprite.');
      if(!file.type.startsWith('image/'))throw new Error('Un personaje requiere una imagen PNG, WebP, JPG o GIF.');
      const record=await studioStoreFile(file);
      pushStudioHistory();
      const target=studioVisibleSelection;
      setStudioDoc(doc=>isNativeActor(target)?
        withStudioTransform(doc,studioKey,target,{
          ...getStudioTransform(doc,studioKey,target),assetId:record.id,visible:true,
        }):withStudioExtraAsset(doc,studioKey,target,record.id));
      setStudioStatus('Imagen reemplazada. Guarda el borrador para conservarla.');
    }catch(err){setStudioStatus(err instanceof Error?err.message:'No se pudo reemplazar la imagen.');}
  };
  const studioAdd=async(file:File,kind:'image'|'effect')=>{
    try{
      if(kind==='image'&&!file.type.startsWith('image/'))
        throw new Error('Un sprite debe ser PNG, WebP, JPG o GIF.');
      const record=await studioStoreFile(file);
      const item:StudioExtra={
        id:'extra-'+crypto.randomUUID(),name:file.name.slice(0,100),assetId:record.id,kind,
        transform:{x:0,y:0,scale:1,mirror:false,layer:kind==='effect'?9:8,visible:true},
      };
      pushStudioHistory();
      setStudioDoc(doc=>addStudioExtra(doc,studioKey,item));
      setStudioSelected(item.id);
      setStudioStatus(kind==='effect'?'Efecto añadido. Puedes moverlo y escalarlo.':
        'Sprite añadido. Puedes moverlo y escalarlo.');
    }catch(err){setStudioStatus(err instanceof Error?err.message:'No se pudo añadir el archivo.');}
  };
  const studioBackdrop=async(file:File)=>{
    try{
      const record=await studioStoreFile(file);
      pushStudioHistory();
      setStudioDoc(doc=>withStudioSettings(doc,studioKey,{backgroundAsset:record.id}));
      setStudioStatus('Fondo cambiado solo en esta intervención.');
    }catch(err){setStudioStatus(err instanceof Error?err.message:'No se pudo cambiar el fondo.');}
  };
  const studioClearBackdrop=()=>{
    pushStudioHistory();setStudioDoc(doc=>withStudioSettings(doc,studioKey,{backgroundAsset:undefined}));
    setStudioStatus('Fondo original restaurado.');
  };
  const studioToggleBubble=()=>{
    pushStudioHistory();
    setStudioDoc(doc=>withStudioSettings(doc,studioKey,{
      bubbleVisible:doc.settings?.[studioKey]?.bubbleVisible===false,
    }));
  };
  const studioToggleTitle=()=>{
    pushStudioHistory();
    setStudioDoc(doc=>withStudioSettings(doc,studioKey,{
      titleVisible:doc.settings?.[studioKey]?.titleVisible===false,
    }));
  };
  const studioPreview=()=>{
    if(!saveBeforeNavigation())return;
    const currentIndex=isAfter?OPENING_BEATS.length+after:beat;
    navigate('/campania/prologo?previewStep='+currentIndex);
  };
  const studioExit=studioPreview;
  const backgroundAsset=studioSceneSettings?.backgroundAsset;
  const renderedBackdrop=mediaSource(backgroundAsset,background);
  const backdropIsVideo=Boolean(backgroundAsset&&studioDoc.assets?.[backgroundAsset]?.mime.startsWith('video/'));
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
  return <main className={'dcop-screen dcop-'+scene+(studioEnabled?' dcop-studio-mode':'')} aria-label="Prólogo de campaña: El Sello Real">
    <div className="dcop-stage">
      {!isBattle&&!isFinal&&!studioEnabled&&<CampaignPauseMenu/>}
      {!isBattle&&!isFinal&&previewStep!==null&&!studioEnabled&&
        <button type="button" className="dcop-studio-return" data-testid="studio-return"
          onClick={()=>navigate('/campania/prologo?studio=1&studioStep='+
            (isAfter?OPENING_BEATS.length+after:beat))}>
          ✎ Volver a Studio
        </button>}
      {!isFinal&&!isBattle&&<div className="dcop-art" aria-hidden="true">
        {backdropIsVideo?<video className="dcop-backdrop" src={renderedBackdrop}
          autoPlay muted loop playsInline data-testid="studio-video-background"/>:
          <img className="dcop-backdrop" src={renderedBackdrop} alt=""/>}
        {scene==='pergamino'&&<div className="dcop-scroll-held">
          {artReady&&<img className="dcop-scroll-illustration" src={prologueArtUrl('P01')} alt=""/>}
          <div className={'dcop-parchment'+(artReady?' dcop-parchment-overlay':'')}>
            <span>† CORONA SOLAR †</span><b>POR ORDEN DE LA CORONA</b>
            <p>Dos órdenes opuestas.<br/>Un mismo Sello Real.<br/>¿Cuál dice la verdad?</p>
            {!artReady&&<div className="dcop-wax">✷</div>}
          </div>
          {!artReady&&<><div className="dcop-hand left"/><div className="dcop-hand right"/></>}
        </div>}
        {actors.length>0&&<div className={'dcop-scene-figures dcop-cast-'+actors.length+
          (scene==='xervias'&&speaker==='Madre'?' dcop-family-right':'')}>
          {actors.map(actor=><div key={actor.id}
            className={(actor.id==='Xervias'?'dcop-hero':actor.id==='Madre'?'dcop-civil':'dcop-guard')+
              (actor.id==='Domingo Quispe'?' dcop-actor-domingo':'')+
              ' '+(actor.id===speaker?'dcop-speaking':'dcop-dim')+studioClass(actor.id)}
            style={studioStyle(actor.id)}
            onPointerDown={studioEnabled?event=>{
              if((event.target as HTMLElement).classList.contains('dcop-child-sprite'))return;
              startStudioDrag(event,actor.id);
            }:undefined}
            onPointerMove={studioEnabled?event=>moveStudioDrag(event,actor.id):undefined}
            onPointerUp={studioEnabled?event=>endStudioDrag(event,actor.id):undefined}
            onPointerCancel={studioEnabled?event=>endStudioDrag(event,actor.id):undefined}
            data-studio-actor={studioEnabled?actor.id:undefined}
            data-testid={actor.id==='Domingo Quispe'&&isCounterInvocationShot?'domingo-integrated-invocation':undefined}>
            <img src={mediaSource(currentLayout(actor.id)?.assetId,actor.src)} alt=""/>
            {actor.child&&(artReady||v3Ready)&&<img
              className={'dcop-child-sprite'+studioClass('Niño')}
              style={studioStyle('Niño')}
              data-studio-actor={studioEnabled?'Niño':undefined}
              onPointerDown={studioEnabled?event=>startStudioDrag(event,'Niño'):undefined}
              onPointerMove={studioEnabled?event=>moveStudioDrag(event,'Niño'):undefined}
              onPointerUp={studioEnabled?event=>endStudioDrag(event,'Niño'):undefined}
              onPointerCancel={studioEnabled?event=>endStudioDrag(event,'Niño'):undefined}
              src={mediaSource(currentLayout('Niño')?.assetId,scene==='resolucion'
                ? v3art('N04',art('N02',portraits.Madre))
                : v3art('N03',art('N01',portraits.Madre)))}
              alt=""/>}
            {actor.id==='Xervias'&&isRingOnlyShot&&!v3Ready&&<span className="dcop-ring-energy-fallback" aria-hidden="true"/>}
          </div>)}
        </div>}
        {isCampaignQaAvailable()&&studioExtras.map(extra=>{
          const src=mediaUrls[extra.assetId];
          const isVideo=studioDoc.assets?.[extra.assetId]?.mime.startsWith('video/');
          return <div key={extra.id}
            className={'dcop-studio-extra'+(studioEnabled&&studioVisibleSelection===extra.id?' dcop-studio-extra-selected':'')+
              (!extra.transform.visible?' dcop-studio-hidden':'')}
            style={extraStyle(extra)}
            data-testid="studio-added-layer"
            data-studio-actor={studioEnabled?extra.id:undefined}
            onPointerDown={studioEnabled?e=>startStudioDrag(e,extra.id):undefined}
            onPointerMove={studioEnabled?e=>moveStudioDrag(e,extra.id):undefined}
            onPointerUp={studioEnabled?e=>endStudioDrag(e,extra.id):undefined}
            onPointerCancel={studioEnabled?e=>endStudioDrag(e,extra.id):undefined}>
            {src&&(isVideo?
              <video src={src} autoPlay muted loop playsInline aria-label={extra.name}/>:
              <img src={src} alt={studioEnabled?extra.name:''}/>)}
          </div>;
        })}
        {isInvocationShot&&<div className="dcop-invocation-shimmer" data-testid="xervias-golden-invocation">
          <img className="dcop-summoned-card" src={v3art('G01',INVOCATION_CARD_URL)} alt=""/>
        </div>}
        {/* Domingo's ceremonial card is part of his transparent fighting sprite,
            never a floating card UI element hiding his face. */}
        {isVersus&&<div className="dcop-versus" data-testid="cinematic-versus">
          <div className="dcop-versus-side dcop-versus-xervias">
            <img src={portraits.Xervias} alt=""/><strong>XERVIAS</strong>
          </div>
          <div className="dcop-versus-mark" aria-hidden="true">VS</div>
          <div className="dcop-versus-side dcop-versus-domingo">
            <img src={domingoDuelPortrait} alt=""/><strong>DOMINGO QUISPE</strong>
          </div>
        </div>}
        {quickBubble&&bubbleVisible&&<div className={'dcop-quick-bubble '+quickBubbleSide}>{quickBubble}</div>}
      </div>}
      {studioEnabled&&studioStep!==null&&!isBattle&&!isFinal&&
        <DecretoRealStudioPanel
          sceneIndex={studioStep}
          total={OPENING_BEATS.length+AFTER_DUEL_BEATS.length}
          sceneOptions={[...OPENING_BEATS.map(item=>({label:item.speaker+' · '+item.title})),
            ...AFTER_DUEL_BEATS.map(item=>({label:item.speaker+' · '+(phaseTitles[item.phase]??item.phase)}))]}
          onJump={studioNavigate}
          title={story?.speaker+' · '+(prologue?.title??phaseTitles[scene]??'Desenlace')}
          sceneKey={studioKey}
          actors={studioActors}
          actorLabels={studioActorLabels}
          selected={studioVisibleSelection}
          transform={studioVisibleSelection?currentTransform(studioVisibleSelection):null}
          bubbleVisible={bubbleVisible}
          titleVisible={titleVisible}
          dirty={studioDirty}
          status={studioStatus}
          onSelect={setStudioSelected}
          onChange={t=>{if(studioVisibleSelection)changeStudioTarget(studioVisibleSelection,t);}}
          onSave={studioSave}
          onUndo={studioUndo}
          canUndo={studioHistory.length>0}
          onRestore={studioRestore}
          onRemove={studioRemove}
          onReplace={studioReplace}
          onAdd={studioAdd}
          onBackdrop={studioBackdrop}
          onClearBackdrop={studioClearBackdrop}
          onToggleBubble={studioToggleBubble}
          onToggleTitle={studioToggleTitle}
          onPreview={studioPreview}
          onPrev={()=>studioNavigate(studioStep-1)}
          onNext={()=>studioNavigate(studioStep+1)}
          onExport={studioExport}
          onImport={studioImport}
          onExit={studioExit}/>
      }
      {isFinal?<section className="dcop-final-screen">
        <h1>Fin del Prólogo</h1>
        <button type="button" onClick={()=>navigate('/')}>Volver al menú</button>
      </section>:
      isBattle?<GameBoard guidedOpening guidedNarrativeSprites={{player:art('X01',portraits.Xervias),opponent:domingo}}

        onReturn={()=>navigate('/')}
        onOutcome={(result)=>{if(result.won){setBeat(OPENING_BEATS.length+1);setAfter(0);}}}
        presentation={{background:cleanPlaza,backgroundVideo:null,
          playerPortrait:portraits.Xervias,opponentPortrait:domingoDuelPortrait}}/>:
      <StoryDialogue
        beatKey={isAfter?'desenlace-'+after:'apertura-'+beat}
        sceneTitle={isAfter?phaseTitles[scene]??'El precio de la victoria':prologue?.title??'Prólogo'}
        speaker={speaker}
        text={story?.text??''}
        tone={dialogueTone}
        showSceneTitle={titleVisible}
        progress={isAfter?'DESENLACE '+(after+1)+'/'+AFTER_DUEL_BEATS.length:
          'ESCENA '+(beat+1)+'/'+OPENING_BEATS.length}
        lastBeforeDuel={beat===OPENING_BEATS.length-1}
        onAdvance={studioEnabled?()=>{}:advance}/>
      }
    </div>
  </main>;
};
export default CampaignOpening;
