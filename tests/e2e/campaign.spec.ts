import { expect, test } from '@playwright/test';

const campaign = '/Decreto-Real/#/campania';

async function advanceStoryPrelude(page: import('@playwright/test').Page) {
  const dialog = page.getByTestId('story-combat-dialogue');
  await expect(dialog).toBeVisible();
  const speaker = dialog.getByRole('heading');
  const rivalName = await speaker.textContent();
  await expect(speaker).toHaveText(rivalName!);
  await dialog.getByRole('button', { name: /Siguiente/ }).click();
  await expect(speaker).toHaveText('Xervias');
  await dialog.getByRole('button', { name: /Siguiente/ }).click();
  await expect(speaker).toHaveText(rivalName!);
  await dialog.getByRole('button', { name: /Siguiente/ }).click();
  await expect(dialog.getByText('Inicia el combate')).toBeVisible();
  await dialog.getByRole('button', { name: /Continuar/ }).click();
  await expect(dialog).toBeHidden();
  await expect(page.getByRole('button', { name: 'Lanzar Moneda' })).toBeVisible();
}


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
  await expect(page.getByText(/Dos decretos idénticos condenan y absuelven/)).toBeVisible();
  await page.getByRole('button', { name: /Preparar combate/ }).click();
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await advanceStoryPrelude(page);
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
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
  await page.getByRole('button', { name: /Preparar combate/ }).click();
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await advanceStoryPrelude(page);
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
});

test('star goals dialog is complete, keyboard-accessible and fits the phone', async ({ page }) => {
  await page.goto(campaign);
  await page.getByRole('button', { name: 'Ver objetivos del reto' }).click();
  const dialog = page.getByRole('dialog', { name: 'El pregón alterado' });
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText('Gana el combate')).toBeVisible();
  await expect(dialog.getByText('Conserva al menos 12 de vida')).toBeVisible();
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
  const menu = await page.locator('.dr-cinematic-actions').boundingBox();
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


test('original game keeps its rules but activates cards by selection plus target', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Full original turn flow sampled on the main phone');
  await page.addInitScript(() => { Math.random = () => 0.6; });
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Preparar combate/ }).click();
  await advanceStoryPrelude(page);
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
  await expect(page.locator('.dr-classic-screen .gold-leaf-frame')).toHaveCount(2);
  await expect(page.getByText('28', { exact: true })).toHaveCount(2);
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(page.getByText('¿Quién comienza?')).toBeHidden({ timeout: 12000 });
  const cards = page.locator('.dr-royal-hand-card');
  await expect(cards).toHaveCount(4, { timeout: 18000 });
  await expect(page.locator('.dr-royal-facedown')).toHaveCount(3);
  await expect(page.locator('.dr-royal-hand-count')).toHaveCount(0);
  const ordinary = cards.filter({ hasText: /Ataque|Defensa/ });
  const chosen = ordinary.last();
  const before = await cards.count();
  await chosen.click({ position: { x: 12, y: 26 } });
  await expect(chosen).toHaveAttribute('aria-pressed', 'true');
  await expect(cards).toHaveCount(before); // A tap only selects, it never spends a card.
  await page.getByRole('button', { name: 'Campo para activar Ataque, Defensa, Orden o Mística' }).click();
  await expect(cards).toHaveCount(before - 1);
  await expect(page.getByRole('button', { name: 'Jugar carta' })).toHaveCount(0);
  await expect(page.locator('.dr-mana')).toHaveCount(0);
  await page.screenshot({ path: testInfo.outputPath('royal-board-selected-and-activated.png'), fullPage: true });
});

test('original game and campaign use the same physical-looking board and audio controls', async ({ page }) => {
  test.skip(test.info().project.name !== 'mobile-390', 'One shared-component smoke test');
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
  await expect(page.getByTestId('story-combat-dialogue')).toHaveCount(0);
  await page.goto('/Decreto-Real/#/campania/mision/01');
  await page.getByRole('button', { name: /Preparar combate/ }).click();
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await advanceStoryPrelude(page);
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
  await expect(page.locator('.dr-classic-screen .gold-leaf-frame')).toHaveCount(2);
  await expect(page.locator('.dr-game.dr-original-table')).toHaveCount(0);
  const box = await page.locator('.dr-classic-screen').boundingBox();
  expect(box).not.toBeNull();
  expect(box!.y + box!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 2);
});

test('updated rules describe the restored original instead of Mando and shield', async ({ page }) => {
  await page.goto('/Decreto-Real/#/rules');
  await page.getByRole('button', { name: 'Cartas' }).click();
  await expect(page.getByText(/10 Ataques, 10 Defensas, 4 Impactos y 4 Órdenes/)).toBeVisible();
  await expect(page.getByRole('heading', { name: '28 cartas, cinco clases' })).toBeVisible();
  await page.getByRole('button', { name: 'Acciones' }).click();
  await expect(page.getByText(/Ataque: resta 2 puntos de vida/)).toBeVisible();
});

