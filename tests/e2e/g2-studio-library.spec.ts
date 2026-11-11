import { expect, test } from '@playwright/test';

const start='/Decreto-Real/?drDev=1';

test.beforeEach(async ({},info)=>{
  test.skip(info.project.name!=='mobile-390','Revisión de la biblioteca en móvil principal');
});

test('25 fondos G2 aparecen automáticamente en la biblioteca de Studio sin subir ZIP',async({page})=>{
  await page.goto(start+'#/campania/prologo?studio=1&studioStep=4');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-library-toggle').click();
  await expect(page.getByTestId('studio-library-summary')).toContainText('25 fondos G2 · 6 maestros G2');
  await expect(page.getByTestId('studio-library-g2-item')).toHaveCount(25);
  await expect(page.getByTestId('studio-library-master-item')).toHaveCount(6);
  await expect(page.getByTestId('studio-library-item')).toHaveCount(0);
  await page.getByRole('combobox',{name:'Origen de la biblioteca'}).selectOption('g2');
  await page.getByRole('searchbox',{name:'Buscar en biblioteca'}).fill('G2-FON-002');
  const g2=page.getByTestId('studio-library-g2-item');
  await expect(g2).toHaveCount(1);
  await expect(g2).toContainText('Plaza del Pregón');
  await g2.getByTestId('studio-g2-use-background').click();
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
  await page.getByRole('combobox',{name:'Origen de la biblioteca'}).selectOption('local');
  await expect(page.getByTestId('studio-library-item')).toHaveCount(1);
  await page.getByTestId('studio-save').click();
  await page.reload();
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
});

test('en pantalla narrativa se elige un fondo G2 y se conserva al regresar',async({page})=>{
  await page.goto(start+'#/studio/escenas');
  await expect(page.getByTestId('studio-scenes-catalog-page')).toBeVisible();
  await page.locator('[data-testid="studio-catalog-item"][data-path="/campania/mision/35"]').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-screen-library-open').click();
  await expect(page.getByTestId('studio-library-g2-item')).toHaveCount(25);
  await page.getByRole('combobox',{name:'Origen de la biblioteca'}).selectOption('g2');
  await page.getByRole('searchbox',{name:'Buscar en biblioteca'}).fill('G2-M35-C');
  const g2=page.getByTestId('studio-library-g2-item');
  await expect(g2).toHaveCount(1);
  await expect(g2).toContainText('M35 · Ruinas');
  await g2.getByTestId('studio-g2-use-background').click();
  await expect(page.locator('.dc-region-illustration')).toHaveAttribute('src',/^blob:/);
  await page.getByTestId('studio-save').click();
  await page.reload();
  await expect(page.locator('.dc-region-illustration')).toHaveAttribute('src',/^blob:/);
});

test('las seis referencias originales están disponibles en Studio sin reemplazar sprites G1',async({page})=>{
  await page.goto(start+'#/campania/prologo?studio=1&studioStep=4');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-library-toggle').click();
  await page.getByRole('combobox',{name:'Origen de la biblioteca'}).selectOption('masters');
  const masters=page.getByTestId('studio-library-master-item');
  await expect(masters).toHaveCount(6);
  await expect(page.getByTestId('studio-library-g2-item')).toHaveCount(0);
  await expect(masters.filter({hasText:'Leandro Valcázar'})).toHaveCount(1);
  await expect(masters.filter({hasText:'Aukan del Cóndor'})).toHaveCount(1);
  await expect(masters.first()).toContainText('no expresión aprobada');
  await expect(masters.first().getByRole('link',{name:/Ver referencia maestra/})).toHaveAttribute('href',/^https:\/\/raw\.githubusercontent\.com\/Afelex\/Decreto-Real\/main\/art-reference\//);
  await expect(masters.first().getByTestId('studio-g2-use-sprite')).toHaveCount(0);
});

test('DRStudio distingue seis expresiones candidatas del arte aprobado cuando se importen',async({page})=>{
  const response=await page.request.get('/Decreto-Real/artes/catalogo.json');
  const catalog=await response.json() as {items:{state?:string}[]};
  const expected=catalog.items.filter(x=>x.state==='candidato-sin-aprobar').length;
  test.skip(expected===0,'El ZIP de control aún no está incorporado al repositorio.');
  expect(expected).toBe(6);
  await page.goto(start+'#/campania/prologo?studio=1&studioStep=4');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-library-toggle').click();
  await page.getByRole('combobox',{name:'Origen de la biblioteca'}).selectOption('candidates');
  const list=page.getByTestId('studio-library-candidate-item');
  await expect(list).toHaveCount(6);
  await expect(list.first()).toContainText('Candidato sin aprobar');
  await expect(list.first().getByRole('link',{name:/Ver expresión candidata/})).toBeVisible();
  await expect(list.first().getByTestId('studio-g2-use-sprite')).toHaveCount(0);
  await expect(page.getByTestId('studio-library-master-item')).toHaveCount(0);
});
