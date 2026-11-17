import { expect, test } from '@playwright/test';

/** Reproduces the mobile screenshot regression: a painted strip appeared before
 * the approved WebM, and caption/media were independently scaled/positioned. */
test('decreto: solo WebM y texto en el mismo centro, sin cinta plana previa', async ({ page }, info) => {
  test.skip(!['mobile-320', 'mobile-390', 'short-360'].includes(info.project.name),
    'Focused mobile video ribbon QA');
  await page.addInitScript(() => { Math.random = () => 0.6; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(page.locator('.dr-royal-hand-card')).toHaveCount(4, { timeout: 19000 });

  // 0.99 leaves the four Impact cards at the top of the Fisher–Yates deck;
  // 0.6 gives an ordinary playable card while still awarding the first turn.
  const ordinary = page.locator(
    '.dr-royal-hand-card.attack, .dr-royal-hand-card.defense, .dr-royal-hand-card.order',
  ).first();
  await expect(ordinary).toBeVisible();
  await ordinary.click();
  await page.getByRole('button', { name: 'Campo para activar Ataque, Defensa, Orden o Mística' }).click();

  const overlay = page.locator('.dr-cinematic-overlay[data-decree-stage="banner"]');
  await expect(overlay).toHaveCount(1);
  const banner = overlay.locator('.dr-decree-banner');
  await expect(banner).toHaveCount(1);
  await expect(banner.locator('video[src], video source[src]')).toHaveCount(1);
  await expect(overlay.locator('.dr-cinematic-fallback, .dr-cinematic-media, .dr-cinematic-copy')).toHaveCount(0);
  await expect(banner.locator('.dr-decree-banner__copy')).toHaveCount(1);

  const layout = await banner.evaluate(stage => {
    const video = stage.querySelector('video')!;
    const copy = stage.querySelector('.dr-decree-banner__copy')!;
    const a = video.getBoundingClientRect();
    const b = copy.getBoundingClientRect();
    const parent = stage.closest('.dr-royal-screen')!.getBoundingClientRect();
    const transform = getComputedStyle(copy).transform;
    const m = new DOMMatrixReadOnly(transform);
    return {
      sameCenterX: Math.abs(a.left + a.width / 2 - b.left - b.width / 2) < 1,
      sameCenterY: Math.abs(a.top + a.height / 2 - b.top - b.height / 2) < 1,
      boardCenteredX: Math.abs(a.left + a.width / 2 - parent.left - parent.width / 2) < 1,
      boardCenteredY: Math.abs(a.top + a.height / 2 - parent.top - parent.height / 2) < 1,
      copyInclination: Math.round(Math.atan2(m.b, m.a) * 180 / Math.PI),
      filmNotRotatedAgain: getComputedStyle(video).transform === 'none',
    };
  });
  expect(layout).toEqual({
    sameCenterX: true,
    sameCenterY: true,
    boardCenteredX: true,
    boardCenteredY: true,
    copyInclination: -12,
    filmNotRotatedAgain: true,
  });
});
