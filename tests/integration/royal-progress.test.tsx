import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameBoard from '../../screens/GameBoard';

vi.mock('../../contexts/AudioContext', () => {
  const audio={
    playSound:vi.fn(),sfxEnabled:false,musicEnabled:false,
    toggleSfx:vi.fn(),toggleMusic:vi.fn(),setNarrativeMusicMode:vi.fn(),
    setNarrativeMusicTrack:vi.fn(),
  };
  return {useAudio:()=>audio,useOptionalAudio:()=>audio};
});
afterEach(() => { cleanup(); vi.useRealTimers(); vi.restoreAllMocks(); });

test('rival row follows a real AI Impact while player slots remain independent', async () => {
  vi.useFakeTimers();
  // Preserve deck order so both hands start with Impact I–IV.
  const random = vi.spyOn(Math, 'random').mockReturnValue(.999);
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  const row = screen.getByRole('group', { name: 'Progreso de impactos del rival: 0 de 4' });
  expect(within(row).getAllByRole('img')).toHaveLength(4);
  expect(within(row).queryAllByRole('button')).toHaveLength(0);
  random.mockReturnValue(0); // Rival wins the coin toss.
  fireEvent.click(screen.getByRole('button', { name: 'Lanzar Moneda' }));
  for (const ms of [1500, 1500, 2000, 1500, 1000, 2500]) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }
  expect(screen.getByRole('group', { name: 'Progreso de impactos del rival: 1 de 4' })).toBeTruthy();
  expect(within(row).getByRole('img', { name: 'Impacto rival I, completado' })).toBeTruthy();
  expect(row.querySelectorAll('.completed')).toHaveLength(1);
  const player = screen.getByRole('group', { name: 'Las cuatro posiciones de Impacto' });
  expect(within(player).getAllByRole('button')).toHaveLength(4);
  expect(player.querySelectorAll('.completed')).toHaveLength(0);
});

test('two Impacts across turns offer the one-point combo and preserve the streak', async () => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(.999);
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  expect(screen.getByLabelText('Tu vida: 20 de 20')).toBeTruthy();
  expect(screen.getByText('28', { selector: '.dr-royal-player-deck span' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Lanzar Moneda' }));
  for (const ms of [1500, 1500, 2000, 1500]) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }
  fireEvent.click(screen.getByRole('button', { name: /Impacto I:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Casilla Impacto I' }));
  expect(screen.getByRole('status', {name: /HAS ACTIVADO/})).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Terminar turno' }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
  fireEvent.click(screen.getByRole('button', { name: 'Terminar turno' }));
  for (const ms of [1500, 1000, 2500, 1500, 1500]) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }
  fireEvent.click(screen.getByRole('button', { name: /Impacto II:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Casilla Impacto II' }));
  await act(async () => { await vi.advanceTimersByTimeAsync(2500); });
  expect(screen.getByText('Combo ×2')).toBeTruthy();
  expect(screen.getByText('1 Daño al Rival')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Furia Real/ }));
  // The combo choice triggers a clip; the bonus waits until it finishes.
  expect(screen.getByRole('status', { name: /Combo ×2: Ataque/ })).toBeTruthy();
  expect((screen.getByRole('button', { name: 'Terminar turno' }) as HTMLButtonElement).disabled).toBe(true);
  await act(async () => { await vi.advanceTimersByTimeAsync(1000); });
  expect(screen.getByLabelText('Vida del rival: 18 de 20')).toBeTruthy();
  expect(screen.getByText('de Impacto')).toBeTruthy();
});

test('Order draws one replacement card without changing the starting 28-card deck', async () => {
  vi.useFakeTimers();
  const random = vi.spyOn(Math, 'random').mockImplementationOnce(() => 0).mockReturnValue(.999);
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  random.mockReturnValue(.999);
  fireEvent.click(screen.getByRole('button', { name: 'Lanzar Moneda' }));
  for (const ms of [1500, 1500, 2000, 1500]) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }
  const before = screen.getByLabelText(/Tu mano:/).querySelectorAll('.dr-royal-hand-card').length;
  const deckBefore = Number(document.querySelector('.dr-royal-player-deck span')?.textContent);
  fireEvent.click(screen.getByRole('button', { name: /Decreto de Orden:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Campo para activar Ataque, Defensa, Orden o Mística' }));
  expect(screen.getByRole('status', {name: /HAS ACTIVADO/})).toBeTruthy();
  const orderVideo = document.querySelector<HTMLVideoElement>('.dr-cinematic-overlay--energy video');
  expect(orderVideo?.querySelector('source')?.getAttribute('src')).toContain('/efectos/orden.webm');
  expect(orderVideo?.muted).toBe(true); // Mocked test preferences disable SFX.
  await act(async () => { await vi.advanceTimersByTimeAsync(1050); });
  expect(screen.queryByRole('status', { name: /HAS ACTIVADO/ })).toBeNull();
  expect(screen.getByLabelText(/Tu mano:/).querySelectorAll('.dr-royal-hand-card')).toHaveLength(before);
  expect(Number(document.querySelector('.dr-royal-player-deck span')?.textContent)).toBe(deckBefore - 1);
});


test('standard duel uses the two local portraits with the same frame component', () => {
  render(<MemoryRouter><GameBoard /></MemoryRouter>);
  const player = screen.getByRole('img', { name: 'Retrato de tu personaje' }) as HTMLImageElement;
  const rival = screen.getByRole('img', { name: 'Retrato del rival' }) as HTMLImageElement;
  expect(player.getAttribute('src')).toContain('retratos/jugador.webp');
  expect(rival.getAttribute('src')).toContain('retratos/rival.webp');
  expect(player.closest('.dr-royal-character-frame')).toBeTruthy();
  expect(rival.closest('.dr-royal-character-frame')).toBeTruthy();
});
