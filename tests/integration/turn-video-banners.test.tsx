import React from 'react';
import { readFileSync } from 'node:fs';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, render } from '@testing-library/react';
import { TurnAnnouncement, TurnIndicator, TURN_TRANSITION_DURATION_MS } from '../../screens/CombatEventUI';
import { MultiplayerCinematicCue } from '../../screens/MultiplayerCinematicCue';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test.each([
  ['player', 'banner-tu-turno.webp', 'Tu Turno'],
  ['opponent', 'banner-turno-rival.webp', 'Turno del Rival'],
] as const)('la transición %s usa una sola cinta, sin vídeo ni texto adicional', (variant, artwork, title) => {
  const { container } = render(<TurnAnnouncement variant={variant} turn={2}/>);
  const layer = container.querySelector('.dr-event-turn') as HTMLElement;
  const ribbon = layer.querySelector('.dr-event-turn__ribbon');
  expect(layer.getAttribute('aria-label')).toContain(title);
  expect(layer.style.animationDuration).toBe('1500ms');
  expect(ribbon).toBeTruthy();
  expect(ribbon?.className).not.toContain('--video');
  expect(layer.querySelector('video')).toBeNull();
  expect(layer.querySelectorAll('.dr-event-turn__ribbon')).toHaveLength(1);
  // Se utilizan los mismos dos artes aprobados de la partida.
  expect(readFileSync('screens/combat-events.css', 'utf8')).toContain(artwork);
});

test('Studio conserva la cinta estática editable', () => {
  const { container } = render(<TurnAnnouncement variant="player" preview/>);
  expect(container.querySelector('video')).toBeNull();
  expect(container.querySelector('.dr-event-turn--studio-preview .dr-event-turn__ribbon')).toBeTruthy();
});

test('PvP conserva su propio WebM para los cambios de turno', () => {
  const { container } = render(<MultiplayerCinematicCue
    cue={{ kind: 'turn', id: 1, isPlayer: false }} onEnded={() => {}}/>);
  expect(container.querySelector('source')?.getAttribute('src')).toContain('animaciones/banner-rival-azul.webm');
});

test('PvP primero presenta el banner y solo después la animación del decreto', async () => {
  vi.useFakeTimers();
  for (const [type, file] of [
    ['ATTACK', 'efectos/ataque.webm'],
    ['DEFENSE', 'efectos/defensa.webm'],
    ['ORDER', 'efectos/orden.webm'],
    ['IMPACT', null],
  ] as const) {
    const finished = vi.fn();
    const { container, unmount } = render(<MultiplayerCinematicCue
      cue={{ kind: 'card', id: 12, isPlayer: true, cardType: type, ...(type === 'IMPACT' ? { rank: 1 } : {}) }}
      onEnded={finished}/>);
    expect(container.querySelector('[data-decree-stage]')?.getAttribute('data-decree-stage')).toBe('banner');
    expect(container.querySelector('source')?.getAttribute('src')).toContain('animaciones/banner-jugador-rojo.webm');
    expect(container.querySelector('.dr-pvp-cinematic-copy')).toBeTruthy();
    await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    if (file) {
      expect(container.querySelector('[data-decree-stage]')?.getAttribute('data-decree-stage')).toBe('effect');
      expect(container.querySelector('source')?.getAttribute('src')).toContain(file);
      expect(container.querySelector('.dr-pvp-cinematic-copy')).toBeNull();
      expect(finished).not.toHaveBeenCalled();
      await act(async () => { await vi.advanceTimersByTimeAsync(1500); });
    }
    expect(finished).toHaveBeenCalledTimes(1);
    unmount();
  }
});

test('el aviso de ambos turnos dura 1,5 s y es independiente de la cinta persistente', () => {
  expect(TURN_TRANSITION_DURATION_MS).toBe(1500);
  for (const variant of ['player', 'opponent'] as const) {
    const { container, unmount } = render(<TurnAnnouncement variant={variant} turn={2}/>);
    expect((container.querySelector('.dr-event-turn') as HTMLElement).style.animationDuration).toBe('1500ms');
    expect(container.querySelector('video')).toBeNull();
    unmount();
  }
});

test('el indicador permanente no activa ninguna transición', () => {
  const { container } = render(<TurnIndicator side="PLAYER"/>);
  expect(container.querySelector('.dr-event-indicator')).toBeTruthy();
  expect(container.querySelector('.dr-event-turn')).toBeNull();
  expect(container.querySelector('video')).toBeNull();
});

test('el anuncio ocupa la pantalla completa con una única cinta y se desmonta', () => {
  const { unmount } = render(<TurnAnnouncement fullscreen variant="opponent" turn={1}/>);
  const layer = document.querySelector('.dr-turn-portal--opponent');
  expect(layer).toBeTruthy();
  expect(layer?.querySelector('.dr-event-turn--opponent')).toBeTruthy();
  expect(layer?.querySelectorAll('.dr-event-turn__ribbon')).toHaveLength(1);
  expect(layer?.querySelector('video')).toBeNull();
  unmount();
  expect(document.querySelector('.dr-turn-portal')).toBeNull();
});
