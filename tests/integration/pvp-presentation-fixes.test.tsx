import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { DuelEntrance } from '../../screens/DuelEntrance';
import { MultiplayerCinematicCue } from '../../screens/MultiplayerCinematicCue';
import { readFileSync } from 'node:fs';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test('the official IA entrance presents real PvP names and closes once', async () => {
  vi.useFakeTimers();
  const end = vi.fn();
  const { container } = render(<DuelEntrance
    playerPortrait="/xervias.webp" rivalPortrait="/rival.webp"
    playerName="Alfredo" rivalName="Investigador B"
    ariaLabel="Presentación del duelo multijugador"
    onFinish={end}/>);
  expect(container.querySelector('[data-testid="duel-entrance"]')?.getAttribute('aria-label'))
    .toBe('Presentación del duelo multijugador');
  expect(Array.from(container.querySelectorAll('figcaption')).map(node => node.textContent))
    .toEqual(['Alfredo', 'Investigador B']);
  await act(async () => { vi.advanceTimersByTime(3550); });
  expect(end).toHaveBeenCalledTimes(1);
});

test('the PvP opening cue uses the approved duel entrance, not a generic overlay', () => {
  const { container } = render(<MultiplayerCinematicCue
    cue={{ kind:'intro', id:0 }} myName="Alfredo" rivalName="Investigador B"
    onEnded={vi.fn()}/>);
  expect(container.querySelector('[data-testid="duel-entrance"]')).toBeTruthy();
  expect(container.querySelector('.dr-duel-entrance__gate--left')).toBeTruthy();
});

test('decree SFX begins on the effect stage, not on WebSocket arrival', async () => {
  vi.useFakeTimers();
  const sfx = vi.fn(), finish = vi.fn();
  const { container } = render(<MultiplayerCinematicCue
    cue={{ kind:'card', id:22, isPlayer:true, cardType:'ATTACK' }}
    onEnded={finish} onEffectStarted={sfx}/>);
  expect(container.querySelector('[data-decree-stage]')?.getAttribute('data-decree-stage')).toBe('banner');
  expect(sfx).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(1499); });
  expect(sfx).not.toHaveBeenCalled();
  await act(async () => { await vi.advanceTimersByTimeAsync(1); });
  expect(container.querySelector('[data-decree-stage]')?.getAttribute('data-decree-stage')).toBe('effect');
  expect(sfx).toHaveBeenCalledTimes(1);
  expect(sfx.mock.calls[0][0]).toMatchObject({ kind:'card', cardType:'ATTACK' });
  await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
  expect(finish).toHaveBeenCalledTimes(1);
  expect(sfx).toHaveBeenCalledTimes(1);
});

test('PVP central messages never stack and decree badges remain below the hand', () => {
  const board = readFileSync('screens/MultiplayerBattleBoard.tsx','utf8');
  const css = readFileSync('screens/multiplayer-board.css','utf8');
  expect(board).not.toContain('dr-pvp-live-summary');
  expect(board).toContain('cinematicCue || finished ? null');
  expect(board).toContain('dr-pvp-target-hidden');
  expect(css).toContain('.dr-royal-player-area > .dr-last-decree-stack');
  expect(css).toContain('bottom:auto');
  expect(css).toContain('.dr-royal-hp__label');
});
