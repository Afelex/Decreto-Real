import { test, expect, type Page } from '@playwright/test';
import { scenario } from '../scenarios';
import { applyCombatAction, createCombat, invalidAction, type CombatState } from '../../game/combatEngine';
import { createTutorialCombat } from '../../game/tutorial';

const TUTORIAL_KEY = 'decreto-real.duelo-v1.tutorial';
/** Storage is reset once per test, not on reloads, so recovery can be tested; the tutorial offer is pre-answered. */
async function open(page: Page, seed = 0, { path = 'duelo-v1', offerTutorial = false } = {}) {
  await page.addInitScript(({ seed, key, offerTutorial }) => {
    if (!sessionStorage.getItem('e2e-ready')) {
      localStorage.clear(); sessionStorage.setItem('e2e-ready', '1');
      if (!offerTutorial) localStorage.setItem(key, 'omitido');
    }
    Object.defineProperty(crypto, 'getRandomValues', { value: (array: Uint32Array) => { array[0] = seed; return array; } });
  }, { seed, key: TUTORIAL_KEY, offerTutorial });
  await page.goto(`/Decreto-Real/#/${path}`);
  await expect(page.getByRole('heading', { name: 'Decreto Real', exact: true })).toBeVisible();
}
async function insideViewport(page: Page, locator: ReturnType<Page['locator']>, label: string) {
  await locator.scrollIntoViewIfNeeded();
  const box = (await locator.boundingBox())!; const viewport = page.viewportSize()!;
  expect(box, label).not.toBeNull();
  expect(box.x, label).toBeGreaterThanOrEqual(0); expect(box.y, label).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width, label).toBeLessThanOrEqual(viewport.width + 0.5);
  expect(box.y + box.height, label).toBeLessThanOrEqual(viewport.height + 0.5);
}
async function tapCard(page: Page, name: string) {
  const card = page.getByRole('button', { name: new RegExp(`^${name}, coste`) });
  await insideViewport(page, card, name); await card.tap();
}
async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('touch selection, confirmation, rival response, pause and dialogs fit the viewport', async ({ page }, testInfo) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page); await noPageOverflow(page);
  await page.screenshot({ path: testInfo.outputPath('board.png'), fullPage: true });
  const state = createCombat(0);
  const index = state.hand.findIndex(card => card.cost <= state.mana && card.kind !== 'impact');
  const card = page.locator('.dr-card').nth(index);
  await card.scrollIntoViewIfNeeded(); await card.tap();
  await expect(card).toHaveAttribute('aria-pressed', 'true');
  const confirm = page.getByRole('button', { name: 'Jugar carta' });
  await expect(confirm).toBeVisible(); await confirm.tap();
  await noPageOverflow(page);
  await page.getByRole('button', { name: /TERMINAR TURNO/ }).tap();
  await expect(page.locator('.dr-prompt')).toContainText('TURNO DEL RIVAL');
  await expect(page.getByRole('button', { name: /TERMINAR TURNO/ })).toBeEnabled();
  await expect(page.locator('.dr-top small')).toContainText('TURNO 2');
  await page.getByRole('button', { name: 'Pausar partida' }).tap();
  await expect(page.getByRole('dialog', { name: 'Pausa' })).toBeVisible();
  await page.getByRole('button', { name: 'Continuar partida' }).tap();
  for (const [opener, title] of [
    ['Reglas del prototipo', 'Cómo se juega'], [/Mazo/, 'Tus cartas'],
    ['Ver historial de jugadas', 'Últimas jugadas'], [/IA ·/, 'Rival de IA'],
  ] as const) {
    await page.getByRole('button', { name: opener }).tap();
    const dialog = page.getByRole('dialog', { name: title });
    await expect(dialog).toBeVisible(); await noPageOverflow(page);
    if (title === 'Cómo se juega') await page.screenshot({ path: testInfo.outputPath('help.png') });
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    // A clipped panel can have a valid outer box: also reach its last action by scrolling.
    const lastControl = dialog.getByRole('button').last();
    await lastControl.scrollIntoViewIfNeeded();
    const controlBox = await lastControl.boundingBox();
    expect(controlBox!.y).toBeGreaterThanOrEqual(0);
    expect(controlBox!.y + controlBox!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('primary touch controls have at least 44 by 44 CSS pixels', async ({ page }) => {
  await open(page);
  for (const selector of ['.dr-back', '.dr-iconbtn', '.dr-difficulty', '.dr-actions button']) {
    for (const button of await page.locator(selector).all()) {
      await button.scrollIntoViewIfNeeded();
      const box = await button.boundingBox();
      expect(box!.x, selector).toBeGreaterThanOrEqual(0);
      expect(box!.x + box!.width, selector).toBeLessThanOrEqual(page.viewportSize()!.width);
      expect(box!.width, selector).toBeGreaterThanOrEqual(44);
      expect(box!.height, selector).toBeGreaterThanOrEqual(44);
    }
  }
});

for (const winner of ['player', 'rival'] as const) test(`complete seeded ${winner} result and restart`, async ({ page }) => {
  const run = scenario(winner); await open(page, run.seed); let state = createCombat(run.seed);
  for (const action of run.actions) {
    if (action.type === 'play') {
      const card = page.locator('.dr-card').nth(state.hand.findIndex(c => c.id === action.cardId));
      await card.scrollIntoViewIfNeeded(); await card.tap();
      await page.getByRole('button', { name: 'Jugar carta' }).tap();
    } else if (action.type === 'end_turn') await page.getByRole('button', { name: /TERMINAR TURNO/ }).tap();
    else if (action.type === 'resolve_rival') {
      await expect(page.locator('.dr-top small')).toContainText(`TURNO ${state.turn + 1}`);
    }
    state = applyCombatAction(state, action).state;
    await expect(page.locator('.dr-player .dr-person b')).toContainText(`${state.playerHp}/20`);
  }
  await expect(page.getByRole('heading', { name: winner === 'player' ? '¡Victoria!' : 'Derrota' })).toBeVisible();
  await page.getByRole('button', { name: 'Jugar otra vez' }).tap();
  await expect(page.locator('.dr-top small')).toContainText('TURNO 1');
});

test('reload during the rival response offers recovery and resolves once', async ({ page }) => {
  await open(page, 21); let state: CombatState = createCombat(21);
  const card = state.hand.find(c => !invalidAction(state, { type: 'play', cardId: c.id }))!;
  await tapCard(page, card.name); await page.getByRole('button', { name: 'Jugar carta' }).tap();
  state = applyCombatAction(state, { type: 'play', cardId: card.id }).state;
  await expect(page.locator('.dr-save')).toHaveText('✓ Guardado');
  await page.getByRole('button', { name: /TERMINAR TURNO/ }).tap();
  state = applyCombatAction(state, { type: 'end_turn' }).state;
  await page.reload();
  await expect(page.getByRole('heading', { name: '¿Continuar el duelo?' })).toBeVisible();
  await noPageOverflow(page);
  await insideViewport(page, page.getByRole('button', { name: 'Nueva partida' }), 'lobby actions');
  await page.getByRole('button', { name: 'Continuar partida' }).tap();
  state = applyCombatAction(state, { type: 'resolve_rival' }).state;
  await expect(page.locator('.dr-top small')).toContainText(`TURNO ${state.turn}`);
  await expect(page.locator('.dr-player .dr-person b')).toContainText(`${state.playerHp}/20`);
  await expect(page.locator('.dr-rival .dr-person b')).toContainText(`${state.enemyHp}/20`);
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('decreto-real.duelo-v1.partida')!).record.journal.length);
  expect(saved).toBe(state.journal.length);
});

