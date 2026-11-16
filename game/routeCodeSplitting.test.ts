import assert from 'node:assert/strict';
import test from 'node:test';
import { readFileSync } from 'node:fs';
import { CAMPAIGN_INTRO_KEY, PROLOGUE_CHECKPOINT_KEY } from '../campaign/campaignKeys.ts';

test('el menú no importa las pantallas de campaña, DRStudio ni el tablero directamente', () => {
  const menu=readFileSync('screens/MainMenu.tsx','utf8');
  const app=readFileSync('App.tsx','utf8');
  assert.ok(menu.includes("from '../campaign/campaignKeys'"));
  assert.ok(!menu.includes("from './CampaignIntro'"));
  assert.ok(!menu.includes("from './CampaignOpening'"));
  assert.ok(app.includes("React.lazy(() => import('./screens/GameBoard'))"));
  assert.ok(app.includes("React.lazy(() => import('./screens/MultiplayerScreen'))"));
  assert.ok(app.includes("React.lazy(() => import('./screens/CampaignOpening'))"));
  assert.ok(app.includes("React.lazy(() => import('./screens/studio/StudioScenesCatalog'))"));
});

test('la extracción no cambia las claves del progreso ya guardado', () => {
  assert.equal(CAMPAIGN_INTRO_KEY,'decreto-real.campania.introduccion.v1');
  assert.equal(PROLOGUE_CHECKPOINT_KEY,'decreto-real.campania.prologo-cinematico.v1');
});

test('se precargan sólo las imágenes prioritarias de la pantalla visible', () => {
  const document=readFileSync('index.html','utf8');
  assert.ok(document.includes("const poster = route === '/game'"));
  assert.ok(document.includes("route === '/' ? '/Decreto-Real/portada/portada-poster.jpg' : null"));
  assert.ok(!document.includes('<link rel="prefetch" as="video"'));
});
