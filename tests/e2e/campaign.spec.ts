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

test('general portrait and recorded card effect stay within the tactile battle screen', async ({ page }, testInfo) => {
  await page.goto(campaign);
  await page.evaluate(() => localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1, stars: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [String(i + 1).padStart(2, '0'), 1])),
  })));
  await page.goto('/Decreto-Real/#/campania/mision/06');
  if (page.viewportSize()!.height <= 570) {
    await expect(page.locator('.dc-general-banner svg[data-general-portrait="1"]')).toBeVisible();
  } else {
    await expect(page.locator('.dc-general-portrait-seal svg[data-general-portrait="1"]')).toBeVisible();
  }
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.locator('.dr-rival svg[data-general-portrait="1"]')).toBeVisible();
  const playable = page.locator('.dr-hand .dr-card:not(.disabled)').first();
  await playable.tap();
  await page.getByRole('button', { name: 'Jugar carta' }).tap();
  const cue = page.locator('.dr-battle-cue');
  await expect(cue).toBeVisible();
  const bounds = await cue.boundingBox();
  const viewport = page.viewportSize()!;
  expect(bounds).not.toBeNull();
  expect(bounds!.x).toBeGreaterThanOrEqual(-1);
  expect(bounds!.x + bounds!.width).toBeLessThanOrEqual(viewport.width + 1);
  expect(bounds!.y).toBeGreaterThanOrEqual(-1);
  expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(viewport.height + 1);
  if (testInfo.project.name === 'mobile-390') {
    await page.screenshot({ path: testInfo.outputPath('commander-and-card-effect.png'), fullPage: true });
  }
  await page.getByRole('button', { name: /TERMINAR TURNO/ }).click();
  await expect(cue).toHaveCount(0);
});

test('reduced-motion setting preserves the textual effect while disabling flourish animation', async ({ page }) => {
  test.skip(!['mobile-390', 'short-360'].includes(test.info().project.name), 'Sample low-motion behaviour in portrait and short viewports');
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await page.goto(campaign);
  await page.getByRole('button', { name: /Seleccionar reto/ }).click();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await page.locator('.dr-hand .dr-card:not(.disabled)').first().tap();
  await page.getByRole('button', { name: 'Jugar carta' }).tap();
  const cue = page.locator('.dr-battle-cue');
  await expect(cue).toBeVisible();
  await expect(cue).not.toBeEmpty();
  await expect(cue).toHaveCSS('animation-name', 'none');
});

test('restored classic tabletop fits the phone and boss has a distinct tactical response', async ({ page }, testInfo) => {
  test.skip(!['mobile-390', 'short-360', 'landscape'].includes(testInfo.project.name), 'Sample different aspect ratios; broader layout is covered by viewport.spec');
  await page.goto(campaign);
  await page.evaluate(() => localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
    version: 1,
    stars: Object.fromEntries(Array.from({ length: 5 }, (_, i) => [String(i + 1).padStart(2, '0'), 1])),
  })));
  await page.goto('/Decreto-Real/#/campania/mision/06');
  await expect(page.getByText(/Baluarte naval/)).toBeVisible();
  await page.getByRole('button', { name: /Comenzar duelo/ }).click();
  await expect(page.locator('.dr-game.dr-original-table')).toBeVisible();
  await expect(page.locator('.dr-classic-table')).toBeVisible();
  await expect(page.locator('.dr-table-impact-rail')).toHaveCount(2);
  await expect(page.locator('.dr-table-open-field .dr-table-empty-slot')).toHaveCount(2);
  await expect(page.locator('.dr-rival svg[data-general-portrait="1"]')).toBeVisible();
  const hand = page.locator('.dr-hand');
  const actions = page.locator('.dr-actions');
  for (const element of [hand, actions]) {
    const bounds = await element.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= innerHeight + 1)).toBe(true);
  await page.getByRole('button', { name: /TERMINAR TURNO/ }).click();
  await expect(page.locator('.dr-top small')).toContainText('TURNO 2');
  const update = page.locator('.dr-played.rival');
  await expect(update).toBeVisible();
  if (testInfo.project.name === 'mobile-390') {
    await page.screenshot({ path: testInfo.outputPath('classic-inspired-boss-table.png'), fullPage:true });
  }
});

test('the original /game and standalone duel remain distinct routes', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-390', 'One smoke test for preserved routes');
  await page.goto('/Decreto-Real/#/game');
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.locator('.dr-classic-table')).toHaveCount(0);
  await page.goto('/Decreto-Real/#/duelo-v1');
  await expect(page.locator('.dr-classic-table')).toHaveCount(0);
});
