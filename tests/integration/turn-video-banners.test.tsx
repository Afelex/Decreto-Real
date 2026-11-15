import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render } from '@testing-library/react';
import { TurnAnnouncement, TurnIndicator, TURN_TRANSITION_DURATION_MS } from '../../screens/CombatEventUI';
import { MultiplayerCinematicCue } from '../../screens/MultiplayerCinematicCue';

afterEach(() => { cleanup(); vi.useRealTimers(); });

test('la IA utiliza el clip transparente rojo en el turno propio', () => {
  const { container } = render(<TurnAnnouncement variant="player" turn={2}/>);
  expect(container.querySelector('source')?.getAttribute('src')).toContain('animaciones/banner-jugador-rojo.webm');
  expect(container.querySelector('video')).toBeTruthy();
});

test('la IA utiliza el clip transparente azul en el turno del rival', () => {
  const { container } = render(<TurnAnnouncement variant="opponent" turn={3}/>);
  expect(container.querySelector('source')?.getAttribute('src')).toContain('animaciones/banner-rival-azul.webm');
});

test('Studio conserva el avance estático editable del estandarte', () => {
  const { container } = render(<TurnAnnouncement variant="player" preview/>);
  expect(container.querySelector('video')).toBeNull();
  expect(container.querySelector('.dr-event-turn__ribbon')).toBeTruthy();
});

test('PvP utiliza el mismo WebM para los cambios de turno', () => {
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

test('el relevo visual de ambos turnos dura 1,5 s y acompasa el vídeo', () => {
  expect(TURN_TRANSITION_DURATION_MS).toBe(1500);
  for (const variant of ['player', 'opponent'] as const) {
    const { container, unmount } = render(<TurnAnnouncement variant={variant} turn={2}/>);
    const transition = container.querySelector('.dr-event-turn') as HTMLElement;
    expect(transition.style.animationDuration).toBe('1500ms');
    const video = transition.querySelector('video') as HTMLVideoElement;
    Object.defineProperty(video, 'duration', { configurable: true, value: 3 });
    fireEvent.loadedMetadata(video);
    expect(video.playbackRate).toBe(2); // Tres segundos de metraje en 1,5 reales.
    unmount();
  }
});

test('el indicador permanente es independiente de la transición de 1,5 s', () => {
  const { container } = render(<TurnIndicator side="PLAYER"/>);
  expect(container.querySelector('.dr-event-indicator')).toBeTruthy();
  expect(container.querySelector('.dr-event-turn')).toBeNull();
  expect(container.querySelector('video')).toBeNull();
});

test('el anuncio en pantalla completa sale del tablero estrecho y se desmonta', () => {
  const { unmount } = render(<TurnAnnouncement fullscreen variant="opponent" turn={1}/>);
  const layer = document.querySelector('.dr-turn-portal--opponent');
  expect(layer).toBeTruthy();
  expect(layer?.querySelector('.dr-event-turn--opponent')).toBeTruthy();
  expect(layer?.querySelector('source')?.getAttribute('src')).toContain('banner-rival-azul.webm');
  unmount();
  expect(document.querySelector('.dr-turn-portal')).toBeNull();
});
