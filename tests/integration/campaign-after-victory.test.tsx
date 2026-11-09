import React from 'react';
import { beforeEach, afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { AFTER_VICTORY, afterVictoryLines } from '../../campaign/afterVictory.ts';
import { CAMPAIGN_STORAGE_KEY, CAMPAIGN_MISSIONS } from '../../campaign/campaign.ts';
import CampaignAfterVictory, { CENTER_REVEAL_KEY } from '../../screens/CampaignAfterVictory';
import CampaignCenterReveal from '../../screens/CampaignCenterReveal';
import CampaignRegionMoment from '../../screens/CampaignRegionMoment';

function saveThrough(n: number) {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({
    version: 1, stars: Object.fromEntries(Array.from({ length: n }, (_, index) => [String(index + 1).padStart(2, '0'), 1])),
  }));
}
const at = (path: string) => render(<MemoryRouter initialEntries={[path]}><Routes>
  <Route path="/campania/conversacion/:missionId" element={<CampaignAfterVictory />} />
  <Route path="/campania/revelacion" element={<CampaignCenterReveal />} />
  <Route path="/campania/liberada/:chapterId" element={<CampaignRegionMoment mode="liberada" />} />
  <Route path="/campania/mision/:missionId" element={<h1>Próxima misión</h1>} />
  <Route path="/campania/generales" element={<h1>Mapa de los ocho generales</h1>} />
  <Route path="/campania/epilogo" element={<h1>Epílogo de la campaña</h1>} />
  <Route path="/campania" element={<h1>Mapa del prólogo</h1>} />
</Routes></MemoryRouter>);

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('all 38 victories have an authored post-victory conversation', () => {
  expect(Object.keys(AFTER_VICTORY)).toHaveLength(38);
  for (const mission of CAMPAIGN_MISSIONS) {
    const lines = afterVictoryLines(mission.id);
    expect(lines.length).toBeGreaterThanOrEqual(2);
    expect(lines.every(line => line.text.length > 20)).toBe(true);
    if (Number(mission.id) <= 35 && mission.id !== '22') {
      expect(lines.some(line => line.speaker === 'Zhinchi')).toBe(true);
    }
    if (mission.id === '22') {
      expect(lines.some(line => line.speaker === 'Nayisa')).toBe(true);
      expect(lines.every(line => line.speaker !== 'Zhinchi')).toBe(true);
    }
    if (Number(mission.id) >= 37) {
      expect(lines.some(line => line.speaker === 'Xervias')).toBe(true);
      expect(lines.every(line => line.speaker !== 'Zhinchi')).toBe(true);
    }
  }
});

test('prologue victory opens character exchange, then the next mission', () => {
  saveThrough(1);
  at('/campania/conversacion/01');
  expect(screen.getByRole('heading', { name: 'Xervias' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente diálogo ›' }));
  expect(screen.getByRole('heading', { name: 'Zhinchi' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Continuar historia ›' }));
  expect(screen.getByRole('heading', { name: 'Próxima misión' })).toBeTruthy();
});

test('mission two conversation leads to free general selection', () => {
  saveThrough(2);
  at('/campania/conversacion/02');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente diálogo ›' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar historia ›' }));
  expect(screen.getByRole('heading', { name: 'Mapa de los ocho generales' })).toBeTruthy();
});

test('a sealed mission conversation is not viewable by typing its URL', () => {
  at('/campania/conversacion/38');
  expect(screen.getByRole('heading', { name: 'Conversación bloqueada' })).toBeTruthy();
});

test('after the eighth general a previously hidden central reveal opens', () => {
  saveThrough(34);
  at('/campania/revelacion');
  expect(screen.getByRole('heading', { name: 'El centro ha despertado' })).toBeTruthy();
  for (let index = 0; index < 3; index++) {
    fireEvent.click(screen.getByRole('button', { name: 'Continuar diálogo ›' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Ver el mapa y elegir el centro ›' }));
  expect(window.localStorage.getItem(CENTER_REVEAL_KEY)).toBe('1');
  expect(screen.getByRole('heading', { name: 'Mapa de los ocho generales' })).toBeTruthy();
});

test('the center revelation does not open with only seven generals', () => {
  saveThrough(30);
  at('/campania/revelacion');
  expect(screen.getByRole('heading', { name: 'Mapa de los ocho generales' })).toBeTruthy();
});

test('after Zhinchi disappears, Xervias speaks alone in mission 37 and the epilogue follows 38', () => {
  saveThrough(38);
  const rendered = at('/campania/conversacion/37');
  expect(screen.getByRole('heading', { name: 'Xervias' })).toBeTruthy();
  expect(screen.queryByRole('heading', { name: 'Zhinchi' })).toBeNull();
  rendered.unmount();
  at('/campania/conversacion/38');
  for (let i = 1; i < afterVictoryLines('38').length; i++) {
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente diálogo ›' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Ver epílogo ›' }));
  expect(screen.getByRole('heading', { name: 'Epílogo de la campaña' })).toBeTruthy();
});

test('the fourth victory of a regional chapter gives the player a liberation scene', () => {
  saveThrough(6);
  at('/campania/conversacion/06');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente diálogo ›' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar historia ›' }));
  expect(screen.getByRole('heading', { name: 'Región liberada' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Marea de Hierro' })).toBeTruthy();
});

test('replaying the final conversation does not repeat an already seen liberation scene', () => {
  saveThrough(6);
  window.localStorage.setItem('decreto-real.campania.regiones-liberadas-presentadas.v1', JSON.stringify(['1']));
  at('/campania/conversacion/06');
  fireEvent.click(screen.getByRole('button', { name: 'Siguiente diálogo ›' }));
  fireEvent.click(screen.getByRole('button', { name: 'Continuar historia ›' }));
  expect(screen.getByRole('heading', { name: 'Mapa de los ocho generales' })).toBeTruthy();
});
