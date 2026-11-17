import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameBoard from '../../screens/GameBoard';
import { HpDeltaCue, HP_DELTA_CUE_MS, RoyalHpMeter } from '../../screens/RoyalHpMeter';

vi.mock('../../contexts/AudioContext', () => {
  const audio={
    playSound:vi.fn(),sfxEnabled:false,musicEnabled:false,
    toggleSfx:vi.fn(),toggleMusic:vi.fn(),setNarrativeMusicMode:vi.fn(),
    setNarrativeMusicTrack:vi.fn(),
    setMusicScene:vi.fn(),
  };
  return {useAudio:()=>audio,useOptionalAudio:()=>audio};
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

const advance = async (...steps: number[]) => {
  for (const ms of steps) await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
};
const root = () => document.querySelector('.dr-royal-screen') as HTMLElement;
const life = (name: RegExp) => Number(screen.getByRole('progressbar', { name }).getAttribute('aria-valuenow'));

test('la cifra flotante aparece una sola vez por cada cambio real de vida', async () => {
  vi.useFakeTimers();
  const view = render(<HpDeltaCue hp={20} side="player"/>);
  expect(view.container.querySelector('.dr-royal-hp-delta')).toBeNull();
  view.rerender(<HpDeltaCue hp={18} side="player"/>);
  let cues = view.container.querySelectorAll('.dr-royal-hp-delta');
  expect(cues).toHaveLength(1);
  expect(cues[0].textContent).toBe('−2');
  expect(cues[0].classList.contains('dr-royal-hp-delta--damage')).toBe(true);
  // Un render sin cambio de vida no repite la cifra.
  view.rerender(<HpDeltaCue hp={18} side="player"/>);
  expect(view.container.querySelectorAll('.dr-royal-hp-delta')).toHaveLength(1);
  view.rerender(<HpDeltaCue hp={19} side="player"/>);
  cues = view.container.querySelectorAll('.dr-royal-hp-delta');
  expect(cues).toHaveLength(1);
  expect(cues[0].textContent).toBe('+1');
  expect(cues[0].classList.contains('dr-royal-hp-delta--heal')).toBe(true);
  await advance(HP_DELTA_CUE_MS);
  expect(view.container.querySelector('.dr-royal-hp-delta')).toBeNull();
});

test('la placa conserva el texto «HP: n/máx» y añade el rastro del daño', () => {
  const view = render(<RoyalHpMeter hp={7} maxHp={20} side="opponent"/>);
  expect(view.container.querySelector('.dr-royal-hp__label')?.textContent).toBe('HP: 7/20');
  expect(view.container.querySelector('.dr-royal-hp__label b')?.textContent).toBe('7');
  const ghost = view.container.querySelector('.dr-royal-hp__ghost') as HTMLElement;
  const fill = view.container.querySelector('.dr-royal-hp__fill') as HTMLElement;
  expect(ghost.style.width).toBe(fill.style.width);
  // El rastro queda DEBAJO del relleno real.
  expect(ghost.compareDocumentPosition(fill) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
});

test('el HUD sigue las fases y el Impacto aplica su daño exactamente una vez', async () => {
  vi.useFakeTimers();
  // Conserva el orden del mazo: la mano inicial contiene Impacto I.
  vi.spyOn(Math, 'random').mockReturnValue(.999);
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  expect(root().getAttribute('data-hud-mode')).toBe('coin');
  expect(root().hasAttribute('data-cue-tier')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Lanzar Moneda' }));
  await advance(500, 450);
  expect(root().getAttribute('data-hud-mode')).toBe('handoff');
  await advance(1500, 1500);
  expect(root().getAttribute('data-hud-mode')).toBe('player');

  fireEvent.click(screen.getByRole('button', { name: /Impacto I:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Casilla Impacto I' }));
  expect(root().getAttribute('data-hud-mode')).toBe('cue');
  expect(root().getAttribute('data-cue-tier')).toBe('special');
  // Durante el anuncio la vida todavía no cambia ni hay cifra flotante.
  expect(life(/Vida del rival:/)).toBe(20);
  expect(document.querySelector('.dr-royal-hp-delta')).toBeNull();

  await advance(1500, 1500, 50);
  expect(root().getAttribute('data-hud-mode')).toBe('player');
  expect(root().hasAttribute('data-cue-tier')).toBe(false);
  expect(life(/Vida del rival:/)).toBe(19);
  expect(life(/Tu vida:/)).toBe(20);
  const cues = document.querySelectorAll('.dr-royal-hp-delta');
  expect(cues).toHaveLength(1);
  expect(cues[0].getAttribute('data-hp-delta')).toBe('-1');
  expect(cues[0].closest('.dr-royal-rival-area')).toBeTruthy();

  // Pasado el aviso, ni la cifra ni el daño se repiten.
  await advance(HP_DELTA_CUE_MS, 1500);
  expect(document.querySelector('.dr-royal-hp-delta')).toBeNull();
  expect(life(/Vida del rival:/)).toBe(19);
  expect(life(/Tu vida:/)).toBe(20);
});

test('el resultado usa la cartela y el sello G3 y conserva el botón Continuar', async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(.999);
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  fireEvent.click(screen.getByRole('button', { name: 'Lanzar Moneda' }));
  await advance(500, 450, 1500, 1500);
  fireEvent.click(screen.getByRole('button', { name: 'Abrir menú de pausa' }));
  fireEvent.click(screen.getByRole('button', { name: /VICTORIA AUTOMÁTICA/ }));
  expect(root().getAttribute('data-hud-mode')).toBe('result');
  expect(root().getAttribute('data-hud-result')).toBe('victory');
  const dialog = screen.getByRole('dialog', { name: 'Victoria' });
  expect(dialog.querySelector('.dr-royal-end-cartela img')?.getAttribute('src')).toContain('ui_victoria_cartela_v01.webp');
  expect(dialog.querySelectorAll('.dr-royal-end-seal img[src*="ui_sello_resultado_v01.webp"]')).toHaveLength(2);
  expect(Array.from(dialog.querySelectorAll('.dr-royal-end-seal dt')).map(x => x.textContent)).toEqual(['Turnos', 'Tu vida']);
  expect(dialog.querySelector('.dr-royal-end-seal + .dr-royal-end-seal dd')?.textContent).toBe('20');
  expect(screen.getByRole('button', { name: 'Continuar' })).toBeTruthy();
});

test('los modos solo atenúan con opacity y respetan la reducción de movimiento', () => {
  const css = readFileSync('screens/hud-modes.css', 'utf8');
  expect(css).not.toContain('visibility:hidden');
  expect(css).toContain('[data-hud-mode="coin"] .dr-royal-activation-target');
  expect(css).toContain('[data-hud-mode="result"] .dr-royal-player-hand');
  expect(css).toContain('[data-cue-tier="normal"]');
  expect(css).toContain('[data-cue-tier="combo3"]');
  expect(css).toContain('@media (prefers-reduced-motion:reduce)');
  const game = readFileSync('screens/GameBoard.tsx', 'utf8');
  // El rótulo de racha no convive con un anuncio que la está recalculando.
  expect(game).toContain("phase === 'PLAYER_TURN' && !showSpecialSelection && !cueActive");
});
