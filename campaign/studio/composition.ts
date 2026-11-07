/**
 * Reparto declarativo del prólogo: qué fondo, qué actores (con qué arte) y qué
 * globo breve tiene cada intervención. Sustituye la cadena if/else con números
 * mágicos de posición que vivía en CampaignOpening; ahora las excepciones se
 * expresan por beatId estable.
 *
 * Es la composición BASE: Decreto Real Studio aplica encima sus capas.
 * Módulo puro (sin React ni DOM).
 */
import {
  AFTER_DUEL_BEATS, OPENING_BEATS,
  type AfterDuelBeat, type OpeningBeat,
} from '../prologueScript.ts';
import type { PrologueArtId } from '../prologueArt.ts';
import type { V2ArtId } from '../prologueV2.ts';
import type { V3ArtId } from '../prologueV3.ts';
import { actorLayerId, type StudioActor } from './schema.ts';

export const PROLOGUE_PORTRAITS = Object.freeze({
  Xervias:'./retratos/jugador.webp',
  'Domingo Quispe':'./campania/arte/retratos/rival-01-domingo-quispe.webp',
  Zhinchi:'./retratos/rival.webp',
  Madre:'./campania/escenas/familia-suplicando.svg',
});
export const PROLOGUE_PLAZA_FALLBACK = './escenarios/plaza-virreinal-v2.svg';

/** Resuelve cada id de arte a su URL o a un respaldo mientras el lote no esté completo. */
export type PrologueArtResolver = {
  art:(id:PrologueArtId,fallback:string)=>string;
  v2:(id:V2ArtId,fallback:string)=>string;
  v3:(id:V3ArtId,fallback:string)=>string;
  /** Hay arte del niño separado de la madre (lote v1 o v3 completo). */
  childArtReady:boolean;
};

export type PrologueNativeActor = 'Xervias'|'Zhinchi'|'Domingo Quispe'|'Madre';
export type CompositionActor = {
  actor:PrologueNativeActor;
  /** Id de capa de Studio v3 (p. ej. `actor-madre`). */
  layerId:string;
  src:string;
  /** Sprite del niño dibujado dentro del contenedor de la madre. */
  child?:{layerId:string;src:string};
};
export type PrologueBeatRef = {phase:'opening';beat:OpeningBeat}|{phase:'after';beat:AfterDuelBeat};
export type PrologueComposition = {
  beatId:string;
  /** Escena (antes del duelo) o fase (después del duelo). */
  scene:string;
  speaker:string;
  background:string;
  actors:CompositionActor[];
  bubble:{text:string;side:'left'|'right'}|null;
  /** La madre aparece a la derecha con Xervias (variante teatral). */
  familyRight:boolean;
  isRingOnlyShot:boolean;
  isInvocationShot:boolean;
  isCounterInvocationShot:boolean;
  isVersus:boolean;
  isScepterShot:boolean;
};

export function prologueBeatRef(phase:'opening'|'after',index:number):PrologueBeatRef|null {
  if(phase==='opening'){const beat=OPENING_BEATS[index];return beat?{phase,beat}:null;}
  const beat=AFTER_DUEL_BEATS[index];
  return beat?{phase,beat}:null;
}

type DomingoContext = {scene:string;beatId:string|null};
/** Pose v2 de Domingo. Señalar queda reservado para la réplica burlona. */
function domingoPose({scene,beatId}:DomingoContext):V2ArtId {
  if(scene==='desenlace')return 'D04';
  if(beatId==='desafio-01')return 'D03';
  if(scene==='desafio'||scene==='revision'||scene==='anillo')return 'D02';
  return 'D01';
}
/**
 * Sprite de Domingo para una escena (también lo usa el duelo guiado).
 * desafio-04: Domingo furioso. anillo-05: su carta va DENTRO de su PNG de combate.
 */
export function prologueDomingoSprite(ctx:DomingoContext,r:PrologueArtResolver):string {
  const pose=domingoPose(ctx);
  const fallback=r.art(pose==='D04'?'D04':pose==='D03'?'D02':pose==='D02'?'D03':'D01',PROLOGUE_PORTRAITS['Domingo Quispe']);
  const normal=r.v2(pose,fallback);
  if(ctx.beatId==='desafio-04')return r.v3('D07',normal);
  if(ctx.beatId==='anillo-05')return r.v3('D08',normal);
  return normal;
}
/** Fondo de plaza limpia: el primer fondo contenía una persona y se retiró. */
export const prologueCleanPlaza = (r:PrologueArtResolver):string =>
  r.v2('F02',r.art('F02',PROLOGUE_PLAZA_FALLBACK));

