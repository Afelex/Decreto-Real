import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';
import { DECREE_BANNER_DURATION_MS } from '../../game/effectCues';

const source=(path:string)=>readFileSync(path,'utf8');

test('los anuncios de decretos duran 1,5 segundos en IA y multijugador',()=>{
  expect(DECREE_BANNER_DURATION_MS).toBe(1500);
  const game=source('screens/GameBoard.tsx');
  const multiplayer=source('screens/MultiplayerCinematicCue.tsx');
  expect(game).toContain('waitForCue(DECREE_BANNER_DURATION_MS)');
  expect(multiplayer).toContain('turn ? 1750 : DECREE_BANNER_DURATION_MS');
  expect(source('screens/card-activation-banner.css')).toContain('--dr-cue-duration,1500ms');
  expect(source('screens/multiplayer.css')).toContain('.dr-pvp-cinematic.is-card');
});

test('combo ×2/×3 se lee por encima de la placa y su aviso lateral no queda debajo',()=>{
  const hud=source('screens/hud-g3.css');
  expect(hud).toContain('top:7.4%');
  expect(hud).toContain('top:6.6%');
  expect(source('screens/royal-table-v2.css')).toContain('top:clamp(-175px,-12dvh,-100px)');
});

test('marcos de ambos perfiles cubren su abertura y mazos centran el texto vivo',()=>{
  const hud=source('screens/hud-g3.css');
  const portrait=source('screens/royal-hud-art.css');
  expect(hud).toContain('top:15.5%');
  expect(hud).toContain('height:65.5%');
  expect(portrait).toContain('top:15.5%');
  expect(portrait).toContain('height:65.5%');
  expect(hud).toContain('.dr-royal-deck-back > .dr-g3-deck-copy > small');
  expect(hud).toContain('.dr-royal-deck-back > .dr-g3-deck-copy > span');
  expect(hud).toContain('transform:translate(-50%,-50%)');
});

test('el DOM del mazo y la elección de combo previenen los textos duplicados',()=>{
  const game=source('screens/GameBoard.tsx');
  const hud=source('screens/hud-g3.css');
  expect(game.match(/className="dr-g3-deck-copy"/g)).toHaveLength(2);
  expect(game).toContain('<small>MAZO</small><span>{opponentDeck.length}</span>');
  expect(game).toContain('<small>MAZO</small><span>{playerDeck.length}</span>');
  expect(hud).toContain('justify-content:center');
  expect(game).toContain("phase === 'PLAYER_TURN' && !showSpecialSelection");
});

test('la resolución de cartas en IA reproduce banner antes de la animación',()=>{
  const game=source('screens/GameBoard.tsx');
  expect(game).toContain("stage: 'banner'");
  expect(game).toContain("stage: 'effect'");
  expect(game.indexOf('await waitForCue(DECREE_BANNER_DURATION_MS)')).toBeLessThan(
    game.indexOf('await waitForCue(DECREE_EFFECT_DURATION_MS)'));
});
