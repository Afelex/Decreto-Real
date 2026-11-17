import React from 'react';
import { afterEach, expect, test, vi } from 'vitest';
import { cleanup, render } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import VictoryScreen from '../../screens/VictoryScreen';

vi.mock('../../contexts/AudioContext', () => ({
  useAudio: () => ({ playSound: vi.fn(), setMusicScene: vi.fn() }),
}));

afterEach(() => cleanup());

for (const outcome of ['VICTORY', 'DEFEAT'] as const) {
  test('Versus IA muestra seis estadísticas reales al finalizar con ' + outcome, () => {
    const { container } = render(
      <MemoryRouter initialEntries={[{
        pathname: '/victory',
        state: {
          outcome, turnCount: 7, playerHP: 4, playerImpactLevel: 3,
          durationMs: 125000, healthRecovered: 6,
          damageDealt: 12, impactsSummoned: 3,
        },
      }]}>
        <Routes><Route path="/victory" element={<VictoryScreen/>}/></Routes>
      </MemoryRouter>,
    );
    const stats = container.querySelector('.dr-result-screen__stats')!;
    expect(stats.classList.contains('has-expanded-stats')).toBe(true);
    expect(Array.from(stats.querySelectorAll('dt')).map(node => node.textContent)).toEqual([
      'Turnos', 'Tiempo', 'Vida recuperada',
      'Daño realizado', 'Impactos convocados', 'Vida restante',
    ]);
    expect(Array.from(stats.querySelectorAll('dd')).map(node => node.textContent)).toEqual([
      '7', '2:05', '6', '12', '3', '4',
    ]);
    expect(container.querySelector('.dr-result-screen')?.classList.contains(
      outcome === 'VICTORY' ? 'is-victory' : 'is-defeat',
    )).toBe(true);
  });
}

test('un estado de navegación anterior no inventa métricas ausentes', () => {
  const { container } = render(
    <MemoryRouter initialEntries={[{ pathname: '/victory', state: {
      outcome: 'DEFEAT', turnCount: 2, playerHP: 0, playerImpactLevel: 1,
    } }]}>
      <Routes><Route path="/victory" element={<VictoryScreen/>}/></Routes>
    </MemoryRouter>,
  );
  expect(Array.from(container.querySelectorAll('.dr-result-screen__stats dd')).map(n => n.textContent)).toEqual([
    '2', '—', '—', '—', '1', '0',
  ]);
});