test('an attack cannot be wasted by touching it: actual pointer drag activates only on a valid drop', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'mobile-390', 'Pointer-drag flow sampled on main phone');
  await page.addInitScript(() => { Math.random = () => 0.6; });
  await page.goto('/Decreto-Real/#/game');
  await page.getByRole('button', { name: 'Lanzar Moneda' }).click();
  await expect(page.locator('.dr-royal-hand-card')).toHaveCount(4, { timeout: 19000 });
  const cards = page.locator('.dr-royal-hand-card');
  const ordinary = cards.filter({ hasText: /Ataque|Defensa/ }).last();
  const bounds = await ordinary.boundingBox();
  const target = await page.locator('.dr-royal-activation-target').boundingBox();
  expect(bounds).not.toBeNull(); expect(target).not.toBeNull();
  const before = await cards.count();
  const startX = bounds!.x + 12, startY = bounds!.y + 26;
  await page.mouse.move(startX, startY);
  await page.mouse.down();
  await page.mouse.move(target!.x + target!.width/2, target!.y + target!.height/2, {steps: 9});
  await page.mouse.up();
  await expect(cards).toHaveCount(before - 1);
  await expect(page.locator('.dr-royal-field-prompt')).toContainText('Selecciona una carta');
});

test('four Impact placements are ordered, and hands remain visible without numeric plaques', async ({ page }, testInfo) => {
  await page.goto('/Decreto-Real/#/game');
  await expect(page.locator('.dr-royal-impact-slot')).toHaveCount(4);
  await expect(page.locator('.dr-royal-impact-slot').nth(0)).toHaveAttribute('aria-label', 'Casilla Impacto I');
  await expect(page.locator('.dr-royal-impact-slot').nth(1)).toHaveAttribute('aria-label', 'Casilla Impacto II');
  await expect(page.locator('.dr-royal-impact-slot').nth(2)).toHaveAttribute('aria-label', 'Casilla Impacto III');
  await expect(page.locator('.dr-royal-impact-slot').nth(3)).toHaveAttribute('aria-label', 'Casilla Impacto Final');
  await expect(page.locator('.dr-royal-hand-count')).toHaveCount(0);
  await expect(page.locator('.dr-royal-combo')).toHaveCount(0);
  await expect(page.locator('.dr-royal-facedown')).toHaveCount(0);
  const viewport = page.viewportSize()!;
  for (const selector of ['.dr-royal-rival-area','.dr-royal-rival-hand','.dr-royal-field','.dr-royal-player-hand','.dr-royal-player-area']) {
    const rect = await page.locator(selector).boundingBox();
    expect(rect, selector).not.toBeNull();
    expect(rect!.y, selector).toBeGreaterThanOrEqual(-1);
    expect(rect!.y + rect!.height, selector).toBeLessThanOrEqual(viewport.height+1);
    expect(rect!.x, selector).toBeGreaterThanOrEqual(-1);
    expect(rect!.x + rect!.width, selector).toBeLessThanOrEqual(viewport.width+1);
  }
  expect(await page.evaluate(() => document.documentElement.scrollHeight <= window.innerHeight+1)).toBe(true);
  if (testInfo.project.name === 'mobile-390') {
    await page.screenshot({ path: testInfo.outputPath('new-royal-board-layout.png'), fullPage:true });
  }
});


test('campaign begins with three paragraphs and continues to the compact two-stop prologue', async ({ page }) => {
  await page.goto('/Decreto-Real/#/');
  await page.getByRole('button', { name: 'Empezar campaña' }).click();
  await expect(page.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeVisible();
  await expect(page.locator('.dci-story p')).toHaveCount(3);
  await page.getByRole('button', { name: /Continuar al prólogo/ }).click();
  await expect(page.locator('.dcm-prologue-map')).toBeVisible();
  await expect(page.locator('.dcm-marker')).toHaveCount(2);
  await expect(page.getByRole('button', { name: 'Volver al Menú' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Ver la historia' })).toHaveCount(0);
});

test('the general hub opens any region and only unlocks the center after eight generals', async ({ page }) => {
  await page.goto(campaign);
  await page.evaluate(() => {
    localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
      version: 1, stars: { '01': 1, '02': 1 },
    }));
    localStorage.setItem('decreto-real.campania.generales-presentados.v1', '1');
  });
  await page.goto('/Decreto-Real/#/campania/generales');
  await expect(page.getByRole('button', { name: /Escenario central bloqueado/ })).toBeDisabled();
  await page.getByRole('button', { name: /Nayisa de Sombras/ }).click();
  await page.getByRole('button', { name: 'Explorar región ⚔' }).click();
  await expect(page.getByRole('heading', { name: 'Sombras de la frontera' })).toBeVisible();
  await expect(page.locator('.dcmoment-missions li')).toHaveCount(4);
  await page.getByRole('button', { name: 'Ver las cuatro misiones ›' }).click();
  await expect(page.locator('.dcm-marker')).toHaveCount(4);
  await expect(page.getByText('Sombras de la frontera')).toBeVisible();
  await page.getByRole('button', { name: 'Volver al mapa de las ocho zonas' }).click();
  await page.evaluate(() => {
    localStorage.setItem('decreto-real.campania.v1', JSON.stringify({
      version: 1,
      stars: Object.fromEntries(Array.from({ length: 34 }, (_, i) => [String(i + 1).padStart(2, '0'), 1])),
    }));
  });
  await page.reload();
  await expect(page.getByRole('heading', { name: 'El centro ha despertado' })).toBeVisible();
  for (let index = 0; index < 3; index++) {
    await page.getByRole('button', { name: 'Continuar diálogo ›' }).click();
  }
  await page.getByRole('button', { name: /Ver el mapa y elegir el centro/ }).click();
  await expect(page.getByRole('button', { name: 'Entrar al escenario central desbloqueado' })).toBeEnabled();
  await page.getByRole('button', { name: 'Entrar al escenario central desbloqueado' }).click();
  await expect(page.getByText('La Revolución Solar', { exact: true })).toBeVisible();
});
