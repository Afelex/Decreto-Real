import { test, expect } from '@playwright/test';

test('desde Versus IA, abre el campo, presenta rivales y termina en moneda', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  await page.getByRole('button', { name: 'Comenzar duelo' }).click();

  const opening = page.getByTestId('duel-entrance');
  await expect(opening).toBeVisible();
  await expect(opening).toHaveAttribute('data-stage', 'gate');
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toHaveCount(0);
  await expect(opening).toHaveAttribute('data-stage', 'rivals', { timeout: 3000 });
  await expect(opening.getByText('XERVIAS')).toBeVisible();
  await expect(opening.getByText('RIVAL IA')).toBeVisible();
  await expect(opening).toHaveAttribute('data-stage', 'field', { timeout: 3000 });
  await expect(opening).toHaveCount(0, { timeout: 6000 });

  const coin = page.getByRole('button', { name: 'Lanzar Moneda' });
  await expect(coin).toBeVisible();
  await expect(coin).toBeEnabled();
  const box = await coin.boundingBox();
  expect(box).not.toBeNull();
  expect(box!.x).toBeGreaterThanOrEqual(0);
  expect(box!.x + box!.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await coin.click();
  await expect(coin).toBeDisabled();
  expect(errors).toEqual([]);
});

test('omitir introduccion abre la moneda sin alterar el sorteo', async ({ page }) => {
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  await page.getByRole('button', { name: 'Comenzar duelo' }).click();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByTestId('duel-entrance')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: '¿Quién comienza?' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeEnabled();
});

test('abrir el tablero directamente no impone una introduccion nueva', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByTestId('duel-entrance')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
});

test('reducir movimiento evita la animacion sin perder el acceso a la moneda', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  await page.getByRole('button', { name: 'Comenzar duelo' }).click();
  await expect(page.getByTestId('duel-entrance')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeEnabled();
});

test('Extremo: el jugador comienza con 5 PV y el rival conserva 20 PV', async ({ page }) => {
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Versus IA' }).click();
  await page.getByRole('radio', { name: /Extremo/ }).check();
  await page.getByRole('button', { name: 'Comenzar duelo' }).click();
  await expect(page.getByTestId('duel-entrance')).toBeVisible();
  await page.getByRole('button', { name: 'Omitir introducción' }).click();
  await expect(page.getByRole('progressbar', { name: 'Tu vida: 5 de 5' })).toBeVisible();
  await expect(page.getByRole('progressbar', { name: 'Vida del rival: 20 de 20' })).toBeVisible();
});
