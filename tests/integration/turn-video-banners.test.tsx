import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { TurnAnnouncement } from '../../screens/CombatEventUI';
import { MultiplayerCinematicCue } from '../../screens/MultiplayerCinematicCue';

afterEach(cleanup);

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

test('PvP presenta cada decreto con su vídeo alfa original', () => {
  for (const [type, file] of [
    ['ATTACK', 'efectos/ataque.webm'],
    ['DEFENSE', 'efectos/defensa.webm'],
    ['ORDER', 'efectos/orden.webm'],
    ['IMPACT', 'animaciones/banner-jugador-rojo.webm'],
  ] as const) {
    const { container, unmount } = render(<MultiplayerCinematicCue
      cue={{ kind: 'card', id: 12, isPlayer: true, cardType: type, ...(type === 'IMPACT' ? { rank: 1 } : {}) }}
      onEnded={() => {}}/>);
    expect(container.querySelector('source')?.getAttribute('src')).toContain(file);
    unmount();
  }
});
