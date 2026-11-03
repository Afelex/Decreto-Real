import React from 'react';
import { afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import RulesScreen from '../../screens/RulesScreen';

afterEach(cleanup);
test('rules describe the current 20 HP and 28 card duel with x2 and x3', () => {
  render(<MemoryRouter><RulesScreen /></MemoryRouter>);
  expect(screen.getByText(/20 puntos de vida y un mazo propio de 28 cartas/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cartas' }));
  expect(screen.getByText(/4 Decretos de Orden/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Acciones' }));
  expect(screen.getByText(/Orden: roba una carta adicional/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Combos' }));
  expect(screen.getByText(/COMBO ×2/)).toBeTruthy();
  expect(screen.getByText(/COMBO ×3/)).toBeTruthy();
});