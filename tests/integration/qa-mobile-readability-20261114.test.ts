import { readFileSync } from 'node:fs';
import { expect, test } from 'vitest';

const read=(path:string)=>readFileSync(path,'utf8');

test('combo ×2 y ×3 están centrados en la cartela roja del arte G3',()=>{
  const hud=read('screens/hud-g3.css');
  const combo=read('screens/combat-events.css');
  expect(hud).toContain('top:21.5%');
  expect(combo).toContain('top:21.5%');
  expect(hud).toContain('transform:translate(-50%,-50%)');
  expect(combo).toContain('white-space:nowrap');
});

test('las facciones roja y azul comparten texto grande centrado en el vídeo',()=>{
  const css=read('screens/card-activation-banner.css');
  expect(css).toContain('[data-decree-stage="banner"].player .dr-cinematic-copy');
  expect(css).toContain('[data-decree-stage="banner"].rival .dr-cinematic-copy');
  expect(css).toContain('top:50%');
  expect(css).toContain('font:900 clamp(23px,6.65cqw,40px)');
  expect(css).toContain('transform:translate(-50%,-50%) rotate(-12deg)');
});

test('MAZO se sitúa en la plaquita inferior y los números en la zona superior',()=>{
  const css=read('screens/hud-g3.css');
  expect(css).toContain('.dr-royal-deck-back > .dr-g3-deck-copy > small');
  expect(css).toContain('top:83%');
  expect(css).toContain('.dr-royal-deck-back > .dr-g3-deck-copy > span');
  expect(css).toContain('top:47%');
});

test('indicadores muestran multiplicadores sin colocar otro banner flotante',()=>{
  const screen=read('screens/GameBoard.tsx');
  const indicator=read('screens/LastDecreeIndicator.tsx');
  expect(screen).toContain('setPlayerLastDecreeLevel(nextDecreeStreak');
  expect(screen).toContain('setOpponentLastDecreeLevel(nextDecreeStreak');
  expect(indicator).toContain('dr-last-decree-combo');
  expect(indicator).toContain('comboLevel > 1');
});
