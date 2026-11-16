import { test, expect } from '@playwright/test';

test('Versus IA verifica recursos y no entra al duelo antes del 100%', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.route(/ui_puertas_reales_izquierda_v01\.webp/, async route => {
    await new Promise(resolve => setTimeout(resolve, 950));
    await route.continue();
  });
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  const loading = page.getByTestId('vs-ia-loading');
  await expect(loading).toBeVisible();
  const progress = loading.getByRole('progressbar');
  await expect(progress).toBeVisible();
  await expect(progress).not.toHaveAttribute('aria-valuenow', '100');
  await expect(page).toHaveURL(/#\/game$/, { timeout: 20000 });
  await expect(loading).toHaveCount(0);
  await expect(page.getByTestId('duel-entrance')).toBeVisible();
  expect(errors).toEqual([]);
});

test('un recurso crítico fallido bloquea la entrada y permite reintentar', async ({ page }) => {
  await page.route(/ui_puertas_reales_izquierda_v01\.webp/, route =>
    route.fulfill({ status: 503, contentType: 'text/plain', body: 'Asset no disponible' }));
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  const loading = page.getByTestId('vs-ia-loading');
  await expect(loading.getByRole('alert')).toContainText('Puerta izquierda', { timeout: 15000 });
  await expect(page).toHaveURL(/#\/$/);
  await expect(loading.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '100');
  await page.unroute(/ui_puertas_reales_izquierda_v01\.webp/);
  await loading.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page).toHaveURL(/#\/game$/, { timeout: 20000 });
  await expect(page.getByTestId('duel-entrance')).toBeVisible();
});

test('cancelar el precargado mantiene el menú y no inicia el combate', async ({ page }) => {
  await page.route(/ui_puertas_reales_izquierda_v01\.webp/, async route => {
    await new Promise(resolve => setTimeout(resolve, 1800));
    try { await route.continue(); } catch { /* request cancelled on leaving the loading dialog */ }
  });
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  await expect(page.getByTestId('vs-ia-loading')).toBeVisible();
  await page.getByRole('button', { name: 'Volver al menú' }).click();
  await expect(page.getByTestId('vs-ia-loading')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
  await expect(page.getByRole('button', { name: 'Versus IA' })).toBeEnabled();
});
