import assert from 'node:assert/strict';
import test from 'node:test';
import { musicAssetUrl, resolveAudioSlot, soundAssetUrl } from './audioAssets.ts';
import { SoundEffectPool, type SoundVoice } from './soundPool.ts';

class FakeSound implements SoundVoice {
  paused = true;
  ended = false;
  currentTime = 0;
  volume = 0;
  preload = 'none';
  played = 0;
  stopped = 0;
  play() {
    this.played++;
    this.paused = false;
    this.ended = false;
    return Promise.resolve();
  }
  pause() { this.paused = true; this.stopped++; }
}

test('Suno slots remain empty: original sounds play and silent victory/defeat stay silent', () => {
  assert.equal(soundAssetUrl('ATTACK', '/Decreto-Real/'),
    'https://assets.mixkit.co/active_storage/sfx/1476/1476-preview.mp3');
  assert.equal(musicAssetUrl('DEFAULT','/Decreto-Real/'),
    'https://assets.mixkit.co/music/80/80.mp3');
  assert.equal(soundAssetUrl('VICTORY','/Decreto-Real/'),null);
  assert.equal(soundAssetUrl('DEFEAT','/Decreto-Real/'),null);
  assert.equal(musicAssetUrl('MENU','/Decreto-Real/'),null);
  assert.equal(resolveAudioSlot({file:'audio/suno/prueba.mp3',fallback:null},'/Decreto-Real/'),
    '/Decreto-Real/audio/suno/prueba.mp3');
  assert.equal(resolveAudioSlot({file:'/audio/suno/prueba.mp3',fallback:'old'},'/Decreto-Real/'),
    '/Decreto-Real/audio/suno/prueba.mp3');
});

test('audio is completely lazy and only two voices are allocated for rapid repeated cues', () => {
  const created: FakeSound[] = [];
  const urls: string[] = [];
  const pool = new SoundEffectPool(url=>{
    urls.push(url);
    const audio = new FakeSound(); created.push(audio);
    return audio;
  }, '/Decreto-Real/');
  assert.equal(created.length,0);
  const first = pool.play('CLICK');
  const second = pool.play('CLICK');
  assert.equal(created.length,2);
  assert.equal(created[0].played,1);
  assert.equal(created[1].played,1);
  assert.equal(created[0].preload,'auto');
  assert.equal(pool.play('CLICK'),undefined, 'do not truncate a still-playing sound');
  assert.equal(created.length,2);
  first?.();
  assert.equal(created[0].paused,true);
  const third = pool.play('CLICK');
  assert.equal(created.length,2,'reuse a player');
  assert.equal(created[0].played,2);
  third?.();
  second?.();
  pool.dispose();
  assert.equal(created.length,2);
  assert.ok(urls.every(url=>url.includes('/sfx/1109/')));
});

test('mute stops current sounds and disposal drops cached media', () => {
  const created:FakeSound[] = [];
  const pool=new SoundEffectPool(()=>{
    const voice=new FakeSound();created.push(voice);return voice;
  },'/Decreto-Real/');
  pool.play('ATTACK');
  pool.play('IMPACT');
  assert.equal(created[0].volume,0.4);
  assert.equal(created[1].volume,0.6);
  pool.stopAll();
  assert.ok(created.every(audio=>audio.paused));
  pool.play('ATTACK');
  assert.equal(created.length,2);
  pool.dispose();
  pool.play('DEFENSE');
  assert.equal(created.length,3);
});

test('rejected audio playback never crashes the turn or allocates infinite voices', () => {
  const voice=new FakeSound();
  voice.play=()=>{throw new Error('media blocked');};
  const pool=new SoundEffectPool(()=>voice,'/Decreto-Real/');
  assert.doesNotThrow(()=>pool.play('CLICK'));
  assert.equal(soundAssetUrl('VICTORY','/Decreto-Real/'),null);
});
