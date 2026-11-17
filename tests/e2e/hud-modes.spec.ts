import { expect, test, type Page } from '@playwright/test';

const opacity = (page: Page, selector: string) =>
  page.locator(selector).first().evaluate(el => Number(getComputedStyle(el).opacity));

async function startPlayerTurn(page: Page) {
  await page.goto('/Decreto-Real/#/game');
  const board = page.locator('.dr-royal-screen').first();
  await expect(board).toHaveAttribute('data-hud-mode', 'coin');
  return board;
}

test('el HUD se adapta a moneda, turno y resultado sin mover retratos ni vida', async ({ page }) => {
  const board = await startPlayerTurn(page);
  // Moneda: sin aviso de arrastre ni botón de turno compitiendo con la ceremonia.
  await expect.poll(() => opacity(page, '.dr-royal-activation-target')).toBe(0);
  await expect.poll(() => opacity(page, '.dr-royal-player-area > .dr-royal-finish')).toBe(0);
  const framesBefore = await page.locator('.dr-royal-character-frame').evaluateAll(els =>
    els.map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));

  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(board).toHaveAttribute('data-hud-mode', /^(player|rival|cue)$/, { timeout: 15000 });
  await expect.poll(() => opacity(page, '.dr-royal-player-area > .dr-royal-finish')).toBe(1);
  if (await board.getAttribute('data-hud-mode') === 'player')
    await expect.poll(() => opacity(page, '.dr-royal-activation-target')).toBe(1);

  // La cifra de vida es el dato dominante de la placa y cabe dentro de ella.
  for (const meter of await page.getByRole('progressbar').all()) {
    const geometry = await meter.evaluate(el => {
      const plate = el.getBoundingClientRect();
      const label = el.querySelector('.dr-royal-hp__label')!;
      const number = label.querySelector('b')!;
      const prefix = label.querySelector('small')!;
      const range = document.createRange(); range.selectNodeContents(label);
      const text = range.getBoundingClientRect();
      return {
        numberLarger: parseFloat(getComputedStyle(number).fontSize) > parseFloat(getComputedStyle(prefix).fontSize) * 1.4,
        fits: text.left >= plate.left - .5 && text.right <= plate.right + .5,
        tall: plate.height >= 22,
      };
    });
    expect(geometry).toEqual({ numberLarger: true, fits: true, tall: true });
  }

  await page.getByRole('button', { name: 'Abrir menú de pausa' }).click();
  await page.getByRole('button', { name: /VICTORIA AUTOMÁTICA/ }).click();
  await expect(board).toHaveAttribute('data-hud-mode', 'result');
  await expect(board).toHaveAttribute('data-hud-result', 'victory');
  await expect.poll(() => opacity(page, '.dr-royal-player-hand')).toBe(0);
  const dialog = page.getByRole('dialog', { name: 'Victoria' });
  const proceed = dialog.getByRole('button', { name: 'Continuar' });
  await expect(proceed).toBeVisible({ timeout: 10000 });
  await expect(dialog.locator('.dr-royal-end-cartela img')).toBeVisible();
  // La cartela y el botón caben completos; el diálogo no tapa ningún retrato.
  const viewport = page.viewportSize()!;
  const box = (await dialog.boundingBox())!;
  const cartela = (await dialog.locator('.dr-royal-end-cartela').boundingBox())!;
  const button = (await proceed.boundingBox())!;
  expect(cartela.y).toBeGreaterThanOrEqual(0);
  expect(button.y + button.height).toBeLessThanOrEqual(viewport.height);
  expect(box.x).toBeGreaterThanOrEqual(0);
  expect(box.x + box.width).toBeLessThanOrEqual(viewport.width + 1);
  const framesAfter = await page.locator('.dr-royal-character-frame').evaluateAll(els =>
    els.map(el => { const r = el.getBoundingClientRect(); return [Math.round(r.left), Math.round(r.top), Math.round(r.width), Math.round(r.height)]; }));
  expect(framesAfter).toEqual(framesBefore);
  // El flujo hacia estadísticas no cambia.
  await proceed.click();
  await expect(page).toHaveURL(/#\/victory/);
});
