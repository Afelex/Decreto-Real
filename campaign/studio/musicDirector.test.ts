import test from 'node:test';
import assert from 'node:assert/strict';
import {MUSIC_CROSSFADE_MS,MUSIC_LEVEL_FADE_MS,
  NarrativeMusicDirector,smoothMusicProgress,volumeForNarrative,
  type MusicAudioLike,type MusicDirectorDependencies} from './musicDirector.ts';

type FakeTrack=MusicAudioLike&{name:string;playCalls:number;pauseCalls:number;paused:boolean};
function fixture(){
  let now=0,seq=0;
  const callbacks=new Map<number,(timestamp:number)=>void>();
  const tracks:FakeTrack[]=[];
  const deps:MusicDirectorDependencies={
    create:url=>{
      const item:FakeTrack={name:url,loop:false,volume:0,playCalls:0,
        pauseCalls:0,paused:true,
        play(){this.playCalls++;this.paused=false;return Promise.resolve();},
        pause(){this.pauseCalls++;this.paused=true;},
      };
      tracks.push(item);return item;
    },
    requestFrame:callback=>{const id=++seq;callbacks.set(id,callback);return id;},
    cancelFrame:id=>{callbacks.delete(id);},
    now:()=>now,
  };
  const advance=(ms:number)=>{
    now+=ms;
    const list=[...callbacks.values()];
    callbacks.clear();
    for(const callback of list)callback(now);
  };
  const director=new NarrativeMusicDirector(deps);
  return {director,tracks,advance,pending:()=>callbacks.size};
}

test('crossfading tracks avoids restarts when consecutive scenes use the same song',()=>{
  const {director,tracks,advance,pending}=fixture();
  director.setSoundtrack('prologo.mp3',true,'normal');
  assert.equal(tracks.length,1);
  assert.equal(tracks[0].loop,true);
  assert.equal(tracks[0].volume,0);
  advance(MUSIC_LEVEL_FADE_MS);
  assert.equal(tracks[0].volume,.3);
  director.setSoundtrack('prologo.mp3',true,'normal');
  assert.equal(tracks.length,1);
  assert.equal(pending(),0);
  director.setSoundtrack('prologo.mp3',true,'soft');
  advance(MUSIC_LEVEL_FADE_MS);
  assert.equal(tracks[0].volume,.12);
  director.setSoundtrack('tension.wav',true,'soft');
  assert.equal(tracks.length,2);
  assert.equal(tracks[1].volume,0);
  assert.equal(tracks[0].paused,false);
  advance(MUSIC_CROSSFADE_MS/2);
  assert.ok(tracks[0].volume>0&&tracks[0].volume<.12);
  assert.ok(tracks[1].volume>0&&tracks[1].volume<.12);
  advance(MUSIC_CROSSFADE_MS/2);
  assert.equal(tracks[1].volume,.12);
  assert.equal(tracks[0].paused,true);
  assert.equal(pending(),0);
  director.dispose();
  assert.equal(tracks[1].paused,true);
});

test('muting pauses immediately and later restores existing track without replacement',()=>{
  const {director,tracks,advance,pending}=fixture();
  director.setSoundtrack('original.mp3',true,'normal');
  advance(320);
  director.setSoundtrack('original.mp3',false,'normal');
  assert.equal(tracks[0].paused,true);
  assert.equal(tracks[0].volume,0);
  assert.equal(pending(),0);
  director.setSoundtrack('original.mp3',true,'normal');
  assert.equal(tracks.length,1);
  advance(320);
  assert.equal(tracks[0].volume,.3);
  director.setSoundtrack('original.mp3',true,'silent');
  assert.equal(tracks[0].paused,true);
  director.setSoundtrack('nuevo.mp3',true,'silent');
  assert.equal(tracks[1].paused,true);
  assert.equal(tracks[0].paused,true);
  director.setSoundtrack('nuevo.mp3',true,'soft');
  advance(320);
  assert.equal(tracks[1].volume,.12);
});

test('rapid track changes release abandoned song and leave one active track',()=>{
  const {director,tracks,advance,pending}=fixture();
  director.setSoundtrack('a.mp3',true,'normal');
  advance(320);
  director.setSoundtrack('b.mp3',true,'normal');
  advance(150);
  director.setSoundtrack('c.mp3',true,'normal');
  assert.equal(tracks[0].paused,true);
  advance(MUSIC_CROSSFADE_MS);
  assert.equal(tracks[1].paused,true);
  assert.equal(tracks[2].paused,false);
  assert.equal(tracks[2].volume,.3);
  director.dispose();
  assert.equal(pending(),0);
});

test('volume bounds and smoothstep are stable and do not exceed user choices',()=>{
  assert.equal(volumeForNarrative(false,'normal'),0);
  assert.equal(volumeForNarrative(true,'silent'),0);
  assert.equal(volumeForNarrative(true,'soft'),.12);
  assert.equal(volumeForNarrative(true,'normal'),.3);
  assert.equal(smoothMusicProgress(-10,700),0);
  assert.equal(smoothMusicProgress(350,700),.5);
  assert.equal(smoothMusicProgress(900,700),1);
});
