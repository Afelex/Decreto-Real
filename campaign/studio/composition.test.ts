import test from 'node:test';
import assert from 'node:assert/strict';
import { AFTER_DUEL_BEATS, OPENING_BEATS } from '../prologueScript.ts';
import {
  PROLOGUE_PORTRAITS, compositionLayerIds, prologueBeatRef, prologueComposition, prologueDomingoSprite,
  type PrologueArtResolver,
} from './composition.ts';

/** Resolutor que codifica el lote y el respaldo, para comparar decisiones exactas. */
const resolver=(artReady:boolean,v2Ready:boolean,v3Ready:boolean):PrologueArtResolver=>({
  art:(id,fb)=>artReady?'v1:'+id:fb,
  v2:(id,fb)=>v2Ready?'v2:'+id:fb,
  v3:(id,fb)=>v3Ready?'v3:'+id:fb,
  childArtReady:artReady||v3Ready,
});

/**
 * Oráculo: transcripción literal de la lógica de CampaignOpening ANTES de la
 * fase 2 (índices de posición y números mágicos). La composición declarativa
 * debe producir exactamente lo mismo en las 53 intervenciones.
 */
function legacyOracle(isAfter:boolean,beat:number,after:number,r:PrologueArtResolver){
  const portraits=PROLOGUE_PORTRAITS;
  const art=r.art,v2art=r.v2,v3art=r.v3;
  const prologue=!isAfter?OPENING_BEATS[beat]:null;
  const story=isAfter?AFTER_DUEL_BEATS[after]:prologue!;
  const scene=prologue?.scene??AFTER_DUEL_BEATS[after].phase;
  const speaker=story.speaker;
  const isRingOnlyShot=scene==='anillo'&&beat===15;
  const xervias=isRingOnlyShot?v3art('X05',art('X01',portraits.Xervias))
    :art(scene==='anillo'?'X02':scene==='reflexion'?'X04':scene==='desafio'?'X01':'X01',portraits.Xervias);
  const domingoPose=scene==='desenlace'?'D04':scene==='desafio'&&beat===11?'D03':
    (scene==='desafio'||scene==='revision'||scene==='anillo')?'D02':'D01';
  const domingoFallback=art(domingoPose==='D04'?'D04':domingoPose==='D03'?'D02':domingoPose==='D02'?'D03':'D01',portraits['Domingo Quispe']);
  const domingoNormal=v2art(domingoPose,domingoFallback);
  const domingo=scene==='desafio'&&beat===14?v3art('D07',domingoNormal):scene==='anillo'&&beat===19?v3art('D08',domingoNormal):domingoNormal;
  const zhinchi=art(scene==='cetro'?(after===13?'Z02':'Z03'):scene==='resolucion'?'Z04':'Z01',portraits.Zhinchi);
  const mother=art(scene==='arresto'?'M02':scene==='desenlace'?'M03':scene==='resolucion'?'M04':'M01',portraits.Madre);
  const isInvocationShot=scene==='anillo'&&story.speaker==='Xervias'&&story.text.includes('¡Activo el DECRETO REAL!');
  const isCounterInvocationShot=scene==='anillo'&&story.speaker==='Domingo Quispe'&&story.text.startsWith('¡Muy bien!');
  const isScepterShot=scene==='cetro'&&(after===14||after===15);
  const cleanPlaza=v2art('F02',art('F02','./escenarios/plaza-virreinal-v2.svg'));
  const background=scene==='pergamino'?v2art('F01',cleanPlaza):isInvocationShot?art('P02',cleanPlaza):isScepterShot?art('P03',cleanPlaza):cleanPlaza;
  const actors:{id:string;src:string;child:boolean}[]=[];
  const add=(id:string,src:string,child=false)=>actors.push({id,src,child});
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
  const quickBubble=prologue?.scene==='arresto'&&beat===1?'¡Por favor!':
    scene==='xervias'&&speaker==='Xervias'&&beat===4?'¡Un momento!':
    scene==='desafio'&&speaker==='Domingo Quispe'&&story.text.startsWith('¡Silencio!')?'¡Silencio!':
    scene==='zhinchi'&&after===9?'¡Alto!':null;
  const side=quickBubble==='¡Alto!'?'right':speaker==='Domingo Quispe'?'right':'left';
  const childSrc=scene==='resolucion'?v3art('N04',art('N02',portraits.Madre)):v3art('N03',art('N01',portraits.Madre));
  return {
    scene,speaker,background,isRingOnlyShot,isInvocationShot,isCounterInvocationShot,isScepterShot,
    isVersus:scene==='versus',familyRight:scene==='xervias'&&speaker==='Madre',
    actors:actors.map(a=>({actor:a.id,src:a.src,childSrc:a.child&&r.childArtReady?childSrc:null})),
    bubble:quickBubble?{text:quickBubble,side}:null,
  };
}

const RESOLVERS=[resolver(false,false,false),resolver(true,false,false),resolver(true,true,false),
  resolver(true,true,true),resolver(false,true,true)];

test('declarative composition reproduces the legacy cast for all 49 beats and art states',()=>{
  for(const r of RESOLVERS){
    const cases=[
      ...OPENING_BEATS.map((_,i)=>({isAfter:false,beat:i,after:0,ref:prologueBeatRef('opening',i)})),
      ...AFTER_DUEL_BEATS.map((_,i)=>({isAfter:true,beat:OPENING_BEATS.length+1,after:i,ref:prologueBeatRef('after',i)})),
    ];
    for(const c of cases){
      const expected=legacyOracle(c.isAfter,c.beat,c.after,r);
      const got=prologueComposition(c.ref!,r);
      assert.deepEqual({
        scene:got.scene,speaker:got.speaker,background:got.background,
        isRingOnlyShot:got.isRingOnlyShot,isInvocationShot:got.isInvocationShot,
        isCounterInvocationShot:got.isCounterInvocationShot,isScepterShot:got.isScepterShot,
        isVersus:got.isVersus,familyRight:got.familyRight,
        actors:got.actors.map(a=>({actor:a.actor,src:a.src,childSrc:a.child?.src??null})),
        bubble:got.bubble,
      },expected,got.beatId);
    }
  }
});

test('composition exposes stable layer ids for Studio',()=>{
  const r=resolver(true,true,true);
  const arresto=prologueComposition(prologueBeatRef('opening',1)!,r);
  assert.deepEqual(compositionLayerIds(arresto),['actor-madre','actor-nino','actor-domingo','bubble']);
  const noChild=prologueComposition(prologueBeatRef('opening',1)!,resolver(false,true,false));
  assert.deepEqual(compositionLayerIds(noChild),['actor-madre','actor-domingo','bubble']);
  assert.deepEqual(compositionLayerIds(prologueComposition(prologueBeatRef('opening',0)!,r)),[]);
  assert.equal(prologueBeatRef('opening',21),null);
  assert.equal(prologueBeatRef('after',28),null);
});

test('the guided duel uses the neutral Domingo sprite',()=>{
  const r=resolver(true,true,true);
  assert.equal(prologueDomingoSprite({scene:'duelo',beatId:null},r),'v2:D01');
  assert.equal(prologueDomingoSprite({scene:'desafio',beatId:'desafio-04'},r),'v3:D07');
});
