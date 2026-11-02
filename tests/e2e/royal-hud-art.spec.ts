import { expect, test } from '@playwright/test';

test('a single clipped end-turn illustration stays in the player footer', async ({ page }) => {
  await page.goto('/Decreto-Real/#/game');
  const portraits = page.locator('.dr-royal-portrait-ornament');
  const footer = page.locator('.dr-royal-player-area');
  const button = footer.locator(':scope > .dr-royal-finish');
  const viewport = button.locator('.dr-royal-finish-ornament');
  const sprite = viewport.locator('img.dr-royal-finish-art-image');

  await expect(portraits).toHaveCount(2);
  await expect(portraits.first()).toHaveCSS('overflow', 'hidden');
  await expect(portraits.locator('img.dr-royal-portrait-art-image')).toHaveCount(2);
  await expect(button).toHaveCount(1);
  await expect(page.locator('.dr-royal-finish')).toHaveCount(1);
  await expect(page.locator('.dr-royal-rival-area .dr-royal-finish')).toHaveCount(0);
  await expect(page.locator('.dr-royal-finish-ornament')).toHaveCount(1);
  await expect(button).toHaveAttribute('data-art-version', 'hud-v4');
  await expect(viewport).toBeVisible();
  // Regression: the previous CSS hid the entire art layer with
  // ".dr-royal-finish > span { display:none }" while leaving FIN TURNO visible.
  await expect(viewport).toHaveCSS('display', 'block');
  await expect(viewport).toHaveCSS('visibility', 'visible');
  await expect(viewport).toHaveCSS('overflow', 'hidden');
  await expect(button).toHaveCSS('box-shadow', 'none');
  await expect(page.locator('.dr-royal-character-frame')).toHaveCount(2);
  await expect(page.locator('.dr-royal-character-frame').first()).toHaveCSS('box-shadow', 'none');
  await expect(portraits.first()).toHaveCSS('filter', 'none');
  const decks = page.locator('.dr-royal-deck-back');
  await expect(decks).toHaveCount(2);
  for (const deck of await decks.all()) {
    await expect(deck).toHaveCSS('box-shadow', 'none');
    await expect(deck.locator('span')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
    await expect(deck.locator('small')).toHaveCSS('background-color', 'rgba(0, 0, 0, 0)');
  }
  await expect(sprite).toHaveCSS('left', /-\d+(\.\d+)?px/);
  await expect(button).toBeDisabled();
  await expect(viewport).toHaveAttribute('data-state', 'disabled');

  const url = await sprite.getAttribute('src');
  expect(url).toContain('retratos-fin-turno.avif?v=3');
  const dimensions = await page.evaluate(async (src) => {
    const img = new Image();
    img.src = src!;
    await img.decode();
    return [img.naturalWidth, img.naturalHeight];
  }, url);
  expect(dimensions).toEqual([576, 240]);

  // Prevent the cropped sprite from spilling near the rival/top of the board.
  const layout = await page.evaluate(() => {
    const area = document.querySelector('.dr-royal-player-area')!.getBoundingClientRect();
    const button = document.querySelector('.dr-royal-finish')!.getBoundingClientRect();
    const crop = document.querySelector('.dr-royal-finish-ornament')!.getBoundingClientRect();
    return { insideFooter: button.top >= area.top - 1 && button.bottom <= area.bottom + 1,
      sameBox: Math.abs(button.x - crop.x) < 1 && Math.abs(button.y - crop.y) < 1,
      right: button.right <= area.right + 1 };
  });
  expect(layout).toEqual({ insideFooter: true, sameBox: true, right: true });
});
