import {test,expect} from '@playwright/test';

test('Decreto Real Studio opens from QA and edits the same scene used by the game',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Interactive Studio MVP on a phone');
  await page.goto('/Decreto-Real/?drDev=1#/');
  await page.getByTestId('campaign-qa-toggle').click();
  await expect(page.getByTestId('studio-entry')).toBeVisible();
  await page.getByTestId('studio-entry').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.locator('.dcop-scene-figures')).toBeVisible();
  await expect(page.locator('.dcop-nameplate')).toContainText('Madre');
  await expect(page.getByTestId('campaign-qa')).toHaveCount(0);

  await page.getByTestId('studio-actor-select').selectOption('Niño');
  await expect(page.getByTestId('studio-scale')).toHaveValue('1');
  await page.getByTestId('studio-x').fill('12');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByTestId('studio-mirror').click();
  await expect(page.locator('[data-studio-actor="Niño"]')).toHaveClass(/dcop-studio-adjusted/);
  await expect(page.locator('[data-studio-actor="Niño"]')).toHaveAttribute('style',/12vw/);
  await page.getByTestId('studio-save').click();
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('guardado');

  await page.reload();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-actor-select').selectOption('Niño');
  await expect(page.getByTestId('studio-x')).toHaveValue('12');
  await expect(page.getByTestId('studio-mirror')).toHaveAttribute('aria-pressed','true');

  // The saved layout also applies in regular QA playback on this device.
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?escena=arresto');
  await expect(page.locator('.dcop-child-sprite')).toHaveAttribute('style',/12vw/);
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
});

test('Studio keeps changes isolated per dialogue beat and supports undo',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Per-beat editing on phone');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await page.getByTestId('studio-y').fill('5');
  await page.getByTestId('studio-y').press('Tab');
  await expect(page.getByTestId('studio-y')).toHaveValue('5');
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-y')).toHaveValue('0');
  await page.getByTestId('studio-y').fill('4');
  await page.getByTestId('studio-save').click();
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await expect(page.getByTestId('dr-studio')).toContainText('Intervención 3 /');
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await expect(page.getByTestId('studio-y')).toHaveValue('0');
  await page.getByRole('button',{name:'Escena anterior'}).click();
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await expect(page.getByTestId('studio-y')).toHaveValue('4');
});

test('Studio exports its document as versioned JSON',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio file backup');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:'⇩ Exportar proyecto'}).click()
  ]);
  expect(download.suggestedFilename()).toBe('decreto-real-studio-proyecto.json');
});


test('Studio v2 edits actors across different scenes and previews the exact beat',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v2 mobile scene editor');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-step-select').selectOption('4');
  await expect(page.locator('.dcop-nameplate')).toHaveText('Xervias');
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await page.getByTestId('studio-y').fill('7');
  await expect(page.locator('.dcop-hero')).not.toHaveCSS('transform','none');
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview-top').click();
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
  await expect(page.getByTestId('studio-return')).toBeVisible();
  await expect(page.locator('.dcop-hero')).toHaveAttribute('style',/7vh/);
  await page.getByTestId('studio-return').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.getByTestId('studio-step-select')).toHaveValue('4');
  await page.getByTestId('studio-step-select').selectOption('14');
  await expect(page.locator('.dcop-nameplate')).toHaveText('Domingo Quispe');
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-x').fill('-11');
  await page.getByTestId('studio-save').click();
  await expect(page.locator('.dcop-actor-domingo')).toHaveAttribute('style',/-11vw/);
  await page.getByTestId('studio-step-select').selectOption('4');
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await expect(page.getByTestId('studio-y')).toHaveValue('7');
});

test('Studio v2 can hide the bubble, replace a native sprite and change the background',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v2 local image library');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');
  const selectedImage={name:'nuevo-sprite.png',mimeType:'image/png',buffer:png};
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(1);
  await page.getByTestId('studio-bubble').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await page.locator('input[aria-label="Archivo replace"]').setInputFiles(selectedImage);
  await expect(page.locator('.dcop-civil > img:not(.dcop-child-sprite)')).toHaveAttribute('src',/^blob:/);
  await page.locator('input[aria-label="Archivo background"]').setInputFiles({
    name:'plaza-vacia.png',mimeType:'image/png',buffer:png,
  });
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await expect(page.locator('.dcop-civil > img:not(.dcop-child-sprite)')).toHaveAttribute('src',/^blob:/);
  await page.reload();
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
  await page.getByTestId('studio-return').click();
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
});

test('Studio v2 adds, moves and deletes an independent sprite and accepts an effect',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v2 media layering');
  const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.locator('input[aria-label="Archivo add"]').setInputFiles({
    name:'soldado-extra.png',mimeType:'image/png',buffer:png,
  });
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await expect(page.getByTestId('studio-actor-select')).toHaveValue(/extra-/);
  await page.getByTestId('studio-x').fill('10');
  await expect(page.getByTestId('studio-added-layer')).toHaveAttribute('style',/10vw/);
  await page.getByTestId('studio-delete').click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(0);
  const gif=Buffer.from('R0lGODlhAQABAAAAACwAAAAAAQABAAA=','base64');
  await page.locator('input[aria-label="Archivo effect"]').setInputFiles({
    name:'destello.gif',mimeType:'image/gif',buffer:gif,
  });
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await page.getByTestId('studio-save').click();
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:'⇩ Exportar proyecto'}).click(),
  ]);
  const path=await download.path();
  if(!path)throw new Error('No se pudo leer el respaldo');
  const fs=await import('node:fs/promises');
  const pack=JSON.parse(await fs.readFile(path,'utf8'));
  expect(pack.studioPackage).toBe(2);
  expect(pack.document.assets).toBeTruthy();
  expect(pack.media.length).toBeGreaterThanOrEqual(2);
});


test('Studio v2 can reposition, rewrite and hide a quick speech bubble',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio bubble editor');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Globo');
  await page.getByTestId('studio-bubble-text').fill('¡Ayudadnos!');
  await page.getByTestId('studio-x').fill('6');
  await expect(page.locator('.dcop-quick-bubble')).toContainText('¡Ayudadnos!');
  await expect(page.locator('.dcop-quick-bubble')).not.toHaveCSS('transform','none');
  await page.getByTestId('studio-delete').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview-top').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await page.getByTestId('studio-return').click();
  await page.getByTestId('studio-bubble').click();
  await expect(page.locator('.dcop-quick-bubble')).toContainText('¡Ayudadnos!');
});
