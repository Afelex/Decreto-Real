import test from 'node:test';
import assert from 'node:assert/strict';
import {DEFAULT_NARRATIVE_TIMING,type AudioTimelineTimer} from './audioTimeline.ts';
import {NARRATIVE_AUDITION_WINDOW_MS,startNarrativeAudition,
  type NarrativeAuditionActions} from './audioAudition.ts';

function fakeClock(){
  let time=0,seq=0;
  const jobs=new Map<number,{time:number;fn:()=>void}>();
  const timers:AudioTimelineTimer<number>={
    after:(ms,fn)=>{const id=++seq;jobs.set(id,{time:time+ms,fn});return id;},
    cancel:id=>{jobs.delete(id);},
  };
  const advance=(ms:number)=>{
    const target=time+ms;
    while(true){
      const next=[...jobs.entries()].filter(([,j])=>j.time<=target)
        .sort((a,b)=>a[1].time-b[1].time||a[0]-b[0])[0];
      if(!next)break;
      jobs.delete(next[0]);time=next[1].time;next[1].fn();
    }
    time=target;
  };
  return {timers,advance,pending:()=>jobs.size};
}
function recorder(){
  const events:string[]=[];
  const actions:NarrativeAuditionActions={
    selectTrack:url=>events.push('track '+String(url)),
    setMusicMode:mode=>events.push('music '+mode),
    playEffect:cue=>{
      events.push('effect '+cue);
      return ()=>events.push('stop effect');
    },
    restore:()=>events.push('restore'),
    event:event=>events.push('event '+event),
  };
  return {events,actions};
}

test('audición con retrasos usa los relojes reales y termina limpia a los 8 s',()=>{
  const c=fakeClock(),r=recorder();
  const timing={...DEFAULT_NARRATIVE_TIMING,musicStartDelayMs:500,
    soundDelayMs:250,musicStopAfterMs:2000,soundMaxDurationMs:1000};
  let finished=0;
  const stop=startNarrativeAudition({music:'soft',sound:'IMPACT'},timing,
    'blob:scene',r.actions,c.timers,()=>finished++);
  c.advance(249);assert.deepEqual(r.events,[]);
  c.advance(1);assert.ok(r.events.includes('effect IMPACT'));
  c.advance(250);assert.ok(r.events.includes('track blob:scene'));
  assert.ok(r.events.includes('music soft'));
  c.advance(750);assert.equal(r.events.filter(s=>s==='stop effect').length,1);
  c.advance(1250);assert.ok(r.events.includes('music silent'));
  c.advance(NARRATIVE_AUDITION_WINDOW_MS-2500);
  assert.equal(finished,1);
  assert.equal(r.events.at(-1),'event finished');
  assert.equal(r.events.filter(s=>s==='restore').length,1);
  assert.equal(c.pending(),0);
  stop();assert.equal(r.events.filter(s=>s==='restore').length,1);
});

test('cambiar de intervención antes del disparo cancela música y efectos',()=>{
  const c=fakeClock(),r=recorder();
  const stop=startNarrativeAudition({music:'normal',sound:'ATTACK'},
    {...DEFAULT_NARRATIVE_TIMING,musicStartDelayMs:3000,soundDelayMs:1500},
    null,r.actions,c.timers);
  c.advance(400);
  stop();c.advance(20000);
  assert.deepEqual(r.events,['restore']);
  assert.equal(c.pending(),0);
});

test('detener manualmente recorta incluso un efecto natural de larga duración',()=>{
  const c=fakeClock(),r=recorder();
  const stop=startNarrativeAudition({music:'normal',sound:'FLIP'},
    DEFAULT_NARRATIVE_TIMING,'blob:test',r.actions,c.timers);
  assert.ok(r.events.includes('effect FLIP'));
  c.advance(300);stop();stop();
  assert.equal(r.events.filter(s=>s==='stop effect').length,1);
  assert.equal(r.events.filter(s=>s==='restore').length,1);
  c.advance(10000);
  assert.equal(c.pending(),0);
});

test('modo continuar conserva la canción y modo detener la silencia',()=>{
  const a=fakeClock(),r=recorder();
  const stop=startNarrativeAudition({music:'soft',sound:'none'},
    {...DEFAULT_NARRATIVE_TIMING,musicCueMode:'continue'},
    'blob:ignored',r.actions,a.timers);
  assert.ok(!r.events.some(v=>v.startsWith('track ')));
  assert.ok(r.events.includes('music soft'));
  stop();
  const b=fakeClock(),s=recorder();
  const stopB=startNarrativeAudition({music:'normal',sound:'none'},
    {...DEFAULT_NARRATIVE_TIMING,musicCueMode:'stop',musicStopAfterMs:5000},
    'blob:ignored',s.actions,b.timers);
  assert.ok(s.events.includes('music silent'));
  assert.equal(b.pending(),1); // Solo el cierre de la audición.
  stopB();assert.equal(b.pending(),0);
});

test('sin efecto no crea sonido y una duración máxima no lo detiene dos veces',()=>{
  const c=fakeClock(),r=recorder();
  const stop=startNarrativeAudition({music:'silent',sound:'DEFENSE'},
    {...DEFAULT_NARRATIVE_TIMING,soundMaxDurationMs:500},
    null,r.actions,c.timers);
  c.advance(500);stop();
  assert.equal(r.events.filter(s=>s==='stop effect').length,1);
  assert.equal(r.events.filter(s=>s==='restore').length,1);
  const d=fakeClock(),s=recorder();
  const done=startNarrativeAudition({music:'normal',sound:'none'},
    DEFAULT_NARRATIVE_TIMING,null,s.actions,d.timers);
  assert.ok(!s.events.some(x=>x.startsWith('effect ')));
  done();
});
