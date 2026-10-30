import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignStory from '../../screens/CampaignStory';
import CampaignMission from '../../screens/CampaignMission';
import CampaignEpilogue from '../../screens/CampaignEpilogue';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';

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
  expect(screen.getByText('Tu personaje (X)')).toBeTruthy();
  expect(screen.getByText('Zero')).toBeTruthy();
  expect(screen.getByText('Vile')).toBeTruthy();
  expect(screen.getByText('Sigma')).toBeTruthy();
  expect(document.querySelectorAll('.dc-general-list > div').length).toBe(8);
});

test('a reachable mission opens a story briefing before the battle', () => {
  screenAt('/campania/mision/01');
  expect(screen.getByRole('heading', { name: 'El pregón alterado' })).toBeTruthy();
  expect(screen.getByText('Guardia del pregón.', { exact: false })).toBeTruthy();
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
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars: { '38': 1 } }));
  screenAt('/campania/epilogo');
  expect(screen.getByRole('heading', { name: 'El Sello permanece' })).toBeTruthy();
  expect(screen.getByText(/Sigma, que conocía parte del engaño/)).toBeTruthy();
  expect(screen.getByText(/Zero desapareció gravemente herido/)).toBeTruthy();
});
