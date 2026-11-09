import { expect, test } from '@playwright/test';

const start = '/Decreto-Real/?drDev=1#/campania/inicio';
const saveKey = 'decreto-real.campania.v1';

async function openQa(page: import('@playwright/test').Page) {
  await page.getByTestId('campaign-qa-toggle').click();
  await expect(page.getByRole('dialog', { name: 'Navegador de campaña de pruebas' })).toBeVisible();
}

test('QA begins like a new player and jumps to a boss without overwriting the real save', async ({ page }) => {
  await page.goto(start);
  const realSave = JSON.stringify({ version: 1, stars: { '01': 3 } });
  await page.evaluate(([key, value]) => window.localStorage.setItem(key, value), [saveKey, realSave]);
  await openQa(page);
  await page.getByRole('button', { name: /Desde el inicio/ }).click();
  await expect(page.getByRole('heading', { name: 'El Sello y la Revolución Solar' })).toBeVisible();
  await openQa(page);
  await page.getByLabel('Capítulo o sección').selectOption({ label: 'Región 7 · El cóndor y las cumbres' });
  await page.getByRole('button', { name: /M30 · El Cóndor de los Andes/ }).click();
  await expect(page.getByRole('heading', { name: 'El Cóndor de los Andes' })).toBeVisible();
  expect(await page.evaluate(key => window.localStorage.getItem(key), saveKey)).toBe(realSave);
  await openQa(page);
  await page.getByRole('button', { name: /Salir de prueba/ }).click();
  await expect(page.getByRole('navigation', { name: 'Menú principal' })).toBeVisible();
  expect(await page.evaluate(key => window.localStorage.getItem(key), saveKey)).toBe(realSave);
});

test('QA opens the Sigumán battle and credits directly', async ({ page }) => {
  await page.goto(start);
  await openQa(page);
  await page.getByLabel('Capítulo o sección').selectOption('Final');
  await page.getByRole('button', { name: 'Combate M38 · Sigumán' }).click();
  await expect(page.getByTestId('story-combat-dialogue')).toBeVisible();
  await openQa(page);
  await page.getByLabel('Capítulo o sección').selectOption('Desenlace');
  await page.getByRole('button', { name: 'Créditos' }).click();
  await expect(page.getByRole('heading', { name: 'Créditos' })).toBeVisible();
  await expect(page.getByText('Gracias por acompañar a Xervias')).toBeVisible();
});

test('QA popup fits small viewports and never creates outer scrolling', async ({ page }) => {
  await page.goto(start);
  await openQa(page);
  const measurements = await page.evaluate(() => {
    const panel = document.querySelector('.dr-qa-panel')!.getBoundingClientRect();
    return {
      left: panel.left, top: panel.top, right: panel.right, bottom: panel.bottom,
      width: window.innerWidth, height: window.innerHeight,
    };
  });
  expect(measurements.left).toBeGreaterThanOrEqual(0);
  expect(measurements.top).toBeGreaterThanOrEqual(0);
  expect(measurements.right).toBeLessThanOrEqual(measurements.width + 1);
  expect(measurements.bottom).toBeLessThanOrEqual(measurements.height + 1);
});
