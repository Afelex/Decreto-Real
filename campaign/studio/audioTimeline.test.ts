import test from 'node:test';
import assert from 'node:assert/strict';
import {
  DEFAULT_NARRATIVE_TIMING,scheduleNarrativeMusic,scheduleNarrativeSound,
  validAudioTime,type AudioTimelineTimer,
} from './audioTimeline.ts';
import {normalizeStudioDocumentV3,emptyStudioDocumentV3} from './schema.ts';
import {withNarrativeCard} from './ops.ts';
import {resolveNarrativeTiming} from './narrativeAudio.ts';

function clock(){
  let now=0,seq=0;
  const queue=new Map<number,{time:number;fn:()=>void}>();
  const timers:AudioTimelineTimer<number>={
    after:(ms,fn)=>{const id=++seq;queue.set(id,{time:now+ms,fn});return id;},
    cancel:id=>{queue.delete(id);},
  };
  const advance=(ms:number)=>{
    const end=now+ms;
    while(true){
      const due=[...queue.entries()].filter(([,v])=>v.time<=end)
        .sort((a,b)=>a[1].time-b[1].time||a[0]-b[0])[0];
      if(!due)break;
      queue.delete(due[0]);now=due[1].time;due[1].fn();
    }
    now=end;
  };
  return {timers,advance,pending:()=>queue.size};
}

test('audio cue delay and maximum duration fire relative to the same narrative beat',()=>{
  const c=clock(),events:string[]=[];
  const timing={...DEFAULT_NARRATIVE_TIMING,
    musicStartDelayMs:500,musicStopAfterMs:2000,
    soundDelayMs:250,soundMaxDurationMs:1000};
  const stopMusic=scheduleNarrativeMusic(timing,{
    start:()=>events.push('music on'),stop:()=>events.push('music off'),
  },c.timers);
  const stopSound=scheduleNarrativeSound('IMPACT',timing,{
    start:()=>{events.push('impact on');return ()=>events.push('impact off');},
  },c.timers);
  c.advance(249);assert.deepEqual(events,[]);
  c.advance(1);assert.deepEqual(events,['impact on']);
  c.advance(250);assert.deepEqual(events,['impact on','music on']);
  c.advance(750);assert.deepEqual(events,['impact on','music on','impact off']);
  c.advance(1250);assert.deepEqual(events,['impact on','music on','impact off','music off']);
  stopMusic();stopSound();
  assert.equal(c.pending(),0);
});

test('advancing before a delayed sound or music cancels both events',()=>{
  const c=clock(),events:string[]=[];
  const timing={...DEFAULT_NARRATIVE_TIMING,musicStartDelayMs:1500,
    soundDelayMs:1000,musicStopAfterMs:2000};
  const a=scheduleNarrativeMusic(timing,{
    start:()=>events.push('music on'),stop:()=>events.push('music off'),
  },c.timers);
  const b=scheduleNarrativeSound('CLICK',timing,{
    start:()=>events.push('click'),
  },c.timers);
  c.advance(400);a();b();c.advance(30000);
  assert.deepEqual(events,[]);
  assert.equal(c.pending(),0);
});

test('cutting an effect early on scene advancement avoids a sound over the next dialogue',()=>{
  const c=clock(),events:string[]=[];
  const timing={...DEFAULT_NARRATIVE_TIMING,soundMaxDurationMs:3000};
  const cancel=scheduleNarrativeSound('ATTACK',timing,{
    start:()=>{events.push('start');return ()=>events.push('stop');},
  },c.timers);
  c.advance(500);cancel();
  c.advance(10000);
  assert.deepEqual(events,['start','stop']);
  assert.equal(c.pending(),0);
});

test('natural sounds are not forcibly cut; stop music has no follow-up timer',()=>{
  const c=clock(),events:string[]=[];
  const sound=scheduleNarrativeSound('CLICK',DEFAULT_NARRATIVE_TIMING,{
    start:()=>{events.push('click');return ()=>events.push('unused stop');},
  },c.timers);
  sound();
  const music=scheduleNarrativeMusic({...DEFAULT_NARRATIVE_TIMING,
    musicCueMode:'stop',musicStopAfterMs:5000},{
    start:()=>events.push('music stopped'),stop:()=>events.push('never'),
  },c.timers);
  music();c.advance(10000);
  assert.deepEqual(events,['click','music stopped']);
});

test('timeline fields are validated and previous documents remain compatible',()=>{
  const raw=normalizeStudioDocumentV3({version:3,scenes:{
    'tutorial/g01':{narrative:{
      musicCueMode:'continue',musicStartDelayMs:500,musicStopAfterMs:15000,
      soundDelayMs:250,soundMaxDurationMs:1000,
      sourceUrl:'https://untrusted.invalid/example.mp3',
    }},
    'tutorial/g02':{narrative:{musicCueMode:'nonsense',
      musicStartDelayMs:-900,soundDelayMs:999999,soundMaxDurationMs:NaN}},
    'tutorial/g03':{narrative:{musicCueMode:'stop'}},
  }});
  assert.deepEqual(resolveNarrativeTiming(raw.scenes['tutorial/g01'].narrative),{
    musicCueMode:'continue',musicStartDelayMs:500,musicStopAfterMs:15000,
    soundDelayMs:250,soundMaxDurationMs:1000,
  });
  assert.equal(raw.scenes['tutorial/g02'],undefined);
  assert.deepEqual(resolveNarrativeTiming(undefined),DEFAULT_NARRATIVE_TIMING);
  assert.equal(raw.scenes['tutorial/g03'].narrative?.musicCueMode,'stop');
  assert.equal(validAudioTime('soundDelayMs',10000),undefined);
  let old=withNarrativeCard(emptyStudioDocumentV3(),'tutorial/g06',{tone:'enojado'});
  assert.deepEqual(resolveNarrativeTiming(old.scenes['tutorial/g06'].narrative),DEFAULT_NARRATIVE_TIMING);
  old=withNarrativeCard(old,'tutorial/g06',{soundDelayMs:1500});
  assert.equal(old.scenes['tutorial/g06'].narrative?.tone,'enojado');
  old=withNarrativeCard(old,'tutorial/g06',{soundDelayMs:null});
  assert.equal(old.scenes['tutorial/g06'].narrative?.soundDelayMs,undefined);
});
