import { expect, test, type Page } from '@playwright/test';

/**
 * An element can be "visible" to Playwright while entirely outside the
 * viewport. Check the geometry of the real persistent turn ribbon.
 */
async function expectRibbonInsideBoard(page: Page, side: 'player' | 'opponent') {
  const ribbon = page.locator(`.dr-event-indicator.is-${side}`);
  await expect(ribbon).toBeVisible({ timeout: 10000 });
  await expect(ribbon).toHaveCSS('visibility', 'visible');
  await expect(ribbon).toHaveCSS('background-image',
    side === 'player' ? /banner-tu-turno\\.webp/ : /banner-turno-rival\\.webp/);

  const geometry = await ribbon.evaluate(element => {
    const box = element.getBoundingClientRect();
    const board = element.closest('.dr-royal-screen')!.getBoundingClientRect();
    return {
      inViewport: box.left >= -1 && box.top >= -1 &&
        box.right <= innerWidth + 1 && box.bottom <= innerHeight + 1,
      inBoard: box.left >= board.left - 1 && box.top >= board.top - 1 &&
        box.right <= board.right + 1 && box.bottom <= board.bottom + 1,
      nonzero: box.width >= 100 && box.height >= 20,
    };
  });
  expect(geometry).toEqual({ inViewport: true, inBoard: true, nonzero: true });
}

test('el rótulo azul permanece dentro del móvil cuando la IA gana la moneda', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.01; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expectRibbonInsideBoard(page, 'opponent');
  await expect(page.locator('.dr-event-indicator.is-player')).toHaveCount(0);
});

test('tras el turno del jugador, la etiqueta azul sustituye a la roja sin recorte', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.99; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expectRibbonInsideBoard(page, 'player');
  await page.getByRole('button', { name: 'Terminar turno' }).click();
  await expectRibbonInsideBoard(page, 'opponent');
  await expect(page.locator('.dr-event-indicator.is-player')).toHaveCount(0);
});
