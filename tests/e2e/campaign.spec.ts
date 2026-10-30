import { expect, test } from '@playwright/test';

const campaign = '/Decreto-Real/#/campania';

test('campaign map fits one viewport and locks future challenges', async ({ page }, testInfo) => {
  await page.goto(campaign);
  await expect(page.getByRole('heading', { name: 'Campaña' })).toBeVisible();
  await expect(page.getByRole('button', { name: /Misión 1:/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Misión 2:/ })).toBeDisabled();
  await expect(page.getByRole('button', { name: 'Capítulo siguiente bloqueado' })).toBeDisabled();
  await expect(page.getByRole('button', { name: /Seleccionar reto/ })).toBeVisible();

  const fit = await page.evaluate(() => {
    const viewportHeight = window.innerHeight;
    const footer = document.querySelector('.dcm-footer')?.getBoundingClientRect();
    const map = document.querySelector('.dcm-map')?.getBoundingClientRect();
    const body = document.documentElement;
    return {
      verticalOverflow: body.scrollHeight > viewportHeight + 1,
      horizontalOverflow: body.scrollWidth > window.innerWidth + 1,
      controlsVisible: !!footer && footer.bottom <= viewportHeight + 1,
      mapVisible: !!map && map.height >= 100,
    };
  });
  expect(fit).toEqual({ verticalOverflow: false, horizontalOverflow: false, controlsVisible: true, mapVisible: true });
  await page.screenshot({ path: testInfo.outputPath('fullscreen-campaign-map.png'), fullPage: true });
});

test('select challenge button opens the existing story mission and actual duel', async ({ page }) => {
  await page.goto(campaign);
  await page.getByRole('button', { name: /Seleccionar reto/ }).click();
  await expect(page.getByRole('heading', { name: 'El pregón alterado' })).toBeVisible();
  await expect(page.getByText(/Una proclamación contradictoria/)).toBeVisible();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.getByRole('heading', { name: 'Decreto Real' })).toBeVisible();
  await expect(page.getByLabel('Tu mano:', { exact: false })).toBeVisible();
});

test('defeat requirement prevents advancing to another region', async ({ page }) => {
  await page.goto(campaign);
  await expect(page.getByRole('button', { name: 'Capítulo siguiente bloqueado' })).toBeDisabled();
  await page.getByRole('button', { name: /Misión 1:/ }).click();
  await expect(page.getByRole('heading', { name: 'El pregón alterado' })).toBeVisible();

  await page.evaluate(() => window.localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: { '01': 1 },
  })));
  await page.reload();
  await expect(page.getByRole('button', { name: /Misión 2:/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: 'Capítulo siguiente bloqueado' })).toBeDisabled();
});

test('defeating all missions in a region unlocks the next chapter', async ({ page }) => {
  await page.goto(campaign);
  await page.evaluate(() => window.localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: { '01': 1, '02': 1 },
  })));
  await page.reload();
  await expect(page.getByText('El puerto de hierro')).toBeVisible();
  await page.getByRole('button', { name: 'Capítulo anterior' }).click();
  await expect(page.getByText('El llamado del Sello')).toBeVisible();
  await page.getByRole('button', { name: 'Capítulo siguiente' }).click();
  await expect(page.getByRole('button', { name: /Misión 3:/ })).toBeEnabled();
  await expect(page.getByRole('button', { name: /Misión 4:/ })).toBeDisabled();
});

test('the prologue introduces the conflict and all eight generals', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania/historia');
  await expect(page.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeVisible();
  await page.getByRole('button', { name: 'Ocho generales' }).click();
  await expect(page.locator('.dc-general-list > div')).toHaveCount(8);
});

test('the epilogue is inaccessible until all 38 missions are won', async ({ page }) => {
  await page.goto('/Decreto-Real/#/campania/epilogo');
  await expect(page.getByRole('heading', { name: 'El epílogo sigue sellado' })).toBeVisible();
});

test('boss is presented in briefing and on the duel board', async ({ page }) => {
  await page.goto(campaign);
  await page.evaluate(() => window.localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: { '01': 1, '02': 1, '03': 1, '04': 1, '05': 1 },
  })));
  await page.goto('/Decreto-Real/#/campania/mision/06');
  await expect(page.getByRole('heading', { name: 'El Almirante de Hierro' })).toBeVisible();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.locator('.dr-rival').getByText('Almirante de Hierro')).toBeVisible();
});

test('campaign retains drag-and-drop tactile battle', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Full drag sampled on tall mobile viewport');
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  const hand = page.locator('.dr-hand .dr-card');
  const initialCount = await hand.count();
  const card = page.locator('.dr-hand .dr-card:not(.disabled)').first();
  const cardBox = await card.boundingBox();
  const tableBox = await page.locator('.dr-arena').boundingBox();
  expect(cardBox).not.toBeNull();
  expect(tableBox).not.toBeNull();
  const from = { x: cardBox!.x + cardBox!.width / 2, y: cardBox!.y + cardBox!.height / 2 };
  const to = { x: tableBox!.x + tableBox!.width / 2, y: tableBox!.y + tableBox!.height / 2 };
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  await page.mouse.move(to.x, to.y, { steps: 12 });
  await expect(page.locator('.dr-arena.drop-ready')).toBeVisible();
  await page.mouse.up();
  await expect(hand).toHaveCount(initialCount - 1);
  await expect(page.locator('.dr-drag-ghost')).toHaveCount(0);
});

test('star goals dialog is complete, keyboard-accessible and fits the phone', async ({ page }) => {
  await page.goto(campaign);
  await page.getByRole('button', { name: 'Ver objetivos del reto' }).click();
  const dialog = page.getByRole('dialog', { name: 'El pregón alterado' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Gana el duelo')).toBeVisible();
  await expect(dialog.getByText('Conserva al menos 12 de vida')).toBeVisible();
  await expect(dialog.getByText('Vence hasta el turno 10')).toBeVisible();
  const bounds = await dialog.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.y).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  await page.keyboard.press('Escape');
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Ver objetivos del reto' })).toBeFocused();
});

test('main-menu campaign CTA previews the latest verified stage', async ({ page }) => {
  await page.goto(campaign);
  await page.evaluate(() => localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: { '01': 2, '38': 3 },
  })));
  await page.goto('/Decreto-Real/#/');
  const campaignButton = page.getByRole('button', { name: 'Empezar campaña' });
  await expect(campaignButton).toContainText('Reto 2/38');
  await expect(campaignButton).toContainText('La orden sin sello');
  await expect(campaignButton.locator('.dr-menu-progress-track span')).toHaveCSS('width', /[0-9.]+px/);
  const menu = await page.locator('.dr-main-menu-footer').boundingBox();
  expect(menu).not.toBeNull();
  expect(menu!.y + menu!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
});
