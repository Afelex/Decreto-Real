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
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.getByText('Ritual de Inicio')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
  await expect(page.locator('.dr-game')).toHaveCount(0);
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
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.getByText('Ritual de Inicio')).toBeVisible();
});

test('star goals dialog is complete, keyboard-accessible and fits the phone', async ({ page }) => {
  await page.goto(campaign);
  await page.getByRole('button', { name: 'Ver objetivos del reto' }).click();
  const dialog = page.getByRole('dialog', { name: 'El pregón alterado' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Gana el duelo')).toBeVisible();
  await expect(dialog.getByText('Conserva al menos 6 de vida')).toBeVisible();
  await expect(dialog.getByText('Gana en 10 rondas o menos')).toBeVisible();
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

test('bosses from different regions display their own landscape and heraldry', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Visual comparison sampled in the main phone viewport');
  await page.goto(campaign);
  await page.evaluate(() => localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1,
    stars: Object.fromEntries(Array.from({length: 29}, (_, i) => [String(i + 1).padStart(2, '0'), 1])),
  })));
  for (const example of [
    { id: '06', chapter: '1', name: 'El Almirante de Hierro', caption: 'El puerto de hierro' },
    { id: '30', chapter: '7', name: 'El Cóndor de los Andes', caption: 'La fortaleza andina' },
  ]) {
    await page.goto('/Decreto-Real/#/campania/mision/' + example.id);
    await expect(page.getByRole('heading', { name: example.name })).toBeVisible();
    await expect(page.locator('.dc-general-banner')).toContainText(example.name);
    await expect(page.locator('.dc-region-scene')).toHaveAttribute('data-region', example.chapter);
    await expect(page.locator('.dc-region-scene-caption')).toContainText(example.caption);
    await expect(page.locator('.dc-region-scene svg path').first()).toBeAttached();
    const scene = await page.locator('.dc-region-scene').boundingBox();
    const actions = await page.locator('.dc-briefing-actions').boundingBox();
    expect(scene).not.toBeNull();
    expect(actions).not.toBeNull();
    expect(actions!.y + actions!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
    await page.screenshot({ path: testInfo.outputPath('region-' + example.id + '.png'), fullPage: true });
  }
});


test('original game has the coin ritual, real rival deck, artwork, and immediate one-touch cards', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Full original turn flow sampled on the main phone');
  await page.addInitScript(() => { Math.random = () => 0.42; });
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.getByText('Ritual de Inicio')).toBeVisible();
  await expect(page.locator('.dr-classic-screen img[src*="imgur.com"]').first()).toBeVisible();
  await expect(page.getByText('24', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(page.getByText('Ritual de Inicio')).toBeHidden({ timeout: 12000 });
  await expect(page.locator('.dr-classic-screen .h-48 .cursor-pointer')).toHaveCount(4, { timeout: 18000 });
  const cards = page.locator('.dr-classic-screen .h-48 .cursor-pointer');
  const before = await cards.count();
  const ordinary = cards.filter({ hasText: /Decreto de Ataque|Decreto de Defensa/ });
  const chosen = await ordinary.count() ? ordinary.first() : cards.filter({ hasText: 'Impacto I' }).first();
  await chosen.click();
  await expect(cards).toHaveCount(before - 1);
  await expect(page.getByRole('button', { name: 'Jugar carta' })).toHaveCount(0);
  await expect(page.locator('.dr-mana')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('original-board-restored.png'), fullPage: true });
});

test('original game and campaign use the same physical-looking board and audio controls', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-390', 'One shared-component smoke test');
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByText('Ritual de Inicio')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.getByText('Ritual de Inicio')).toBeVisible();
  await expect(page.locator('.dr-classic-screen .gold-leaf-frame')).toHaveCount(2);
  await expect(page.locator('.dr-game.dr-original-table')).toHaveCount(0);
  const box = await page.locator('.dr-classic-screen').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
});

test('updated rules describe the restored original instead of Mando and shield', async ({ page }) => {
  await page.goto('/Decreto-Real/#/rules');
  await page.getByRole('button', { name: 'Cartas' }).click();
  await expect(page.getByText(/10 Decretos de Ataque, 10 Decretos de Defensa/)).toBeVisible();
  await expect(page.getByText(/No hay costes de Mando/)).toBeVisible();
  await page.getByRole('button', { name: 'Ataque' }).click();
  await expect(page.getByText(/quita 2 puntos de vida/)).toBeVisible();
});
