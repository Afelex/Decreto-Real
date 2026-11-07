import React from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { awardMissionStars, loadCampaignProgress, saveCampaignProgress } from '../campaign/campaign';
import { getCampaignStorage, isCampaignQaAvailable } from '../campaign/campaignQA';
import GameBoard from './GameBoard';
import { GUIDED_STEPS } from '../campaign/guidedOpeningDuel';
import { useAudio } from '../contexts/AudioContext';
import CampaignPauseMenu from './CampaignPauseMenu';
import { isPrologueArtManifest, prologueArtManifestUrl, prologueArtUrl, PROLOGUE_COMPLETE_KEY, type PrologueArtId } from '../campaign/prologueArt';
import StoryDialogue from './StoryDialogue';
import { prologueV2Url, prologueV2ManifestUrl, isV2Complete, INVOCATION_CARD_URL, type V2ArtId } from '../campaign/prologueV2';
import { prologueV3Url, prologueV3ManifestUrl, isV3Complete, type V3ArtId } from '../campaign/prologueV3';
import { OPENING_BEATS, AFTER_DUEL_BEATS, PROLOGUE_PHASE_TITLES, prologueSceneKey } from '../campaign/prologueScript';
import {
  PROLOGUE_PORTRAITS as portraits, compositionLayerIds, prologueBeatRef, prologueCleanPlaza,
  prologueComposition, prologueDomingoSprite, type PrologueArtResolver,
} from '../campaign/studio/composition';
import { StudioProvider, useStudio } from './studio/StudioContext';
import StageComposer from './studio/StageComposer';
import StudioInspector from './studio/StudioInspector';
import './campaign-opening.css';
import './story-dialogue.css';
import './prologue-v2.css';
import './prologue-v3.css';

export const PROLOGUE_CHECKPOINT_KEY = 'decreto-real.campania.prologo-cinematico.v1';

export { OPENING_BEATS, AFTER_DUEL_BEATS };

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

const phaseTitles: Record<string,string> = PROLOGUE_PHASE_TITLES;
const TOTAL_STUDIO_BEATS=OPENING_BEATS.length+AFTER_DUEL_BEATS.length;
const STUDIO_SCENE_OPTIONS=[
  ...OPENING_BEATS.map(item=>({label:item.speaker+' · '+item.title})),
  ...AFTER_DUEL_BEATS.map(item=>({label:item.speaker+' · '+(phaseTitles[item.phase]??item.phase)})),
];

