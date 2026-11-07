import {test,expect} from '@playwright/test';

/** Revisión manual: escena 1 (pergamino) y textos de interfaz del bloque inferior. */
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);

test('beat 1: the parchment card can be selected, moved and removed',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Native scene elements');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=0');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-actor-select').selectOption({label:'Tarjeta «Por orden de la Corona»'});
  await page.getByTestId('studio-x').fill('8');
  await page.getByTestId('studio-x').press('Tab');
  const card=page.locator('[data-studio-actor="native-pergamino-carta"]');
  await expect(card).toHaveAttribute('style',/--studio-x: 8;/);
  await page.getByTestId('studio-delete').click();
  await expect(card).toHaveClass(/dcop-studio-hidden/);
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview').click();
  await expect(page.locator('.dcop-parchment')).toHaveCSS('opacity','0');
});

test('nameplate, progress and title can be shown only to developers; the block can be narrower',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Dialogue chrome');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=0');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-dialogue-scope').selectOption('all');
  await page.getByTestId('studio-hide-nameplate').click();
  await page.getByTestId('studio-hide-progress').click();
  await page.getByTestId('studio-hide-title-all').click();
  const full=(await page.locator('.dcop-narrative').boundingBox())!.width;
  await page.getByTestId('studio-dialogue-box-width').fill('0.7');
  await expect.poll(async()=>(await page.locator('.dcop-narrative').boundingBox())!.width).toBeLessThan(full*.75);
  // Editor (desarrollador): todo visible.
  await expect(page.locator('.dcop-nameplate')).toBeVisible();
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview').click();
  await expect(page.locator('.dcop-nameplate')).toBeVisible();
  await page.getByTestId('studio-audience').click();
  await expect(page.locator('.dcop-nameplate')).toHaveCount(0);
  await expect(page.getByLabel('Progreso del diálogo')).toHaveCount(0);
  await expect(page.locator('.dcop-chapter-title')).toHaveCount(0);
  // «Todas»: también en otra intervención.
  await page.getByRole('button',{name:'Continuar'}).click();
  await expect(page.locator('.dcop-nameplate')).toHaveCount(0);
});