const QUICK_BUBBLES:Readonly<Record<string,string>> = {
  'arresto-01':'¡Por favor!',
  'xervias-01':'¡Un momento!',
  'desafio-01':'¡Silencio!',
  'zhinchi-01':'¡Alto!',
};

export function prologueComposition(ref:PrologueBeatRef,r:PrologueArtResolver):PrologueComposition {
  const beatId=ref.beat.id;
  const scene=ref.phase==='opening'?ref.beat.scene:ref.beat.phase;
  const speaker=ref.beat.speaker;
  const P=PROLOGUE_PORTRAITS;
  // anillo-01: solo el anillo emite energía; sin carta de invocación.
  const isRingOnlyShot=beatId==='anillo-01';
  const isInvocationShot=beatId==='anillo-02';
  const isCounterInvocationShot=beatId==='anillo-05';
  const isVersus=scene==='versus';
  const isScepterShot=beatId==='cetro-02'||beatId==='cetro-03';

  const xervias=isRingOnlyShot
    ? r.v3('X05',r.art('X01',P.Xervias))
    : r.art(scene==='anillo'?'X02':scene==='reflexion'?'X04':'X01',P.Xervias);
  const domingo=prologueDomingoSprite({scene,beatId},r);
  const zhinchi=r.art(scene==='cetro'?(beatId==='cetro-01'?'Z02':'Z03'):scene==='resolucion'?'Z04':'Z01',P.Zhinchi);
  const mother=r.art(scene==='arresto'?'M02':scene==='desenlace'?'M03':scene==='resolucion'?'M04':'M01',P.Madre);
  const child=r.childArtReady?{
    layerId:actorLayerId('Niño'),
    src:scene==='resolucion'?r.v3('N04',r.art('N02',P.Madre)):r.v3('N03',r.art('N01',P.Madre)),
  }:undefined;

  const cleanPlaza=prologueCleanPlaza(r);
  const background=scene==='pergamino'?r.v2('F01',cleanPlaza):
    isInvocationShot?r.art('P02',cleanPlaza):
    isScepterShot?r.art('P03',cleanPlaza):
    cleanPlaza;

  const actors:CompositionActor[]=[];
  const add=(actor:PrologueNativeActor)=>{
    const src=actor==='Xervias'?xervias:actor==='Domingo Quispe'?domingo:actor==='Zhinchi'?zhinchi:mother;
    actors.push({actor,layerId:actorLayerId(actor as StudioActor),src,...(actor==='Madre'&&child?{child}:{})});
  };
  if(scene==='arresto'){add('Madre');add('Domingo Quispe');}
  else if(scene==='xervias'||scene==='revision'||scene==='desafio'){
    if(speaker==='Madre'){add('Xervias');add('Madre');}
    else{add('Xervias');add('Domingo Quispe');}
  }
  else if(scene==='anillo'&&!isInvocationShot){add('Xervias');add('Domingo Quispe');}
  else if(scene==='desenlace'){
    if(speaker==='Madre'){add('Madre');add('Domingo Quispe');}
    else{add('Xervias');add('Domingo Quispe');}
  }
  else if(scene==='zhinchi'){
    if(beatId==='zhinchi-01'){add('Xervias');add('Domingo Quispe');}
    else{add('Xervias');add('Zhinchi');}
  }
  else if(scene==='cetro'&&!isScepterShot){add('Xervias');add('Zhinchi');}
  else if(scene==='resolucion'){
    if(speaker==='Madre'){add('Madre');add('Zhinchi');}
    else if(speaker==='Domingo Quispe'){add('Domingo Quispe');add('Zhinchi');}
    else{add('Xervias');add('Zhinchi');}
  }
  else if(scene==='reflexion'&&speaker==='Xervias'){add('Xervias');}

  const bubbleText=QUICK_BUBBLES[beatId];
  const bubble=bubbleText?{
    text:bubbleText,
    side:(bubbleText==='¡Alto!'||speaker==='Domingo Quispe'?'right':'left') as 'left'|'right',
  }:null;

  return {
    beatId,scene,speaker,background,actors,bubble,
    familyRight:scene==='xervias'&&speaker==='Madre',
    isRingOnlyShot,isInvocationShot,isCounterInvocationShot,isVersus,isScepterShot,
  };
}

/** Ids de capa nativos disponibles en una composición (para el inspector). */
export function compositionLayerIds(c:PrologueComposition):string[] {
  return [
    ...c.actors.flatMap(a=>a.child?[a.layerId,a.child.layerId]:[a.layerId]),
    ...(c.bubble?['bubble']:[]),
  ];
}
