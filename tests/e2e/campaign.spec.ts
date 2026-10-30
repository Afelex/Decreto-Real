import { expect, test } from '@playwright/test';

test('campaign map shows only unlocked stages and fits its viewport', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await expect(page.getByRole('heading', { name: 'El Sello y la Falsa Luz' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Misión 1:/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Misión 2:/ })).toBeDisabled();
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth + 1)).toBe(true);
});

test('mission preview shows the star goals and opens the existing duel', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await page.getByRole('button', { name: /Misión 1:/ }).click();
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Gana el duelo')).toBeVisible();
  await expect(dialog.getByText('Conserva 12 de vida o más')).toBeVisible();
  await dialog.getByRole('button', { name: 'Entrar en la misión' }).click();
  await expect(page.getByRole('heading', { name: 'El pregón alterado' })).toBeVisible();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.getByRole('heading', { name: 'Decreto Real' })).toBeVisible();
  await expect(page.getByLabel('Tu mano:', { exact: false })).toBeVisible();
});

test('mission details can be dismissed without starting a duel', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await page.getByRole('button', { name: /Misión 1:/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});

test('story prologue introduces the main conflict and all eight generals', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania/historia');
  await expect(page.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeVisible();
  await expect(page.locator('.dc-general-list > div')).toHaveCount(8);
  await page.screenshot({ path: test.info().outputPath('story-prologue.png'), fullPage: true });
});

test('the epilogue is inaccessible until the last mission is won', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania/epilogo');
  await expect(page.getByRole('heading', { name: 'El epílogo sigue sellado' })).toBeVisible();
});

test('the named general is presented both in the briefing and on the real duel board', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await page.evaluate(() => window.localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: { '01': 1, '02': 1, '03': 1, '04': 1, '05': 1 },
  })));
  await page.goto('/Decreto-Real/#/campania/mision/06');
  await expect(page.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeVisible();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.locator('.dr-rival').getByText('Almirante de Hierro')).toBeVisible();
  await page.screenshot({ path: test.info().outputPath('campaign-boss-duel.png'), fullPage: true });
});

test('tactile campaign duel lets the player physically drag a card onto the table', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Full drag motion is sampled at the taller phone viewport');
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  const hand = page.locator('.dr-hand .dr-card');
  const initialCount = await hand.count();
  const card = page.locator('.dr-hand .dr-card:not(.disabled)').first();
  const cardBox = await card.boundingBox();
  const tableBox = await page.locator('.dr-arena').boundingBox();
  expect(cardBox).not.toBeNull();
  expect(tableBox).not.toBeNull();
  const from = { x: cardBox!.x + cardBox!.width / 2, y: cardBox!.y + cardBox!.height / 2 };
  const to = { x: tableBox!.x + tableBox!.width / 2, y: tableBox!.y + tableBox!.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await expect(page.locator('.dr-arena.drop-ready')).toBeVisible();
  await page.mouse.up();
  await expect(hand).toHaveCount(initialCount - 1);
  await expect(page.locator('.dr-drag-ghost')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('duel-table-after-drag.png'), fullPage: true });
});
