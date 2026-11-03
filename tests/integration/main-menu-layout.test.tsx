import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import MainMenu from '../../screens/MainMenu';

afterEach(() => cleanup());

test('the main menu keeps campaign and duel playable, but deck creation is unavailable', () => {
  render(<MemoryRouter initialEntries={['/']}>
    <Routes>
      <Route path="/" element={<MainMenu />} />
      <Route path="/game" element={<h1>Partida contra IA</h1>} />
      <Route path="/rules" element={<h1>Reglamento</h1>} />
      <Route path="/options" element={<h1>Configuración</h1>} />
    </Routes>
  </MemoryRouter>);
  expect(screen.getByRole('button', { name: 'Empezar campaña' })).toBeTruthy();
  const duel = screen.getByRole('button', { name: 'Duelo contra IA' });
  const deck = screen.getByRole('button', { name: 'Creación de baraja - No disponible' }) as HTMLButtonElement;
  expect(deck.disabled).toBe(true);
  expect(screen.getByText('No disponible')).toBeTruthy();
  const pair = document.querySelector('.dr-cinematic-actions-duo');
  expect(pair?.querySelectorAll('button')).toHaveLength(2);
  expect(pair?.querySelector('button[aria-label="Reglas"]')).toBeTruthy();
  expect(pair?.querySelector('button[aria-label="Opciones"]')).toBeTruthy();
  fireEvent.click(deck);
  expect(screen.getByRole('button', { name: 'Duelo contra IA' })).toBeTruthy();
  fireEvent.click(duel);
  expect(screen.getByRole('heading', { name: 'Partida contra IA' })).toBeTruthy();
});
