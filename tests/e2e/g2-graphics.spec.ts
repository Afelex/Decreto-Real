import { expect, test } from '@playwright/test';

// Alcance gráfico G2. No altera progreso real ni mecánicas de combate.
// Estos smoke tests comprueban los archivos servidos y su presencia efectiva en
// la Galería, el prólogo y el tramo narrativo del atardecer M35-M36.
test.beforeEach(async ({}, info) => {
  test.skip(info.project.name !== 'mobile-390', 'QA gráfica G2 en viewport móvil principal');
});

const root = '/Decreto-Real/';
async function candidateCount(page:import('@playwright/test').Page):Promise<number>{
  const response=await page.request.get(root+'artes/catalogo.json');
  const catalog=await response.json() as {items:{state?:string}[]};
  return catalog.items.filter(x=>x.state==='candidato-sin-aprobar').length;
}

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
  const g2 = catalog.items.filter(x => x.generation === 'DR-G2-2026' && x.path.startsWith('public/artes/generaciones/'));
  expect(g2).toHaveLength(25);
  const masters=catalog.items.filter(x=>x.path.startsWith('art-reference/personajes-oficiales/imagenes/'));
  expect(masters).toHaveLength(6);
  expect(masters.every(x=>x.generation==='DR-G2-2026')).toBe(true);
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
  const expected=31+await candidateCount(page);
  await expect(page.locator('.dr-art-notice')).toContainText(expected+' G2 nuevos/locales');
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await expect(page.locator('.dr-art-card')).toHaveCount(expected);
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

test('un fondo G2 publicado puede incorporarse a la biblioteca local de DRStudio', async ({page}) => {
  await page.goto(root + '?drDev=1#/artes');
  await expect(page.getByRole('heading',{name:'Biblioteca central de artes'})).toBeVisible();
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await page.getByRole('button',{name:/G2 M35 C/i}).click();
  await page.getByRole('button',{name:/Usar en DRStudio/}).click();
  await expect(page.getByRole('status')).toContainText('está disponible en DRStudio');
  await expect(page.locator('.dr-art-card')).toHaveCount(32+await candidateCount(page));
  await page.reload();
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await expect(page.locator('.dr-art-card').filter({hasText:'G2-M35-C.webp'})).toBeVisible();
});

test('la Galería G2 distingue los seis originales de las expresiones pendientes',async({page})=>{
  await page.goto(root+'?drDev=1#/artes');
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await page.getByRole('combobox',{name:'Filtrar por sección'}).selectOption('Personajes · Referencias G2');
  const cards=page.locator('.dr-art-card');
  await expect(cards).toHaveCount(6);
  await expect(page.getByRole('button',{name:/Isabela Valdierra/i})).toBeVisible();
  await page.getByRole('button',{name:/Isabela Valdierra/i}).click();
  await expect(page.getByRole('complementary',{name:'Detalles del arte'})).toContainText('Referencia maestra G2');
});

test('las expresiones candidatas importadas son revisables, pero no sustituyen sprites G1',async({page})=>{
  await page.goto(root+'?drDev=1#/artes');
  const count=await candidateCount(page);
  test.skip(count===0,'El ZIP de expresiones aún no ha sido importado.');
  expect(count).toBe(6);
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  await page.getByRole('combobox',{name:'Filtrar por sección'}).selectOption('Personajes · Candidatos G2');
  await expect(page.locator('.dr-art-card')).toHaveCount(6);
  await page.getByRole('button',{name:/Leandro Valcázar/i}).click();
  const inspector=page.getByRole('complementary',{name:'Detalles del arte'});
  await expect(inspector).toContainText('Expresión candidata G2 · No aprobada ni activada');
  await expect(inspector.getByRole('button',{name:/Usar en DRStudio/})).toHaveCount(0);
});
