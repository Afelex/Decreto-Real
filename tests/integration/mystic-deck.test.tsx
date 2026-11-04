import React from 'react';
import { afterEach, beforeEach, expect, test } from 'vitest';
import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import CampaignDeck from '../../screens/CampaignDeck';
import { CAMPAIGN_STORAGE_KEY } from '../../campaign/campaign.ts';
import { DECK_STORAGE_KEY } from '../../campaign/mysticDeck.ts';

beforeEach(() => window.localStorage.clear());
afterEach(cleanup);

const save = (through: number) => window.localStorage.setItem(CAMPAIGN_STORAGE_KEY, JSON.stringify({
  version:1,
  stars:Object.fromEntries(Array.from({length:through},(_,i)=>[String(i+1).padStart(2,'0'),1])),
}));

function renderDeck() {
  return render(<MemoryRouter initialEntries={['/campania/baraja']}>
    <Routes>
      <Route path="/campania/baraja" element={<CampaignDeck/>}/>
      <Route path="/campania" element={<h1>Mapa de campaña</h1>}/>
    </Routes>
  </MemoryRouter>);
}

test('colección visible desde el principio; editor protegido hasta misión 36',()=>{
  renderDeck();
  expect(screen.getByRole('heading',{name:'Cartas místicas'})).toBeTruthy();
  expect(screen.getByRole('button',{name:/Editar baraja/}).hasAttribute('disabled')).toBe(true);
  expect(screen.getByText('Místicas selladas')).toBeTruthy();
  expect(screen.getAllByText(/misión 36/).length).toBeGreaterThan(0);
});

test('cada general otorga una carta sellada sin habilitar editor',()=>{
  save(6);
  renderDeck();
  expect(screen.getByText(/1 cartas obtenidas/)).toBeTruthy();
  expect(screen.getByText(/Obtenida · Sellada/)).toBeTruthy();
  expect(screen.getByRole('button',{name:/Editar baraja/}).hasAttribute('disabled')).toBe(true);
});

test('los nombres y combos de cada mística se pueden consultar antes de equiparlas',()=>{
  save(6);
  renderDeck();
  fireEvent.click(screen.getByRole('button',{name:'Ver habilidad de Almirante de Hierro'}));
  expect(screen.getByRole('dialog',{name:'Habilidad Marea de Hierro'})).toBeTruthy();
  expect(screen.getByText('Combo ×2')).toBeTruthy();
  expect(screen.getByText('Combo ×3')).toBeTruthy();
  expect(screen.getByText('−3 vida rival · +2 vida propia')).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Cerrar detalles'}));
  expect(screen.queryByRole('dialog')).toBeNull();
});

test('el bastón desbloquea editor, limita tres espacios y guarda elecciones',()=>{
  save(36);
  renderDeck();
  expect(screen.getByText(/9 cartas obtenidas/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:/^Editar baraja$/}));
  expect(screen.getByRole('heading',{name:/Editar baraja · 0\/3/})).toBeTruthy();
  const first=screen.getByLabelText('Espacio 1') as HTMLSelectElement;
  fireEvent.change(first,{target:{value:'general-1'}});
  fireEvent.click(screen.getByRole('button',{name:'Ver efectos de Marea de Hierro'}));
  expect(screen.getByText('Marea de Hierro',{selector:'h2'})).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Entendido'}));
  fireEvent.change(document.querySelector('#mystic-replace-0')!,{target:{value:'DEFENSE'}});
  fireEvent.change(screen.getByLabelText('Espacio 2'),{target:{value:'general-2'}});
  fireEvent.change(screen.getByLabelText('Espacio 3'),{target:{value:'legado-zhinchi'}});
  expect(screen.getByRole('heading',{name:/Editar baraja · 3\/3/})).toBeTruthy();
  expect(screen.getByText(/Defensa: 9/)).toBeTruthy();
  fireEvent.click(screen.getByRole('button',{name:'Guardar baraja'}));
  const value=JSON.parse(window.localStorage.getItem(DECK_STORAGE_KEY)!);
  expect(value.slots).toHaveLength(3);
  expect(value.slots[0]).toEqual({mysticId:'general-1',replace:'DEFENSE'});
  expect(value.slots[2].mysticId).toBe('legado-zhinchi');
  expect(screen.getByText(/Baraja guardada/)).toBeTruthy();
});

test('no es posible seleccionar en dos espacios una misma mística',()=>{
  save(36);
  renderDeck();
  fireEvent.click(screen.getByRole('button',{name:/^Editar baraja$/}));
  fireEvent.change(screen.getByLabelText('Espacio 1'),{target:{value:'general-1'}});
  const second=screen.getByLabelText('Espacio 2') as HTMLSelectElement;
  expect(Array.from(second.options).some(option=>option.value==='general-1')).toBe(false);
});
