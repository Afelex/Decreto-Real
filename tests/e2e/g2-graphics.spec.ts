import { expect, test } from '@playwright/test';

// Alcance gráfico G2. No altera progreso real ni mecánicas de combate.
// Estos smoke tests comprueban los archivos servidos y su presencia efectiva en
// la Galería, el prólogo y el tramo narrativo del atardecer M35-M36.
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'mobile-390', 'QA gráfica G2 en viewport móvil principal');
});

const root = '/Decreto-Real/';
const verifyImage = async (locator: import('@playwright/test').Locator, pattern: RegExp) => {
  await expect(locator).toHaveAttribute('src', pattern);
  await expect.poll(() => locator.evaluate((node) =>
    node instanceof HTMLImageElement && node.complete ? node.naturalWidth : 0
  )).toBe(1024);
};

const progressThrough = (lastMission: number) => {
  const stars = Object.fromEntries(Array.from({ length: lastMission }, (_, i) =>
    [String(i + 1).padStart(2, '0'), 1]));
  localStorage.setItem('decreto-real.campania.v1', JSON.stringify({version:1,stars}));
};

test('los 25 fondos G2 existen, aparecen en el catálogo y sirven WebP válidos', async ({request}) => {
  const catalogResponse = await request.get(root + 'artes/catalogo.json');
  expect(catalogResponse.ok()).toBeTruthy();
  const catalog = await catalogResponse.json() as {
    version: number;
    items: Array<{path: string; generation?: string}>;
  };
  expect(catalog.version).toBe(2);
  const g2 = catalog.items.filter(x => x.generation === 'DR-G2-2026');
  expect(g2).toHaveLength(25);
  for (const item of g2) {
    const response = await request.get(root + item.path.replace(/^public\//, ''));
    expect(response.status(), item.path).toBe(200);
    const bytes = await response.body();
    expect(bytes.toString('ascii',0,4), item.path).toBe('RIFF');
    expect(bytes.toString('ascii',8,12), item.path).toBe('WEBP');
    expect(bytes.length,item.path).toBeGreaterThan(10_000);
  }
});

test('la galería distingue 25 G2 de G1 y muestra el fondo de las ruinas', async ({page}) => {
  await page.goto(root + '?drDev=1#/artes');
  await expect(page.getByRole('heading',{name:'Biblioteca central de artes'})).toBeVisible();
  await expect(page.locator('.dr-art-notice')).toContainText('25 G2 nuevos/locales');
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await expect(page.locator('.dr-art-card')).toHaveCount(25);
  await page.getByRole('button',{name:/G2 M35 C/i}).click();
  await expect(page.getByRole('complementary',{name:'Detalles del arte'})).toContainText('G2 M35 C');
  await verifyImage(page.locator('.dr-art-preview img'), /G2-M35-C\.webp$/);
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G1');
  await expect(page.locator('.dr-art-card').first()).toBeVisible();
  await expect(page.locator('.dr-art-card').filter({hasText:'G2 M35 C'})).toHaveCount(0);
});

test('el prólogo usa la Plaza del Pregón G2, no la ilustración G1', async ({page}) => {
  await page.goto(root + '#/campania/mision/01');
  await verifyImage(page.locator('.dc-region-illustration'), /prologo-plaza-del-pregon\.webp$/);
});

test('M35 cambia de casona intacta a derrumbe y ruinas antes del duelo contra Vándalo Rojo', async ({page}) => {
  await page.addInitScript(progressThrough,34);
  await page.goto(root + '#/campania/mision/35');
  await verifyImage(page.locator('.dc-region-illustration'), /G2-M35-A\.webp$/);
  await page.getByRole('button',{name:/Preparar combate/}).click();
  const backdrop = page.locator('.dcb-scenery');
  await verifyImage(backdrop, /G2-M35-A\.webp$/);
  for (let i=0;i<5;i++) await page.locator('.dcb-next').click();
  await verifyImage(backdrop, /G2-M35-B\.webp$/);
  for (let i=0;i<5;i++) await page.locator('.dcb-next').click();
  await verifyImage(backdrop, /G2-M35-C\.webp$/);
  await expect(page.getByText('Vándalo Rojo').first()).toBeVisible();
});

test('M36 muestra acceso a prisión y calabozos donde combate Gaspar de Armenta', async ({page}) => {
  await page.addInitScript(progressThrough,35);
  await page.goto(root + '#/campania/mision/36');
  await verifyImage(page.locator('.dc-region-illustration'), /G2-M36-A\.webp$/);
  await page.getByRole('button',{name:/Preparar combate/}).click();
  const backdrop = page.locator('.dcb-scenery');
  await verifyImage(backdrop, /G2-M36-A\.webp$/);
  await page.locator('.dcb-next').click();
  await verifyImage(backdrop, /G2-M36-B\.webp$/);
  await expect(page.getByText('León del Edicto').first()).toBeVisible();
});
