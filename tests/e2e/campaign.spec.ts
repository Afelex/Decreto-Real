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