test('guided tutorial can be completed by touch with the guide and target on screen', async ({ page }, testInfo) => {
  await open(page, 0, { offerTutorial: true });
  await expect(page.getByRole('heading', { name: '¿Primera vez en el duelo?' })).toBeVisible();
  await page.getByRole('button', { name: 'Aprender a jugar' }).tap();
  const coach = page.locator('.dr-coach h2');
  await expect(coach).toHaveText('Bienvenida al duelo');
  await insideViewport(page, page.getByRole('button', { name: 'Empezar' }), 'start');
  await page.screenshot({ path: testInfo.outputPath('tutorial.png'), fullPage: true });
  await page.getByRole('button', { name: 'Empezar' }).tap();
  for (const [step, name] of [['Elige una carta', 'Golpe preciso'], ['Ataca y defiéndete', 'Bastión']] as const) {
    await expect(coach).toHaveText(step);
    await insideViewport(page, page.locator('.dr-guide-target'), `${step} target`);
    await tapCard(page, name);
    await insideViewport(page, page.getByRole('button', { name: 'Jugar carta' }), 'confirm');
    await page.getByRole('button', { name: 'Jugar carta' }).tap();
  }
  await expect(coach).toHaveText('Mando e Impactos');
  await expect(page.getByRole('button', { name: /^Impacto I, coste/ })).toHaveAttribute('aria-disabled', 'true');
  await insideViewport(page, page.getByRole('button', { name: /TERMINAR TURNO/ }), 'end turn');
  await page.getByRole('button', { name: /TERMINAR TURNO/ }).tap();
  await expect(coach).toHaveText('Respuesta del rival');
  await expect(page.locator('.dr-coach')).toContainText('Tu escudo bloquea 3');
  await insideViewport(page, page.getByRole('button', { name: 'Continuar' }), 'continue');
  await page.getByRole('button', { name: 'Continuar' }).tap();
  await expect(coach).toHaveText('Sella un Impacto');
  await tapCard(page, 'Impacto I'); await page.getByRole('button', { name: 'Jugar carta' }).tap();
  await expect(coach).toHaveText('Tutorial completado');
  await noPageOverflow(page);
  expect(await page.evaluate(() => localStorage.getItem('decreto-real.duelo-v1.partida'))).toBeNull();
  await page.getByRole('button', { name: 'Jugar un duelo' }).tap();
  await expect(page.locator('.dr-top small')).toHaveText('DUELO DE PRUEBA · TURNO 1');
});

