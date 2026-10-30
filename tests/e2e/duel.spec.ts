import { test, expect, type Page } from '@playwright/test';
import { scenario } from '../scenarios';
import { applyCombatAction, createCombat } from '../../game/combatEngine';

async function open(page: Page, seed = 0) {
  await page.addInitScript(seed => {
    localStorage.clear();
    Object.defineProperty(crypto, 'getRandomValues', { value: (array: Uint32Array) => { array[0] = seed; return array; } });
  }, seed);
  await page.goto('/Decreto-Real/#/duelo-v1');
  await expect(page.getByRole('heading', { name: 'Decreto Real', exact: true })).toBeVisible();
}
async function noPageOverflow(page: Page) {
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
}

test('touch selection, confirmation, rival response, pause and dialogs fit the viewport', async ({ page }) => {
  const errors: string[] = []; page.on('pageerror', error => errors.push(error.message));
  await open(page); await noPageOverflow(page);
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
    const box = await dialog.boundingBox();
    expect(box).not.toBeNull();
    const viewport = page.viewportSize()!;
    expect(box!.x).toBeGreaterThanOrEqual(0); expect(box!.y).toBeGreaterThanOrEqual(0);
    expect(box!.x + box!.width).toBeLessThanOrEqual(viewport.width);
    expect(box!.y + box!.height).toBeLessThanOrEqual(viewport.height);
    await page.keyboard.press('Escape'); await expect(dialog).toBeHidden();
  }
  expect(errors).toEqual([]);
});

test('primary touch controls have at least 44 by 44 CSS pixels', async ({ page }) => {
  await open(page);
  for (const selector of ['.dr-back', '.dr-iconbtn', '.dr-difficulty', '.dr-actions button']) {
    for (const button of await page.locator(selector).all()) {
      const box = await button.boundingBox();
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
