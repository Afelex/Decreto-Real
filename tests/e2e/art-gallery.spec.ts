import {test,expect} from '@playwright/test';
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');

test('La galería muestra el catálogo, dimensiones y el arte que se sube desde aquí',async({page},info)=>{
  test.skip(!['desktop-1280','mobile-390'].includes(info.project.name));
  await page.goto('/Decreto-Real/?drDev=1#/artes');
  await expect(page.getByRole('heading',{name:'Biblioteca central de artes'})).toBeVisible();
  await expect(page.getByText('143 artes del repositorio')).toBeVisible();
  await page.getByRole('button',{name:'＋ Subir imágenes o videos'}).click();
  await page.locator('input[type=file][multiple]').setInputFiles({name:'prueba-galeria.png',mimeType:'image/png',buffer:PNG});
  await expect(page.getByRole('status')).toContainText('DRStudio puede utilizarlos');
  await page.getByRole('searchbox',{name:'Buscar artes'}).fill('prueba-galeria');
  await page.getByRole('button',{name:/Prueba Galeria/i}).click();
  await expect(page.getByRole('complementary',{name:'Detalles del arte'})).toContainText('1 × 1 px');
  await page.getByRole('button',{name:'Ocultar arte'}).click();
  await expect(page.getByRole('button',{name:/Prueba Galeria/i})).toHaveCount(0);
  await page.getByRole('checkbox',{name:'Mostrar ocultos y descartados'}).check();
  await expect(page.getByRole('button',{name:/Prueba Galeria/i})).toBeVisible();
});

test('Una imagen subida desde DRStudio aparece en la galería del mismo origen',async({page},info)=>{
  test.skip(info.project.name!=='desktop-1280');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=4');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.locator('input[aria-label="Archivo add"]').setInputFiles({name:'desde-studio.png',mimeType:'image/png',buffer:PNG});
  await page.goto('/Decreto-Real/?drDev=1#/artes');
  await page.getByRole('searchbox',{name:'Buscar artes'}).fill('desde-studio');
  await expect(page.getByRole('button',{name:/Desde Studio/i})).toBeVisible();
});
