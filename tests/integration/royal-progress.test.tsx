import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import GameBoard from '../../screens/GameBoard';

vi.mock('../../contexts/AudioContext', () => ({ useAudio: () => ({
  playSound: vi.fn(), sfxEnabled: false, musicEnabled: false,
  toggleSfx: vi.fn(), toggleMusic: vi.fn(),
}) }));
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
  for (const ms of [1500, 1500, 2000, 1500, 2000]) {
    await act(async () => { await vi.advanceTimersByTimeAsync(ms); });
  }
  expect(screen.getByRole('group', { name: 'Progreso de impactos del rival: 1 de 4' })).toBeTruthy();
  expect(within(row).getByRole('img', { name: 'Impacto rival I, completado' })).toBeTruthy();
  expect(row.querySelectorAll('.completed')).toHaveLength(1);
  const player = screen.getByRole('group', { name: 'Las cuatro posiciones de Impacto' });
  expect(within(player).getAllByRole('button')).toHaveLength(4);
  expect(player.querySelectorAll('.completed')).toHaveLength(0);
});
