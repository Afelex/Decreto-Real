import assert from 'node:assert/strict';
import test from 'node:test';
import { IA_CRITICAL_HP_LIMIT, freeDuelMusicScene } from './musicScene.ts';

test('menu-to-duel entry uses only the introductory cue first', () => {
  assert.equal(freeDuelMusicScene({ entranceActive:true,phase:'COIN_TOSS',playerHP:20,opponentHP:20 }), 'DUEL_ENTRANCE');
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'COIN_TOSS',playerHP:20,opponentHP:20 }), 'BATTLE');
});
test('critical music follows the existing red HP threshold without changing HP', () => {
  assert.equal(IA_CRITICAL_HP_LIMIT,4);
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'PLAYER_TURN',playerHP:5,opponentHP:20 }), 'BATTLE');
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'PLAYER_TURN',playerHP:4,opponentHP:20 }), 'CRITICAL');
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'PLAYER_TURN',playerHP:20,opponentHP:3 }), 'CRITICAL');
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'PLAYER_TURN',playerHP:12,opponentHP:12 }), 'BATTLE');
});
test('victory and defeat always override the low-HP music', () => {
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'VICTORY',playerHP:1,opponentHP:0 }), 'VICTORY');
  assert.equal(freeDuelMusicScene({ entranceActive:false,phase:'DEFEAT',playerHP:0,opponentHP:4 }), 'DEFEAT');
});
