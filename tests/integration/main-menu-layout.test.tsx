import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainMenu from '../../screens/MainMenu';

vi.mock('../../game/versusIaPreload', () => ({
  preloadVersusIa: vi.fn(async ({ onProgress }: { onProgress: (progress: { completed: number; total: number; label: string }) => void }) => {
    onProgress({ completed: 1, total: 1, label: 'Motor listo' });
  }),
}));

afterEach(() => cleanup());

const openMenu = () => render(<MemoryRouter initialEntries={['/']}>
  <Routes>
    <Route path="/" element={<MainMenu />} />
    <Route path="/game" element={<h1>Partida contra IA</h1>} />
    <Route path="/multijugador" element={<h1>Sala multijugador</h1>} />
  </Routes>
</MemoryRouter>);

test('the QA home menu exposes exactly the two duel modes', () => {
  openMenu();
  const menu = screen.getByRole('navigation', { name: 'Menú principal' });
  expect(menu.getAttribute('data-menu-mode')).toBe('qa-duelos');
  expect(menu.querySelectorAll('button')).toHaveLength(2);
  expect(screen.getByRole('button', { name: 'Versus IA' })).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Multijugador' })).toBeTruthy();
  for (const hidden of ['Empezar campaña', 'Creación de baraja - No disponible', 'Reglas', 'Opciones']) {
    expect(screen.queryByRole('button', { name: hidden })).toBeNull();
  }
});

test('QA menu enters a duel against the AI after preload', async () => {
  openMenu();
  fireEvent.click(screen.getByRole('button', { name: 'Jugar con la IA' }));
  expect(await screen.findByRole('heading', { name: 'Partida contra IA' })).toBeTruthy();
});

test('QA menu enters the multiplayer room', () => {
  openMenu();
  fireEvent.click(screen.getByRole('button', { name: 'Multijugador' }));
  expect(screen.getByRole('heading', { name: 'Sala multijugador' })).toBeTruthy();
});
