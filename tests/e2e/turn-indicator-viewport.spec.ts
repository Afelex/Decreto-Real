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
    side === 'player' ? /banner-tu-turno\.webp/ : /banner-turno-rival\.webp/);

  const geometry = await ribbon.evaluate((element, intendedSide) => {
    const box = element.getBoundingClientRect();
    const board = element.closest('.dr-royal-screen')!.getBoundingClientRect();
    const visibleLeft = Math.max(box.left, board.left, 0);
    const visibleRight = Math.min(box.right, board.right, innerWidth);
    const visibleWidth = Math.max(0, visibleRight - visibleLeft);
    return {
      // Deliberately clipped at the frame edge, as approved by the user.
      croppedAtCorrectEdge: intendedSide === 'player'
        ? box.left < board.left : box.right > board.right,
      visibleFraction: visibleWidth / box.width,
      verticalInside: box.top >= board.top - 1 && box.bottom <= board.bottom + 1,
      nonzero: box.width >= 100 && box.height >= 20,
    };
  }, side);
  expect(geometry.croppedAtCorrectEdge).toBe(true);
  expect(geometry.visibleFraction).toBeGreaterThan(0.60);
  expect(geometry.visibleFraction).toBeLessThan(0.99);
  expect(geometry.verticalInside).toBe(true);
  expect(geometry.nonzero).toBe(true);
}

test('el rótulo azul aparece recortado a la derecha cuando la IA gana la moneda', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.01; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expectRibbonInsideBoard(page, 'opponent');
  await expect(page.locator('.dr-event-indicator.is-player')).toHaveCount(0);
});

test('tras el turno del jugador, la etiqueta azul sustituye a la roja sin desaparecer', async ({ page }) => {
  await page.addInitScript(() => { Math.random = () => 0.99; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expectRibbonInsideBoard(page, 'player');
  await page.getByRole('button', { name: 'Terminar turno' }).click();
  await expectRibbonInsideBoard(page, 'opponent');
  await expect(page.locator('.dr-event-indicator.is-player')).toHaveCount(0);
});
