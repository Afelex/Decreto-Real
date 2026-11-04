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
      <Route path="/campania/baraja" element={<h1>Colección mística</h1>} />
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
  expect(screen.getByText('El Sello y la Revolución Solar', { exact: false })).toBeTruthy();
  expect(document.querySelector('.dcm-screen')).toBeTruthy();
  expect(document.querySelector('.dcm-map-art')?.getAttribute('src')).toContain('prologo-ruta.svg');
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

test('winning the second prologue battle makes all eight general chapters selectable', () => {
  save({ '01': 2, '02': 1 });
  openMap();
  expect(screen.getByText('El puerto de hierro')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo anterior' }));
  expect(screen.getByText('El llamado del Sello')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo siguiente' }));
  expect(screen.getByText('El puerto de hierro')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 3:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 4:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente' }).hasAttribute('disabled')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo siguiente' }));
  expect(screen.getByText('Los caminos escarlata')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 7:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 8:/ }).hasAttribute('disabled')).toBe(true);
});

test('winning a general leaves other unlocked chapters available', () => {
  save({ '01': 1, '02': 1, '03': 1, '04': 1, '05': 1 });
  openMap();
  expect(screen.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 6:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: 'Capítulo siguiente' }).hasAttribute('disabled')).toBe(false);
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo siguiente' }));
  expect(screen.getByText('Los caminos escarlata')).toBeTruthy();
  expect(screen.getByRole('button', { name: /Misión 7:/ }).hasAttribute('disabled')).toBe(false);
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

test('the prologue removes redundant links and shows a direct return to the menu', () => {
  openMap();
  expect(screen.queryByRole('button', { name: 'Ver la historia' })).toBeNull();
  expect(screen.queryByRole('button', { name: 'Elegir capítulo por general' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al Menú' }));
  expect(screen.getByRole('heading', { name: 'Menú principal' })).toBeTruthy();
});


test('each selected general opens a dedicated four-mission region with an eight-zone return', () => {
  save({ '01': 1, '02': 1 });
  render(<MemoryRouter initialEntries={['/campania/region/2']}>
    <Routes>
      <Route path="/campania/region/:chapterId" element={<CampaignMap />} />
      <Route path="/campania/generales" element={<h1>Ocho regiones</h1>} />
      <Route path="/campania/mision/:missionId" element={<h1>Duelo de misión</h1>} />
      <Route path="/" element={<h1>Menú principal</h1>} />
    </Routes>
  </MemoryRouter>);
  expect(screen.getByText('Los caminos escarlata')).toBeTruthy();
  expect(document.querySelectorAll('.dcm-marker')).toHaveLength(4);
  expect(screen.getByRole('button', { name: /Misión 7:/ }).hasAttribute('disabled')).toBe(false);
  expect(screen.getByRole('button', { name: /Misión 8:/ }).hasAttribute('disabled')).toBe(true);
  expect(screen.queryByRole('button', { name: 'Capítulo siguiente' })).toBeNull();
  fireEvent.click(screen.getByRole('button', { name: 'Volver al mapa de las ocho zonas' }));
  expect(screen.getByRole('heading', { name: 'Ocho regiones' })).toBeTruthy();
});

test('selected mission shows all three star objectives without leaving the map', () => {
  openMap();
  fireEvent.click(screen.getByRole('button', { name: 'Ver objetivos del reto' }));
  const dialog = screen.getByRole('dialog', { name: 'El pregón alterado' });
  expect(dialog).toBeTruthy();
  expect(screen.getByText('Gana el combate')).toBeTruthy();
  expect(screen.getByText('Conserva al menos 12 de vida')).toBeTruthy();
  expect(screen.getByText('Gana en 10 rondas o menos')).toBeTruthy();
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

test('map atmosphere changes when the next region becomes available', () => {
  save({ '01': 1, '02': 1 });
  openMap();
  const map = document.querySelector<HTMLElement>('.dcm-region-map');
  expect(map?.getAttribute('data-region')).toBe('1');
  expect(document.querySelector('.dcm-region-watermark')).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo anterior' }));
  expect(map?.getAttribute('data-region')).toBe('p');
  fireEvent.click(screen.getByRole('button', { name: 'Capítulo siguiente' }));
  expect(map?.getAttribute('data-region')).toBe('1');
  expect(screen.getByRole('button', { name: /Misión 4:/ }).hasAttribute('disabled')).toBe(true);
});


test('every independent chapter renders its own landscape artwork and four touch targets', () => {
  for (let chapterId = 1; chapterId <= 8; chapterId++) {
    save({ '01': 1, '02': 1 });
    const view = render(<MemoryRouter initialEntries={[`/campania/region/${chapterId}`]}>
      <Routes>
        <Route path="/campania/region/:chapterId" element={<CampaignMap />} />
        <Route path="/" element={<h1>Menú principal</h1>} />
      </Routes>
    </MemoryRouter>);
    const map = document.querySelector('.dcm-region-map');
    expect(map?.getAttribute('data-region-art')).toBe(String(chapterId));
    expect(map?.querySelector('.dcm-map-art')?.getAttribute('src')).toContain(`arte/fondos/region-${chapterId}-base.webp`);
    expect(map?.querySelectorAll('.dcm-marker')).toHaveLength(4);
    expect(map?.querySelector('.dcm-map-art')?.getAttribute('alt')?.length).toBeGreaterThan(25);
    view.unmount();
  }
});

test('the final chapter has its own Casa del Sello map and is sealed until eight generals fall', () => {
  save({ '01': 1, '02': 1 });
  const locked = render(<MemoryRouter initialEntries={['/campania/region/f']}>
    <Routes><Route path="/campania/region/:chapterId" element={<CampaignMap />} /></Routes>
  </MemoryRouter>);
  expect(screen.getByRole('heading', { name: 'Región aún bloqueada' })).toBeTruthy();
  locked.unmount();
  save(Object.fromEntries(Array.from({length:34},(_,i)=>[String(i+1).padStart(2,'0'),1])));
  const unlocked = render(<MemoryRouter initialEntries={['/campania/region/f']}>
    <Routes><Route path="/campania/region/:chapterId" element={<CampaignMap />} /></Routes>
  </MemoryRouter>);
  expect(document.querySelector('.dcm-region-map')?.getAttribute('data-region-art')).toBe('f');
  expect(document.querySelector('.dcm-map-art')?.getAttribute('src')).toContain('arte/fondos/region-f-base.webp');
  expect(document.querySelectorAll('.dcm-marker')).toHaveLength(4);
  unlocked.unmount();
});
