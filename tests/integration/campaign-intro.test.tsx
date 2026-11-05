import React from 'react';
import { afterEach,beforeEach,expect,test } from 'vitest';
import { cleanup,fireEvent,render,screen } from '@testing-library/react';
import { MemoryRouter,Route,Routes } from 'react-router-dom';
import CampaignIntro,{CAMPAIGN_INTRO_KEY} from '../../screens/CampaignIntro';
import { PROLOGUE_CHECKPOINT_KEY } from '../../screens/CampaignOpening';

beforeEach(()=>window.localStorage.clear());
afterEach(()=>cleanup());

test('campaign cover prioritizes one cinematic action instead of lore paragraphs',()=>{
  render(<MemoryRouter initialEntries={['/campania/inicio']}>
    <Routes><Route path="/campania/inicio" element={<CampaignIntro/>}/></Routes>
  </MemoryRouter>);
  expect(screen.getByRole('heading',{name:'El Sello y la Revolución Solar'})).toBeTruthy();
  expect(screen.getByText(/Dos decretos. Un mismo sello./)).toBeTruthy();
  expect(screen.getByRole('button',{name:'Abrir menú de campaña'})).toBeTruthy();
  expect(screen.getByRole('button',{name:/Comenzar historia/})).toBeTruthy();
  expect(document.querySelector('.dci-story')).toBeNull();
});

test('beginning starts the cinematic prologue and resets only its checkpoint',()=>{
  window.localStorage.setItem(PROLOGUE_CHECKPOINT_KEY,JSON.stringify({beat:10,duel:1,after:0}));
  render(<MemoryRouter initialEntries={['/campania/inicio']}>
    <Routes>
      <Route path="/campania/inicio" element={<CampaignIntro/>}/>
      <Route path="/campania/prologo" element={<h1>Prólogo cinematográfico</h1>}/>
    </Routes>
  </MemoryRouter>);
  fireEvent.click(screen.getByRole('button',{name:/Comenzar historia/}));
  expect(window.localStorage.getItem(CAMPAIGN_INTRO_KEY)).toBe('1');
  expect(window.localStorage.getItem(PROLOGUE_CHECKPOINT_KEY)).toBeNull();
  expect(screen.getByRole('heading',{name:'Prólogo cinematográfico'})).toBeTruthy();
});
