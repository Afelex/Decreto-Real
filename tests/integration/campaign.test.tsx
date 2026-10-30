import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignMap from '../../screens/CampaignMap';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';

function openMap() {
  return render(<MemoryRouter initialEntries={['/campania']}>
    <Routes>
      <Route path="/campania" element={<CampaignMap />} />
      <Route path="/campania/historia" element={<h1>Historia de Decreto Real</h1>} />
      <Route path="/campania/mision/:missionId" element={<h1>Duelo de misión</h1>} />
      <Route path="/" element={<h1>Menú principal</h1>} />
    </Routes>
  </MemoryRouter>);
}
function save(stars: Record<string, number>) {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({ version: 1, stars }));
}
beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('fullscreen campaign starts at challenge one, keeps second and next region locked', () => {
  openMap();
  expect(screen.getByRole('heading', { name: 'Campaña' })).toBeTruthy();
  expect(screen.getByText('El Sello y la Falsa Luz', { exact: false })).toBeTruthy();
  expect(document.querySelector('.dcm-screen')).toBeTruthy();
  expect(document.querySelector('.dcm-map-art')?.getAttribute('src')).toContain('virreinato-map.svg');
  expect(screen.getByRole('button', { name: /Misión 1:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 2:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente bloqueado' }).hasAttribute('disabled')).toBe(true);
  expect(document.querySelectorAll('.dcm-marker').length).toBe(2);
});

test('the prominent select challenge button enters the existing briefing route', () => {
  openMap();
  expect(screen.getByRole('button', { name: /Seleccionar reto/ })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: /Seleccionar reto/ }));
  expect(screen.getByRole('heading', { name: 'Duelo de misión' })).toBeTruthy();
});

test('winning a single challenge unlocks exactly the next but not its region', () => {
  save({ '01': 2 });
  openMap();
  const second = screen.getByRole('button', { name: /Misión 2:/ });
  expect(second.hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente bloqueado' }).hasAttribute('disabled')).toBe(true);
  fireEvent.click(second);
  expect(screen.getByRole('heading', { name: 'La orden sin sello' })).toBeTruthy();
  expect(screen.getByRole('img', { name: '0 de 3 estrellas' })).toBeTruthy();
});

test('winning the second prologue battle opens the next region and its first challenge only', () => {
  save({ '01': 2, '02': 1 });
  openMap();
  expect(screen.getByText('El puerto de hierro')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo anterior' }));
  expect(screen.getByText('El llamado del Sello')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo siguiente' }));
  expect(screen.getByText('El puerto de hierro')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 3:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 4:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente bloqueado' }).hasAttribute('disabled')).toBe(true);
});

test('winning a general does not allow skipping any subsequent region', () => {
  save({ '01': 1, '02': 1, '03': 1, '04': 1, '05': 1 });
  openMap();
  expect(screen.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 6:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente bloqueado' }).hasAttribute('disabled')).toBe(true);
});

test('invalid or out-of-order saved progression cannot skip the beginning', () => {
  save({ '05': 3, '38': 3 });
  openMap();
  expect(screen.getByRole('button', { name: /Misión 2:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente bloqueado' }).hasAttribute('disabled')).toBe(true);
});

test('corrupt local save opens a safe first challenge', () => {
  window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, '{invalid JSON');
  openMap();
  expect(screen.getByRole('button', { name: /Misión 1:/ })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 2:/ }).hasAttribute('disabled')).toBe(true);
});

test('the story and back buttons remain available without unlocking any mission', () => {
  openMap();
  fireEvent.click(screen.getByRole('button', { name: 'Ver la historia' }));
  expect(screen.getByText('Historia de Decreto Real')).toBeTruthy();
});

test('selected mission shows all three star objectives without leaving the map', () => {
  openMap();
  fireEvent.click(screen.getByRole('button', { name: 'Ver objetivos del reto' }));
  const dialog = screen.getByRole('dialog', { name: 'El pregón alterado' });
  expect(dialog).toBeTruthy();
  expect(screen.getByText('Gana el duelo')).toBeTruthy();
  expect(screen.getByText('Conserva al menos 12 de vida')).toBeTruthy();
  expect(screen.getByText('Vence hasta el turno 10')).toBeTruthy();
  expect(screen.getByRole('button', { name: 'Cerrar objetivos' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Cerrar objetivos' }));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('mission objectives change with the selected unlocked challenge', () => {
  save({ '01': 1 });
  openMap();
  fireEvent.click(screen.getByRole('button', { name: /Misión 2:/ }));
  fireEvent.click(screen.getByRole('button', { name: 'Ver objetivos del reto' }));
  expect(screen.getByRole('dialog', { name: 'La orden sin sello' })).toBeTruthy();
  fireEvent.click(within(screen.getByRole('dialog')).getByRole('button', { name: /Seleccionar reto/ }));
  expect(screen.getByRole('heading', { name: 'Duelo de misión' })).toBeTruthy();
});

test('map progress bar counts verified wins, not forged later stars', () => {
  save({ '01': 1, '38': 3 });
  openMap();
  const bar = screen.getByRole('progressbar', { name: 'Retos superados' });
  expect(bar.getAttribute('aria-valuenow')).toBe('1');
  expect(bar.getAttribute('aria-valuemax')).toBe('38');
  expect(screen.getByText(/1\/2 retos · ★ 1\/114/)).toBeTruthy();
});
