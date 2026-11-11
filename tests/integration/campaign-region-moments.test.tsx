import React from 'react';
import { beforeEach, afterEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignRegionMoment from '../../screens/CampaignRegionMoment';
import { STORY_CHAPTERS } from '../../campaign/story.ts';
import { g2AssetIsPublished, g2AssetPath, G2_REGION_BASE } from '../../campaign/g2Artwork.ts';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';
import {
  REGION_ENTRANCES_KEY, REGION_LIBERATIONS_KEY,
  hasSeenRegionMoment, rememberRegionMoment,
} from '../../campaign/regionJourney.ts';

const save = (ids: string[]) => window.localStorage.setItem(CAMPAIGN_STORAGE_KEY,
  JSON.stringify({ version: 1, stars: Object.fromEntries(ids.map(id => [id, 1])) }));
const first = (through: number) => Array.from({length:through},(_,i)=>String(i+1).padStart(2,'0'));

const at = (path: string) => render(<MemoryRouter initialEntries={[path]}>
  <Routes>
    <Route path="/campania/entrada/:chapterId" element={<CampaignRegionMoment mode="entrada" />} />
    <Route path="/campania/liberada/:chapterId" element={<CampaignRegionMoment mode="liberada" />} />
    <Route path="/campania/region/:chapterId" element={<h1>Mapa de cuatro misiones</h1>} />
    <Route path="/campania/generales" element={<h1>Mapa de ocho regiones</h1>} />
    <Route path="/campania/revelacion" element={<h1>El centro ha despertado</h1>} />
    <Route path="/" element={<h1>Menú principal</h1>} />
  </Routes>
</MemoryRouter>);

beforeEach(() => window.localStorage.clear());
afterEach(() => cleanup());

test('each of the eight territories presents four named, distinct missions and its own region illustration', () => {
  for (let n = 1; n <= 8; n++) {
    save(['01','02']);
    const view = at(`/campania/entrada/${n}`);
    const chapter = STORY_CHAPTERS.find(item => item.id === String(n))!;
    expect(screen.getByRole('heading', { name: chapter.title })).toBeTruthy();
    expect(document.querySelectorAll('.dcmoment-missions li')).toHaveLength(4);
    const g2Id = G2_REGION_BASE[String(n) as keyof typeof G2_REGION_BASE];
    const expectedPath = g2AssetIsPublished(g2Id) ? g2AssetPath(g2Id) : `campania/arte/fondos/region-${n}-base.webp`;
    expect(document.querySelector('.dcmoment-landscape>img')?.getAttribute('src')).toContain(expectedPath);
    expect(screen.getByText('Xervias:')).toBeTruthy();
    expect(screen.getByText('Zhinchi:')).toBeTruthy();
    view.unmount();
  }
});

test('the initial entry is recorded and is no longer shown after returning', () => {
  save(['01','02']);
  const firstView = at('/campania/entrada/5');
  fireEvent.click(screen.getByRole('button', { name: 'Ver las cuatro misiones ›' }));
  expect(screen.getByRole('heading', { name: 'Mapa de cuatro misiones' })).toBeTruthy();
  expect(hasSeenRegionMoment(window.localStorage, REGION_ENTRANCES_KEY, '5')).toBe(true);
  firstView.unmount();
  at('/campania/entrada/5');
  expect(screen.getByRole('heading', { name: 'Mapa de cuatro misiones' })).toBeTruthy();
});

test('an introduction is optional and can be replayed without changing campaign stars', () => {
  save(['01','02','03']);
  rememberRegionMoment(window.localStorage, REGION_ENTRANCES_KEY, '1');
  at('/campania/entrada/1?repetir=1');
  expect(screen.getByRole('heading', { name: 'El puerto de hierro' })).toBeTruthy();
  expect(screen.getByText('1 / 4 completadas')).toBeTruthy();
  expect(JSON.parse(window.localStorage.getItem(CAMPAIGN_STORAGE_KEY)!).stars['03']).toBe(1);
});

test('the liberation scene requires defeating the four regional missions', () => {
  save(first(5));
  at('/campania/liberada/1');
  expect(screen.getByRole('heading', { name: 'Mapa de ocho regiones' })).toBeTruthy();
});

test('beating a general reveals their sealed mystic card, then returns to free selection', () => {
  save(first(6));
  at('/campania/liberada/1');
  expect(screen.getByRole('heading', { name: 'Región liberada' })).toBeTruthy();
  expect(screen.getByRole('heading', { name: 'Marea de Hierro' })).toBeTruthy();
  expect(screen.getByText(/Carta sellada/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Elegir otra región ›' }));
  expect(hasSeenRegionMoment(window.localStorage, REGION_LIBERATIONS_KEY, '1')).toBe(true);
  expect(screen.getByRole('heading', { name: 'Mapa de ocho regiones' })).toBeTruthy();
});

test('beating the eighth general moves from liberation to the center revelation', () => {
  save(first(34));
  at('/campania/liberada/8');
  expect(screen.getByRole('heading', { name: 'Juramento Eterno' })).toBeTruthy();
  fireEvent.click(screen.getByRole('button', { name: 'Descubrir el escenario central ›' }));
  expect(hasSeenRegionMoment(window.localStorage, REGION_LIBERATIONS_KEY, '8')).toBe(true);
  expect(screen.getByRole('heading', { name: 'El centro ha despertado' })).toBeTruthy();
});

test('region transitions reject invalid IDs without unlocking anything', () => {
  save(['01','02']);
  at('/campania/entrada/f');
  expect(screen.getByRole('heading', { name: 'Mapa de ocho regiones' })).toBeTruthy();
  expect(rememberRegionMoment(window.localStorage, REGION_ENTRANCES_KEY, 'f')).toBe(false);
});

test('malformed presentation preferences cannot affect progress or duplicate IDs', () => {
  save(['01','02']);
  window.localStorage.setItem(REGION_ENTRANCES_KEY, 'invalid json');
  expect(rememberRegionMoment(window.localStorage, REGION_ENTRANCES_KEY, '3')).toBe(true);
  expect(rememberRegionMoment(window.localStorage, REGION_ENTRANCES_KEY, '3')).toBe(true);
  expect(JSON.parse(window.localStorage.getItem(REGION_ENTRANCES_KEY)!)).toEqual(['3']);
  expect(JSON.parse(window.localStorage.getItem(CAMPAIGN_STORAGE_KEY)!).stars['02']).toBe(1);
});
