import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VictoryScreen from '../../screens/VictoryScreen';

vi.mock('../../contexts/AudioContext', () => ({
  useAudio: () => ({ playSound: vi.fn() }),
}));

afterEach(() => { cleanup(); vi.restoreAllMocks(); });

function openResult(state: {
  outcome: 'VICTORY' | 'DEFEAT';
  turnCount: number;
  playerHP: number;
  playerImpactLevel: number;
}) {
  return render(<MemoryRouter initialEntries={[{ pathname: '/victory', state }]}>
    <Routes>
      <Route path="/victory" element={<VictoryScreen />} />
      <Route path="/game" element={<h1>Duelo</h1>} />
      <Route path="/" element={<h1>Menú inicial</h1>} />
    </Routes>
  </MemoryRouter>);
}

test('victory uses the supplied final art with genuine stats and only two actions', () => {
  openResult({ outcome:'VICTORY',turnCount:8,playerHP:12,playerImpactLevel:4 });
  expect(screen.getByRole('main',{name:'Resultado de la partida: victoria'})).toBeTruthy();
  expect(document.querySelector('.dr-result-screen__scene')?.getAttribute('src')).toContain('final/victoria.webp');
  expect(screen.getByText('Turnos')).toBeTruthy();
  expect(screen.getByText('8')).toBeTruthy();
  expect(screen.getByText('12')).toBeTruthy();
  expect(screen.getByText('4')).toBeTruthy();
  expect(screen.queryByText('2,450')).toBeNull();
  expect(document.querySelector('.dr-victory-portrait')).toBeNull();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button',{name:'Jugar de nuevo'}));
  expect(screen.getByRole('heading',{name:'Duelo'})).toBeTruthy();
});

test('defeat shows the destroyed scene and retains the main menu action', () => {
  openResult({ outcome:'DEFEAT',turnCount:11,playerHP:0,playerImpactLevel:2 });
  expect(screen.getByRole('main',{name:'Resultado de la partida: derrota'})).toBeTruthy();
  expect(document.querySelector('.dr-result-screen__scene')?.getAttribute('src')).toContain('final/derrota.webp');
  expect(screen.getByText('11')).toBeTruthy();
  expect(screen.getByText('0')).toBeTruthy();
  expect(screen.getAllByRole('button')).toHaveLength(2);
  fireEvent.click(screen.getByRole('button',{name:'Menú principal'}));
  expect(screen.getByRole('heading',{name:'Menú inicial'})).toBeTruthy();
});
