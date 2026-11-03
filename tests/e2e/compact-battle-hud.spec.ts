import { expect, test } from '@playwright/test';

test('compact battle HUD has no redundant portrait diamonds and no MANO labels', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');

  // Four Impact places on each battlefield side remain visible and interactive.
  await expect(page.locator('.dr-royal-rival-progress-slot')).toHaveCount(4);
  await expect(page.locator('.dr-royal-impact-slot')).toHaveCount(4);

  // Only duplicate progress indicators around portraits are removed.
  await expect(page.locator('.dr-royal-rival-impact')).toHaveCount(0);
  await expect(page.locator('.dr-royal-character .flex.gap-1.mt-1')).toHaveCount(0);

  // The fan itself communicates the number of cards; no numeric plaques remain.
  await expect(page.locator('.dr-royal-hand-count')).toHaveCount(0);
  await expect(page.locator('.dr-royal-hand-number')).toHaveCount(0);
  await expect(page.locator('.dr-royal-hand-laurels')).toHaveCount(0);
  await expect(page.locator('.dr-royal-audio')).toHaveCount(1);
});

test('turn ribbon is diagonal, crown-free and does not block the audio shortcut', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Turn-change interaction sampled on main mobile viewport');

  await page.addInitScript(() => { Math.random = () => 0.6; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();

  const ribbon = page.locator('.dr-event-indicator.is-player');
  await expect(ribbon).toBeVisible({ timeout: 18000 });
  await expect(ribbon.locator('.dr-event-indicator__label')).toHaveText('Tu Turno');
  await expect(ribbon.locator('.dr-event-indicator__laurel')).toHaveCount(0);
  await expect(ribbon).toHaveCSS('background-image', /cinta-turno-jugador\\.webp/);
  await expect(ribbon).not.toContainText('♛');
  await expect(ribbon).toHaveCSS('pointer-events', 'none');
  const turnButton = page.getByRole('button', { name: 'Terminar turno' });
  await expect(turnButton).toBeEnabled();

  const placement = await page.evaluate(() => {
    const banner = document.querySelector('.dr-event-indicator.is-player')!.getBoundingClientRect();
    const audio = document.querySelector('.dr-royal-audio')!.getBoundingClientRect();
    return {
      separated: banner.bottom + 4 <= audio.top || banner.right + 4 <= audio.left || audio.right + 4 <= banner.left,
      bannerIsAboveAudio: banner.top < audio.top,
      audioIsClickable: document.elementFromPoint(audio.left + audio.width / 2, audio.top + audio.height / 2)
        ?.closest('.dr-royal-audio') !== null,
    };
  });
  expect(placement).toEqual({ separated: true, bannerIsAboveAudio: true, audioIsClickable: true });
});
