import { expect, test } from '@playwright/test';

const start='/Decreto-Real/?drDev=1';

test.beforeEach(async ({},info)=>{
  test.skip(info.project.name!=='mobile-390','Revisión de la biblioteca en móvil principal');
});

test('25 fondos G2 aparecen automáticamente en la biblioteca de Studio sin subir ZIP',async({page})=>{
  await page.goto(start+'#/campania/prologo?studio=1&studioStep=4');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-library-toggle').click();
  await expect(page.getByTestId('studio-library-summary')).toContainText('25 G2 publicados');
  await expect(page.getByTestId('studio-library-g2-item')).toHaveCount(25);
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
