import { test, expect, type Page } from '@playwright/test';

async function openPause(page: Page) {
  await page.goto('/Decreto-Real/#/game');
  // El sorteo ocupa el tablero al empezar. Terminamos la moneda antes de abrir pausa.
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(page.locator('.dr-event-stage--coin')).toHaveCount(0, { timeout: 5000 });
  await page.getByRole('button', { name: 'Abrir menú de pausa' }).click();
  await expect(page.getByRole('dialog', { name: 'PAUSA' })).toBeVisible();
}

test('pausa G3: música, efectos, continuar y acciones visibles', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  await openPause(page);
  const dialog = page.getByRole('dialog', { name: 'PAUSA' });
  await expect(dialog.getByRole('button', { name: 'CONTINUAR BATALLA' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'REINICIAR PARTIDA' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'VOLVER AL MENÚ PRINCIPAL' })).toBeVisible();
  await expect(dialog.getByRole('button', { name: 'RENDIRSE' })).toHaveCount(0);
  await expect(dialog.locator('img.dr-pause-emblem')).toHaveAttribute('src', /moneda\/sol\.webp/);
  const music = dialog.getByRole('button', { name: 'Música' });
  const before = await music.getAttribute('aria-pressed');
  await music.click();
  await expect(music).toHaveAttribute('aria-pressed', before === 'true' ? 'false' : 'true');
  const sfx = dialog.getByRole('button', { name: 'Efectos' });
  const beforeSfx = await sfx.getAttribute('aria-pressed');
  await sfx.click();
  await expect(sfx).toHaveAttribute('aria-pressed', beforeSfx === 'true' ? 'false' : 'true');
  await dialog.getByRole('button', { name: 'CONTINUAR BATALLA' }).click();
  await expect(dialog).toHaveCount(0);
  expect(errors).toEqual([]);
});

test('reinicio: confirmar o cancelar y comenzar con una moneda nueva', async ({ page }) => {
  await openPause(page);
  await page.getByRole('button', { name: 'REINICIAR PARTIDA' }).click();
  const confirmation = page.getByRole('alertdialog', { name: '¿Reiniciar partida?' });
  await expect(confirmation).toContainText('Perderás el progreso actual');
  await expect(confirmation.getByRole('button', { name: 'CANCELAR' })).toBeFocused();
  await confirmation.getByRole('button', { name: 'CANCELAR' }).click();
  await expect(page.getByRole('dialog', { name: 'PAUSA' })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);

  await page.getByRole('button', { name: 'REINICIAR PARTIDA' }).click();
  await page.getByRole('button', { name: 'SÍ, REINICIAR' }).click();
  await expect(page.getByTestId('royal-pause-menu')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeEnabled();
  await expect(page.locator('.dr-royal-deck-back')).toHaveCount(2);
  await expect(page.locator('.dr-royal-deck-back').first()).toContainText('28');
  await expect(page.locator('.dr-royal-deck-back').last()).toContainText('28');
});

test('salir al menú principal: cancelar conserva el duelo y confirmar no cuenta derrota', async ({ page }) => {
  await openPause(page);
  const exit = page.getByRole('button', { name: 'VOLVER AL MENÚ PRINCIPAL' });
  await exit.click();
  let confirmation = page.getByRole('alertdialog', { name: '¿Deseas salir de la partida?' });
  await expect(confirmation).toContainText('volverás al menú principal');
  await expect(confirmation.getByRole('button', { name: 'CANCELAR' })).toBeFocused();
  await confirmation.getByRole('button', { name: 'CANCELAR' }).click();
  await expect(page.getByRole('dialog', { name: 'PAUSA' })).toBeVisible();
  await expect(page.getByRole('alertdialog')).toHaveCount(0);
  await exit.click();
  confirmation = page.getByRole('alertdialog', { name: '¿Deseas salir de la partida?' });
  await confirmation.getByRole('button', { name: 'SÍ', exact: true }).click();
  await expect(page.getByTestId('royal-pause-menu')).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Versus IA' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Derrota' })).toHaveCount(0);
});

test('pausa ocupa un solo viewport y la confirmación mantiene botones accesibles', async ({ page }) => {
  await openPause(page);
  const modal = page.getByRole('dialog', { name: 'PAUSA' });
  const measure = async () => page.evaluate(() => {
    const el = document.querySelector('.dr-pause-panel')!;
    const rect = el.getBoundingClientRect();
    return { top: rect.top, bottom: rect.bottom, width: rect.width, overflow: el.scrollHeight > el.clientHeight };
  });
  let box = await measure();
  expect(box.top).toBeGreaterThanOrEqual(-1);
  expect(box.bottom).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  expect(box.width).toBeLessThanOrEqual(page.viewportSize()!.width + 1);
  await modal.getByRole('button', { name: 'REINICIAR PARTIDA' }).click();
  const restart = page.getByRole('alertdialog', { name: '¿Reiniciar partida?' });
  await expect(restart.getByRole('button', { name: 'SÍ, REINICIAR' })).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name: 'PAUSA' })).toBeVisible();
  box = await measure();
  expect(box.bottom).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  await page.keyboard.press('Escape');
  await expect(page.getByTestId('royal-pause-menu')).toHaveCount(0);
});
