import React from 'react';
import { afterEach, beforeEach, expect, test, vi } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignStory from '../../screens/CampaignStory';
import CampaignMission from '../../screens/CampaignMission';
import CampaignEpilogue from '../../screens/CampaignEpilogue';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';

vi.mock('../../screens/GameBoard', () => ({
  default: ({ onOutcome }: { onOutcome?: (result: { won: boolean; turns: number; health: number }) => void }) =>
    <section data-testid="original-board">
      <h2>Ritual de Inicio</h2>
      <button type="button" onClick={() => onOutcome?.({ won: true, turns: 7, health: 8 })}>Victoria original de prueba</button>
      <button type="button" onClick={() => onOutcome?.({ won: false, turns: 7, health: 0 })}>Derrota original de prueba</button>
    </section>,
}));

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

function screenAt(path: string) {
  return render(<MemoryRouter initialEntries={[path]}>
    <Routes>
      <Route path="/campania/historia" element={<CampaignStory />} />
      <Route path="/campania/mision/:missionId" element={<CampaignMission />} />
      <Route path="/campania/epilogo" element={<CampaignEpilogue />} />
      <Route path="/campania" element={<h1>Mapa de campaña</h1>} />
    </Routes>
  </MemoryRouter>);
}

test('the prologue introduces the four provisional characters and eight generals', () => {
  screenAt('/campania/historia');
  expect(screen.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Protagonistas' }));
  expect(screen.getByText('Tu personaje (X)')).toBeTruthy();
  expect(screen.getByText('Zero')).toBeTruthy();
  expect(screen.getByText('Vile')).toBeTruthy();
  expect(screen.getByText('Sigma')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Ocho generales' }));
  expect(document.querySelectorAll('.dc-general-list > div').length).toBe(8);
});

test('a reachable mission opens a story briefing before the battle', () => {
  screenAt('/campania/mision/01');
  expect(screen.getByRole('heading', { name: 'El pregón alterado' })).toBeTruthy();
  expect(screen.getByText(/Rival: Guardia del pregón/)).toBeTruthy();
  expect(screen.getByRole('button', { name: /Comenzar duelo/ })).toBeTruthy();
});

test('a locked boss cannot be opened by manually navigating to the URL', () => {
  screenAt('/campania/mision/06');
  expect(screen.getByRole('heading', { name: 'Misión no disponible' })).toBeTruthy();
});

test('the final scene requires the final mission to be completed', () => {
  screenAt('/campania/epilogo');
  expect(screen.getByRole('heading', { name: 'El epílogo sigue sellado' })).toBeTruthy();
});

test('the final mission victory reveals the canonical ending', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars: Object.fromEntries(Array.from({ length: 38 }, (_, i) => [String(i + 1).padStart(2, '0'), 1])) }));
  screenAt('/campania/epilogo');
  expect(screen.getByRole('heading', { name: 'El Sello permanece' })).toBeTruthy();
  expect(screen.getByText(/Sigma, que conocía parte del engaño/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente ›' }));
  expect(screen.getByText(/Zero desapareció gravemente herido/)).toBeTruthy();
});

test('a forged final result without preceding victories cannot reveal the epilogue', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars: { '38': 1 } }));
  screenAt('/campania/epilogo');
  expect(screen.getByRole('heading', { name: 'El epílogo sigue sellado' })).toBeTruthy();
});

test('the prologue encounter shows its own illustrated guard-post scenery', () => {
  screenAt('/campania/mision/01');
  const scene = document.querySelector<HTMLElement>('.dc-region-scene');
  expect(scene?.getAttribute('data-region')).toBe('p');
  expect(scene?.querySelector('svg')).toBeTruthy();
  expect(screen.getByText(/El puesto de guardia/)).toBeTruthy();
});

test('a reachable general receives the matching illustrated region and identification', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({
    version: 1, stars: Object.fromEntries([1, 2, 3, 4, 5].map(i => [String(i).padStart(2, '0'), 1])),
  }));
  screenAt('/campania/mision/06');
  expect(screen.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeTruthy();
  const scene = document.querySelector<HTMLElement>('.dc-region-scene');
  expect(scene?.getAttribute('data-region')).toBe('1');
  expect(scene?.querySelector('svg')).toBeTruthy();
  expect(screen.getByText(/GENERAL DE LA REGIÓN/)).toBeTruthy();
  expect(screen.getByText(/Bombardeo naval \(no jugable\)/)).toBeTruthy();
});

test('the campaign opens the original game, not the newly created DuelBoard', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({
    version: 1, stars: Object.fromEntries([1,2,3,4,5].map(i => [String(i).padStart(2, '0'), 1])),
  }));
  screenAt('/campania/mision/06');
  expect(screen.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeTruthy();
  expect(screen.getByText(/10 de vida, 10 ataques, 10 defensas, 4 Impactos, sin Mando/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Comenzar duelo/ }));
  expect(screen.getByTestId('original-board')).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Ritual de Inicio' })).toBeTruthy();
});

test('a real original-game victory unlocks the next mission and gives achievable stars', () => {
  screenAt('/campania/mision/01');
  fireEvent.click(screen.getByRole('button', { name: /Comenzar duelo/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Victoria original de prueba' }));
  expect(screen.getByRole('heading', { name: '¡Misión superada!' })).toBeTruthy();
  const saved = JSON.parse(window.localStorage.getItem(CAMPAIGN_STORAGE_KEY)!);
  expect(saved.stars['01']).toBe(3);
  expect(screen.getByRole('button', { name: 'Siguiente misión →' })).toBeTruthy();
});

test('a defeat with the original game cannot unlock the next challenge', () => {
  screenAt('/campania/mision/01');
  fireEvent.click(screen.getByRole('button', { name: /Comenzar duelo/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Derrota original de prueba' }));
  expect(screen.getByRole('heading', { name: 'Misión fallida' })).toBeTruthy();
  expect(window.localStorage.getItem(CAMPAIGN_STORAGE_KEY)).toBeNull();
});