test('a full hand scrolls horizontally inside the hand and every card stays reachable', async ({ page }) => {
  await open(page, 3); let state = createCombat(3);
  while (state.hand.length < 6) {
    await page.getByRole('button', { name: /TERMINAR TURNO/ }).tap();
    state = applyCombatAction(applyCombatAction(state, { type: 'end_turn' }).state, { type: 'resolve_rival' }).state;
    await expect(page.locator('.dr-top small')).toContainText(`TURNO ${state.turn}`);
  }
  expect(state.phase).toBe('player');
  await expect(page.locator('.dr-hand-meta')).toContainText('Mano 6/6');
  await expect(page.locator('.dr-card')).toHaveCount(6);
  await noPageOverflow(page);
  for (const index of [5, 0]) {
    const card = page.locator('.dr-card').nth(index);
    await insideViewport(page, card, `card ${index}`);
  }
  const playable = state.hand.map(c => !invalidAction(state, { type: 'play', cardId: c.id })).lastIndexOf(true);
  const last = page.locator('.dr-card').nth(playable);
  await last.scrollIntoViewIfNeeded(); await last.tap();
  await expect(last).toHaveAttribute('aria-pressed', 'true');
  await insideViewport(page, page.getByRole('button', { name: 'Jugar carta' }), 'confirm');
  const narrow = page.viewportSize()!.width < 600;
  if (narrow) await expect(page.locator('.dr-hand-meta')).toContainText('Desliza');
});

test('decision information is visible and readable: Impacts, counters and card texts', async ({ page }) => {
  await open(page, 0);
  for (const selector of ['.dr-rival .dr-seals', '.dr-player .dr-seals', '.dr-mana', '.dr-player .dr-person b', '.dr-rival .dr-person b', '.dr-hand-meta']) {
    await expect(page.locator(selector).first(), selector).toBeVisible();
  }
  await expect(page.locator('.dr-player .dr-seals strong')).toHaveText('0/4');
  await expect(page.locator('.dr-rival .dr-seals strong')).toHaveText('0/4');
  // Every visible, non-decorative text node renders at 10 CSS px or more.
  const tiny = await page.evaluate(() => {
    const out: string[] = [];
    const walker = document.createTreeWalker(document.querySelector('.dr-game')!, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const element = node.parentElement!;
      if (!node.textContent!.trim() || element.closest('[aria-hidden="true"]')) continue;
      const style = getComputedStyle(element);
      if (style.display === 'none' || style.visibility === 'hidden' || parseFloat(style.fontSize) === 0) continue;
      if (!element.getClientRects().length) continue;
      if (parseFloat(style.fontSize) < 10) out.push(`${element.className || element.tagName}: ${parseFloat(style.fontSize)}px "${node.textContent!.trim()}"`);
    }
    return out;
  });
  expect(tiny).toEqual([]);
});

test('reduced motion removes the tutorial pulse and card entrance animation', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await open(page, 0, { path: 'duelo-v1/tutorial' });
  await page.getByRole('button', { name: 'Empezar' }).tap();
  const target = page.locator('.dr-guide-target');
  await expect(target).toHaveCount(1);
  expect(await target.evaluate(element => getComputedStyle(element).animationName)).toBe('none');
  expect(createTutorialCombat().hand.length).toBe(4);
});
