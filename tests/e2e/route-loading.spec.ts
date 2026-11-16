import { test, expect } from '@playwright/test';

test('el menú prioriza su póster y no precarga imágenes del campo sin entrar al duelo', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/Decreto-Real/#/');
  await expect(page.getByRole('button', { name: 'Jugar con la IA' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Multijugador' })).toBeVisible();
  const preloads = await page.locator('head link[rel="preload"][as="image"]').evaluateAll(
    elements => elements.map(element => (element as HTMLLinkElement).href));
  expect(preloads).toEqual(expect.arrayContaining([expect.stringContaining('/portada/portada-poster.jpg')]));
  expect(preloads.some(path => path.includes('partida-inicial-poster.jpg'))).toBe(false);
  expect(pageErrors).toEqual([]);
});

test('la ruta de duelo directa precarga sólo el fotograma correspondiente', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
  const preloads = await page.locator('head link[rel="preload"][as="image"]').evaluateAll(
    elements => elements.map(element => (element as HTMLLinkElement).href));
  expect(preloads).toEqual(expect.arrayContaining([expect.stringContaining('/escenarios/partida-inicial-poster.jpg')]));
  expect(preloads.some(path => path.includes('/portada/portada-poster.jpg'))).toBe(false);
});

test('desde el menú, multijugador y duelo IA cargan sus pantallas bajo demanda', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Multijugador' }).click();
  await expect(page.getByRole('heading', { name: /Duelo multijugador/i })).toBeVisible();
  await page.getByRole('button', { name: 'Volver al menú principal' }).click();
  await expect(page.getByRole('button', { name: 'Jugar con la IA' })).toBeVisible();
  await page.getByRole('button', { name: 'Jugar con la IA' }).click();
  await expect(page.getByTestId('duel-entrance')).toBeVisible();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeEnabled();
  expect(pageErrors).toEqual([]);
});
