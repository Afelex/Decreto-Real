import {test,expect} from '@playwright/test';
import {readZip} from '../../campaign/studio/zip';

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
  await expect(page.locator('[data-studio-actor="actor-nino"]')).toHaveClass(/dcop-studio-adjusted/);
  await expect(page.locator('[data-studio-actor="actor-nino"]')).toHaveAttribute('style',/--studio-x: 12;/);
  await page.getByTestId('studio-save').click();
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('guardado');

  await page.reload();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-actor-select').selectOption('Niño');
  await expect(page.getByTestId('studio-x')).toHaveValue('12');
  await expect(page.getByTestId('studio-mirror')).toHaveAttribute('aria-pressed','true');

  // The saved layout also applies in regular QA playback on this device.
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?escena=arresto');
  await expect(page.locator('.dcop-child-sprite')).toHaveAttribute('style',/--studio-x: 12;/);
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

test('Studio exports its project as a versioned ZIP',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio file backup');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:'⇩ Exportar proyecto'}).click()
  ]);
  expect(download.suggestedFilename()).toBe('decreto-real-studio-proyecto.zip');
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
  await expect(page.locator('.dcop-hero')).toHaveAttribute('style',/--studio-y: 7;/);
  await page.getByTestId('studio-return').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.getByTestId('studio-step-select')).toHaveValue('4');
  await page.getByTestId('studio-step-select').selectOption('14');
  await expect(page.locator('.dcop-nameplate')).toHaveText('Domingo Quispe');
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-x').fill('-11');
  await page.getByTestId('studio-save').click();
  await expect(page.locator('.dcop-actor-domingo')).toHaveAttribute('style',/--studio-x: -11;/);
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
  await expect(page.getByTestId('studio-added-layer')).toHaveAttribute('style',/--studio-x: 10;/);
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
  const entries=readZip(new Uint8Array(await fs.readFile(path)));
  const pack=JSON.parse(new TextDecoder().decode(entries.find(e=>e.name==='proyecto.json')!.data));
  expect(entries.filter(e=>e.name.startsWith('media/')).length).toBe(pack.media.length);
  expect(pack.studioPackage).toBe(3);
  expect(pack.document.version).toBe(3);
  // The deleted sprite's file is no longer referenced, so it is not exported.
  expect(pack.media.length).toBe(1);
  expect(Object.keys(pack.document.assets)).toEqual(pack.media.map((m:{id:string})=>m.id));
});


test('Studio v2 can reposition, rewrite and hide a quick speech bubble',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio bubble editor');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Globo de texto');
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


const center=async(page:import('@playwright/test').Page,selector:string)=>{
  const box=await page.locator(selector).first().boundingBox();
  if(!box)throw new Error('Elemento no visible: '+selector);
  return {x:box.x+box.width/2,y:box.y+box.height*.7};
};

test('Studio v3: tapping selects without an undo entry; one drag is one undo step',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v3 history on phone');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByRole('button',{name:'Contraer editor'}).click();
  const start=await center(page,'.dcop-actor-domingo');
  await page.mouse.click(start.x,start.y);
  await page.getByRole('button',{name:'Abrir editor'}).click();
  await expect(page.getByRole('button',{name:'↶ Deshacer'})).toBeDisabled();
  await page.getByRole('button',{name:'Contraer editor'}).click();
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  for(let i=1;i<=6;i++)await page.mouse.move(start.x-6.5*i,start.y);
  await page.mouse.up();
  await page.getByRole('button',{name:'Abrir editor'}).click();
  await expect(page.getByTestId('studio-actor-select')).toHaveValue('actor-domingo');
  // 39 px on a 390 px stage = -10 % of the stage width.
  await expect(page.getByTestId('studio-x')).toHaveValue('-10');
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
  await expect(page.getByRole('button',{name:'↶ Deshacer'})).toBeDisabled();
  await page.getByRole('button',{name:'↷ Rehacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('-10');
});

test('Studio v3 keeps undo history when moving between beats',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v3 navigation without remount');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await page.getByTestId('studio-x').fill('-6');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await expect(page.getByTestId('dr-studio')).toContainText('Intervención 3 /');
  await expect(page.getByRole('button',{name:'↶ Deshacer'})).toBeEnabled();
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('Deshecho · arresto-01');
  await page.getByRole('button',{name:'Escena anterior'}).click();
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
});

test('Studio v3 positions are relative to the stage, not the browser viewport',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390'&&info.project.name!=='landscape','Stage units on phone and landscape');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await page.getByTestId('studio-x').fill('10');
  await page.getByTestId('studio-x').press('Tab');
  const result=await page.evaluate(()=>{
    const stage=document.querySelector('.dcop-stage')!.getBoundingClientRect();
    const actor=document.querySelector('.dcop-civil')!;
    const matrix=new DOMMatrix(getComputedStyle(actor).transform);
    return {stageWidth:stage.width,translateX:matrix.e,viewport:window.innerWidth};
  });
  expect(Math.abs(result.translateX-result.stageWidth*.1)).toBeLessThan(1);
  if(info.project.name==='landscape')expect(result.stageWidth).toBeLessThan(result.viewport);
});

test('Studio v3 converts an existing Studio v2 draft and keeps the old one as backup',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio v2 to v3 migration');
  const legacy=JSON.stringify({version:1,scenes:{'opening:1':{'Niño':{x:12,y:0,scale:1,mirror:true,layer:6,visible:true}}}});
  await page.goto('/Decreto-Real/?drDev=1#/');
  await page.evaluate(raw=>localStorage.setItem('decreto-real.studio.borradores.v1',raw),legacy);
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('convertido a v3');
  await expect(page.locator('[data-studio-actor="actor-nino"]')).toHaveAttribute('style',/--studio-x: 12;/);
  await page.getByTestId('studio-save').click();
  const stored=await page.evaluate(()=>({
    v3:JSON.parse(localStorage.getItem('decreto-real.studio.borradores.v3')??'null'),
    v1:localStorage.getItem('decreto-real.studio.borradores.v1'),
  }));
  expect(stored.v3.version).toBe(3);
  expect(Object.keys(stored.v3.scenes)).toEqual(['prologo/arresto-01']);
  expect(stored.v1).toBe(legacy);
});

test('Studio v3 exit leaves the editor instead of opening the preview',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Studio exit');
  await page.goto('/Decreto-Real/?drDev=1#/studio');
  await page.getByTestId('studio-exit').click();
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
  await expect(page.getByTestId('studio-return')).toHaveCount(0);
  await expect(page).toHaveURL(/#\/$/);
});
