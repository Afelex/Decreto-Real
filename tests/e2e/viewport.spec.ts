import { expect, test, type Page } from '@playwright/test';

test.describe.configure({ timeout: 20_000 });

const route = (name: string) => `/Decreto-Real/#/${name}`;

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


async function fits(page: Page, selector: string) {
  const result = await page.locator(selector).evaluate(element => {
    const box = element.getBoundingClientRect();
    return {
      top: box.top, bottom: box.bottom, left: box.left, right: box.right,
      viewportHeight: window.innerHeight, viewportWidth: window.innerWidth,
    };
  });
  expect(result.top, selector + ' must begin inside the screen').toBeGreaterThanOrEqual(-2);
  expect(result.bottom, selector + ' must end inside the screen').toBeLessThanOrEqual(result.viewportHeight + 2);
  expect(result.left, selector + ' must start inside the screen').toBeGreaterThanOrEqual(-2);
  expect(result.right, selector + ' must end inside the screen').toBeLessThanOrEqual(result.viewportWidth + 2);
}

async function noPageScroll(page: Page) {
  const layout = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      y: Math.max(doc.scrollHeight,body.scrollHeight) - window.innerHeight,
      x: Math.max(doc.scrollWidth,body.scrollWidth) - window.innerWidth,
    };
  });
  expect(layout.y, 'Screen must not scroll vertically').toBeLessThanOrEqual(2);
  expect(layout.x, 'Screen must not scroll horizontally').toBeLessThanOrEqual(2);
}

test('home menu stays fully inside one screen', async ({ page }, testInfo) => {
  await page.goto(route(''));
  await expect(page.getByRole('button', { name: 'Empezar campaña' })).toBeVisible();
  await fits(page, '.dr-cinematic-brand');
  await fits(page, '.dr-cinematic-actions');
  await expect(page.getByText('Juego de Cartas', { exact: true })).toBeVisible();
  await expect(page.locator('.dr-cinematic-actions button')).toHaveCount(5);
  for (const button of await page.locator('.dr-cinematic-actions button').all()) {
    const bounds = await button.boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.y).toBeGreaterThanOrEqual(-1);
    expect(bounds!.y + bounds!.height).toBeLessThanOrEqual(page.viewportSize()!.height + 1);
  }
  await noPageScroll(page);
  await page.screenshot({ path: testInfo.outputPath('menu-one-screen.png'), fullPage: true });
});

test('rules are paginated and every navigation control stays visible', async ({ page }) => {
  await page.goto(route('rules'));
  await expect(page.getByRole('heading', { name: 'Reglas del Reino' })).toBeVisible();
  await fits(page, '.dr-guide-footer');
  await noPageScroll(page);
  await page.getByRole('button', { name: 'Impactos' }).click();
  await expect(page.getByRole('heading', { name: 'El Decreto Final' })).toBeVisible();
  await fits(page, '.dr-guide-points');
});

test('story pages show all characters and eight generals without vertical scrolling', async ({ page }) => {
  await page.goto(route('campania/historia'));
  await expect(page.getByRole('heading', { name: 'El reino escucha dos verdades' })).toBeVisible();
  await fits(page, '.dc-page-footer');
  await noPageScroll(page);
  await page.getByRole('button', { name: 'Personajes' }).click();
  await fits(page, '.dc-full-cast');
  await page.getByRole('button', { name: 'Ocho generales' }).click();
  await expect(page.locator('.dc-full-generals > div')).toHaveCount(8);
  await fits(page, '.dc-full-generals');
});

test('mission briefing and battle keep their last action visible', async ({ page }, testInfo) => {
  await page.goto(route('campania/mision/01'));
  await expect(page.getByRole('heading', { name: 'El pregón alterado' })).toBeVisible();
  await fits(page, '.dc-briefing-actions');
  await noPageScroll(page);
  await page.getByRole('button', { name: /Preparar combate/ }).click();
  await advanceStoryPrelude(page);
  await expect(page.getByText('¿Quién comienza?')).toBeVisible();
  await fits(page, '.dr-classic-screen');
  await noPageScroll(page);
  await page.screenshot({ path: testInfo.outputPath('original-ritual-one-screen.png'), fullPage: true });
});

test('guided tutorial preserves the hand and the end-turn control', async ({ page }) => {
  await page.goto(route('duelo-v1/tutorial'));
  await expect(page.getByRole('heading', { name: 'Decreto Real' })).toBeVisible();
  await fits(page, '.dr-coach');
  await fits(page, '.dr-actions');
  await noPageScroll(page);
});

test('options, previous result and original game never create body scrolling', async ({ page }) => {
  await page.goto(route('options'));
  await fits(page, '.dr-options-panel');
  await noPageScroll(page);
  await page.goto(route('victory'));
  await fits(page, '.dr-result-screen__actions');
  await noPageScroll(page);
  await page.goto(route('game'));
  await fits(page, '.dr-classic-screen');
  await noPageScroll(page);
});
