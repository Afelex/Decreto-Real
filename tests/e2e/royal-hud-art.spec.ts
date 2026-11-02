import { expect, test } from '@playwright/test';

test('new illustrated portrait frames and end-turn button use a decoded visible asset', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  const frames = page.locator('.dr-royal-portrait-ornament');
  const button = page.locator('.dr-royal-finish');
  const art = button.locator('.dr-royal-finish-ornament');

  await expect(frames).toHaveCount(2);
  await expect(art).toHaveCount(1);
  await expect(button).toHaveAttribute('data-art-version', 'hud-v3');
  await expect(frames.first()).toBeVisible();
  await expect(art).toBeVisible();
  // On the opening/coin phase the game correctly uses the disabled illustration.
  await expect(button).toBeDisabled();
  await expect(art).toHaveAttribute('viewBox', '384 24 192 192');
  const url = await art.locator('image').getAttribute('href');
  expect(url).toContain('/Decreto-Real/interfaz/retratos-fin-turno.avif?v=3');
  // A valid 200 response is insufficient: verify that Chromium can decode the AVIF.
  const dimensions = await page.evaluate(async (url) => {
    const img = new Image();
    img.src = url!;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, url);
  expect(dimensions).toEqual([576, 240]);
});