const CampaignOpening:React.FC=()=>{
  const navigate=useNavigate();
  const [query]=useSearchParams();
  const studio=useStudio();
  const saved=React.useMemo(checkpoint,[]);
  const override=query.get('escena');
  const studioEnabled=studio.editing;
  const studioRawStep=query.get('studioStep');
  const parsedStudioStep=studioRawStep===null?NaN:Number(studioRawStep);
  const studioStep=studioEnabled&&Number.isInteger(parsedStudioStep)&&parsedStudioStep>=0&&
    parsedStudioStep<TOTAL_STUDIO_BEATS?parsedStudioStep:null;
  const previewRaw=query.get('previewStep');
  const parsedPreview=previewRaw===null?NaN:Number(previewRaw);
  const previewStep=isCampaignQaAvailable()&&Number.isInteger(parsedPreview)&&
    parsedPreview>=0&&parsedPreview<TOTAL_STUDIO_BEATS?parsedPreview:null;
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
  // React Router can reuse this screen when only the query changes (QA jumps
  // and every Studio navigation): update both the story phase and its index.
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
  const stageRef=React.useRef<HTMLDivElement|null>(null);
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
  const resolver:PrologueArtResolver={art,v2:v2art,v3:v3art,childArtReady:artReady||v3Ready};
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
  // Base cast of the current beat, declared by stable beat id.
  const beatRef=isAfter?prologueBeatRef('after',after):prologue?prologueBeatRef('opening',beat):null;
  const composition=beatRef?prologueComposition(beatRef,resolver):null;
  const domingo=prologueDomingoSprite({scene,beatId:composition?.beatId??null},resolver);
  const domingoDuelPortrait=v2art('D05',portraits['Domingo Quispe']);
  const cleanPlaza=prologueCleanPlaza(resolver);
  const background=composition?.background??cleanPlaza;

  // Decreto Real Studio: local QA drafts layered over the base composition.
  const studioKey=composition?prologueSceneKey(composition.beatId):null;
  const studioScene=studio.scene(studioKey);
  const titleVisible=studioScene?.titleVisible!==false;
  const backgroundAsset=studioScene?.background?.assetId;
  const renderedBackdrop=backgroundAsset?(studio.mediaUrls[backgroundAsset]??background):background;
  const backdropIsVideo=Boolean(backgroundAsset&&studio.doc.assets?.[backgroundAsset]?.mime.startsWith('video/'));
  const currentStudioIndex=isAfter?OPENING_BEATS.length+after:beat;
  const saveIfDirty=()=>{
    studio.commit();
    return !studio.dirty||studio.save();
  };
  const studioNavigate=(next:number)=>{
    if(next<0||next>=TOTAL_STUDIO_BEATS)return;
    if(!saveIfDirty())return;
    // Same mounted screen (no remount): history, media and manifests survive.
    navigate('/campania/prologo?studio=1&studioStep='+next,{replace:true});
  };
  const studioPreview=()=>{
    if(!saveIfDirty())return;
    navigate('/campania/prologo?previewStep='+currentStudioIndex);
  };
  const studioExit=()=>{
    if(!saveIfDirty())return;
    navigate('/');
  };

  const dialogueTone=speaker==='Crónica'?'narrator':
    scene==='reflexion'&&speaker==='Xervias'?'thought':'character';
  const advance=()=>{
    playSound('CLICK');
    if(isAfter){if(after===AFTER_DUEL_BEATS.length-1)finish();else setAfter(i=>i+1);}
    else if(!isFinal)setBeat(i=>i+1);
  };
  return <main className={'dcop-screen dcop-'+scene+(studioEnabled?' dcop-studio-mode':'')} aria-label="Prólogo de campaña: El Sello Real">
    <div className="dcop-stage" ref={stageRef}>
      {!isBattle&&!isFinal&&!studioEnabled&&<CampaignPauseMenu/>}
      {!isBattle&&!isFinal&&previewStep!==null&&!studioEnabled&&
        <button type="button" className="dcop-studio-return" data-testid="studio-return"
          onClick={()=>navigate('/campania/prologo?studio=1&studioStep='+currentStudioIndex)}>
          ✎ Volver a Studio
        </button>}
      {!isFinal&&!isBattle&&composition&&<div className="dcop-art" aria-hidden="true">
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
        <StageComposer composition={composition} sceneKey={studioKey} stageRef={stageRef}
          showRingFallback={composition.isRingOnlyShot&&!v3Ready}>
          {composition.isInvocationShot&&<div className="dcop-invocation-shimmer" data-testid="xervias-golden-invocation">
            <img className="dcop-summoned-card" src={v3art('G01',INVOCATION_CARD_URL)} alt=""/>
          </div>}
          {/* Domingo's ceremonial card is part of his transparent fighting sprite,
              never a floating card UI element hiding his face. */}
          {composition.isVersus&&<div className="dcop-versus" data-testid="cinematic-versus">
            <div className="dcop-versus-side dcop-versus-xervias">
              <img src={portraits.Xervias} alt=""/><strong>XERVIAS</strong>
            </div>
            <div className="dcop-versus-mark" aria-hidden="true">VS</div>
            <div className="dcop-versus-side dcop-versus-domingo">
              <img src={domingoDuelPortrait} alt=""/><strong>DOMINGO QUISPE</strong>
            </div>
          </div>}
        </StageComposer>
      </div>}
      {studioEnabled&&studioStep!==null&&studioKey&&composition&&
        <StudioInspector
          sceneKey={studioKey}
          sceneIndex={studioStep}
          total={TOTAL_STUDIO_BEATS}
          sceneOptions={STUDIO_SCENE_OPTIONS}
          title={speaker+' · '+(prologue?.title??phaseTitles[scene]??'Desenlace')}
          nativeLayerIds={compositionLayerIds(composition)}
          nativeBubbleText={composition.bubble?.text??null}
          onNavigate={studioNavigate}
          onPreview={studioPreview}
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

/** El prólogo con su capa de autoría local de Decreto Real Studio (solo QA). */
const CampaignOpeningScreen:React.FC=()=><StudioProvider><CampaignOpening/></StudioProvider>;
export default CampaignOpeningScreen;
