import { test, expect } from '@playwright/test';

test('la primera visita muestra solo logo y progreso antes del menú', async ({ page }) => {
  const pageErrors: string[] = [];
  page.on('pageerror', error => pageErrors.push(error.message));
  await page.route(/ui_boton_menu_base_v01\.webp/, async route => {
    await new Promise(resolve => setTimeout(resolve, 900));
    await route.continue();
  });
  await page.goto('/Decreto-Real/#/');
  const startup = page.getByTestId('initial-loading-screen');
  await expect(startup).toBeVisible();
  await expect(startup.locator('img[alt="Decreto Real"]')).toBeVisible();
  await expect(startup.getByRole('progressbar')).toBeVisible();
  await expect(startup.locator('.dr-initial-boot__progress')).not.toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByRole('button', { name: 'Versus IA' })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Versus IA' })).toBeVisible({ timeout: 20000 });
  await expect(startup).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Multijugador' })).toBeVisible();
  expect(pageErrors).toEqual([]);
});

test('fallo del póster obligatorio: reintentar sin mostrar un menú incompleto', async ({ page }) => {
  await page.route(/portada\/portada-poster\.jpg/, route =>
    route.fulfill({ status: 503, contentType: 'text/plain', body: 'Temporarily unavailable' }));
  await page.goto('/Decreto-Real/#/');
  const startup = page.getByTestId('initial-loading-screen');
  await expect(startup.getByRole('alert')).toContainText('Fondo de portada', { timeout: 15000 });
  await expect(startup.getByRole('progressbar')).not.toHaveAttribute('aria-valuenow', '100');
  await expect(page.getByRole('button', { name: 'Versus IA' })).toHaveCount(0);
  await page.unroute(/portada\/portada-poster\.jpg/);
  await startup.getByRole('button', { name: 'Reintentar' }).click();
  await expect(page.getByRole('button', { name: 'Versus IA' })).toBeVisible({ timeout: 20000 });
  await expect(startup).toHaveCount(0);
});

test('al regresar del multijugador no se repite la pantalla de arranque', async ({ page }) => {
  await page.goto('/Decreto-Real/#/');
  await expect(page.getByRole('button', { name: 'Multijugador' })).toBeVisible();
  await page.getByRole('button', { name: 'Multijugador' }).click();
  await expect(page.locator('main.dr-pvp')).toBeVisible();
  await page.getByRole('button', { name: 'Volver al menú principal' }).click();
  await expect(page.getByRole('button', { name: 'Versus IA' })).toBeVisible();
  await expect(page.getByTestId('initial-loading-screen')).toHaveCount(0);
});

test('rutas profundas al tablero conservan su entrada actual sin nueva pantalla de portada', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
  await expect(page.getByTestId('initial-loading-screen')).toHaveCount(0);
});
