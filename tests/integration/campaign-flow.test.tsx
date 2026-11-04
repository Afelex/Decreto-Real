import React from 'react';
import { beforeEach, afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignBossSelect from '../../screens/CampaignBossSelect';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';

const save = (through: number) => {
  const stars = Object.fromEntries(Array.from({ length: through }, (_, i) => [String(i + 1).padStart(2, '0'), 1]));
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars }));
};
const openBosses = () => render(<MemoryRouter initialEntries={['/campania/generales']}>
  <Routes>
    <Route path="/campania" element={<h1>Prólogo pendiente</h1>} />
    <Route path="/campania/generales" element={<CampaignBossSelect />} />
    <Route path="/campania/region/:chapterId" element={<h1>Mapa regional</h1>} />
    <Route path="/" element={<h1>Menú principal</h1>} />
  </Routes>
</MemoryRouter>);

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('the eight generals cannot be selected before finishing both prologue missions', () => {
  save(1);
  openBosses();
  expect(screen.getByRole('heading', { name: 'Prólogo pendiente' })).toBeTruthy();
});

test('each general is introduced and a player can freely open the chosen regional map', () => {
  save(2);
  openBosses();
  expect(screen.getByText('CONVERSACIÓN · GENERAL 1 DE 8')).toBeTruthy();
  for (let index = 0; index < 7; index++) {
    fireEvent.click(screen.getByRole('button', { name: 'Siguiente general ›' }));
  }
  fireEvent.click(screen.getByRole('button', { name: 'Elegir capítulo ⚔' }));
  expect(screen.getByRole('button', { name: /Escenario central bloqueado/ }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(screen.getByRole('button', { name: /Leandro Valcázar, El Jinete Escarlata/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Explorar región ⚔' }));
  expect(screen.getByRole('heading', { name: 'Mapa regional' })).toBeTruthy();
});

test('the center unlocks only after all 8 bosses and 32 region missions are defeated', () => {
  save(34);
  window.localStorage.setItem('decreto-real.campania.generales-presentados.v1', '1');
  window.localStorage.setItem('decreto-real.campania.centro-revelado.v1', '1');
  openBosses();
  expect(screen.getByRole('button', { name: 'Entrar al escenario central desbloqueado' }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByLabelText('8 de 8 generales derrotados')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Entrar al escenario central desbloqueado' }));
  expect(screen.getByRole('heading', { name: 'Mapa regional' })).toBeTruthy();
});


test('existing advanced saves skip the first-time tour but can replay the eight general explanations', () => {
  save(6);
  openBosses();
  expect(screen.getByRole('button', { name: /Baltasar de Fierro/ })).toBeTruthy();
  expect(screen.queryByText('CONVERSACIÓN · GENERAL 1 DE 8')).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver a escuchar la presentación de los generales' }));
  expect(screen.getByText('CONVERSACIÓN · GENERAL 1 DE 8')).toBeTruthy();
});
