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
  // El título forma parte del arte azul y termina aprox. al 80% de su ancho.
  // Su extremo debe quedar dentro de pantalla; solamente se oculta la cola.
  // El arte del rival sitúa la última letra cerca del 80% de la cinta.
  // Aproximadamente 5 px después de «Rival» siguen visibles; la cola se recorta.
  expect(geometry.visibleFraction).toBeGreaterThan(side === 'opponent' ? 0.81 : 0.60);
  expect(geometry.visibleFraction).toBeLessThan(side === 'opponent' ? 0.90 : 0.99);
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


for (const [side, randomValue, imageName] of [
  ['player', 0.99, 'banner-tu-turno.webp'],
  ['opponent', 0.01, 'banner-turno-rival.webp'],
] as const) {
  test(`el relevo ${side} muestra una sola cinta 1,5 s, sin capas ni vídeo simultáneos`, async ({ page }) => {
    await page.addInitScript(value => { Math.random = () => value; }, randomValue);
    await page.goto('/Decreto-Real/#/game');
    await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
    const portal = page.locator(`.dr-turn-portal--${side}`);
    await expect(portal).toBeVisible({ timeout: 6000 });
    await expect(portal.locator('.dr-event-turn')).toHaveCSS('animation-duration', '1.5s');
    await expect(portal.locator('.dr-event-turn')).toHaveCSS('animation-name', 'dr-turn-clean-handoff');
    await expect(portal.locator('.dr-event-turn__ribbon')).toHaveCSS('background-image',
      new RegExp(imageName.replace('.', '[.]')));
    await expect(portal.locator('.dr-event-turn__ribbon')).toHaveCount(1);
    await expect(portal.locator('video, .dr-event-turn__video')).toHaveCount(0);
    // No se superpone la etiqueta persistente mientras está la transición.
    await expect(page.locator('.dr-event-indicator')).toHaveCount(0);
    const geometry = await portal.evaluate(layer => {
      const rect = layer.getBoundingClientRect();
      return {
        fullWidth: Math.abs(rect.width - innerWidth) <= 1,
        fullHeight: Math.abs(rect.height - innerHeight) <= 1,
        aligned: Math.abs(rect.top) <= 1 && Math.abs(rect.left) <= 1,
        extraDecoration: getComputedStyle(layer, '::before').content !== 'none',
      };
    });
    expect(geometry).toEqual({ fullWidth: true, fullHeight: true, aligned: true, extraDecoration: false });
    await expect(portal).toHaveCount(0, { timeout: 6000 });
    await expectRibbonInsideBoard(page, side);
  });
}
