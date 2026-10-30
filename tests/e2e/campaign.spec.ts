import { expect, test } from '@playwright/test';

test('campaign map shows only unlocked stages and fits its viewport', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await expect(page.getByRole('heading', { name: 'Camino a la Corona' })).toBeVisible();
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
  await dialog.getByRole('button', { name: 'Comenzar duelo' }).click();
  await expect(page.getByRole('heading', { name: 'Decreto Real' })).toBeVisible();
  await expect(page.getByLabel('Tu mano:', { exact: false })).toBeVisible();
});

test('mission details can be dismissed without starting a duel', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania');
  await page.getByRole('button', { name: /Misión 1:/ }).click();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toHaveCount(0);
});
