import {test,expect,type Page} from '@playwright/test';
import {readZip} from '../../campaign/studio/zip';

/**
 * Decreto Real Studio v3 · fase 5: biblioteca multimedia, archivos duplicados,
 * firma real de los archivos, limpieza segura, respaldo ZIP e importación con
 * fusionar o reemplazar.
 */
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');
const PNG2=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAIAAAACCAQAAADYv8WvAAAAEUlEQVR42mNk+M9Qz8DAwMAAAA4AAf9Gk0IAAAAASUVORK5CYII=','base64');
const GIF=Buffer.from('R0lGODlhAQABAAAAACwAAAAAAQABAAA=','base64');
const status=(page:Page)=>page.locator('.dr-studio-bottom [role="status"]');

async function open(page:Page,step=4){
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep='+step);
  await expect(page.getByTestId('dr-studio')).toBeVisible();
}
const addSprite=(page:Page,name:string,buffer:Buffer,mimeType='image/png')=>
  page.locator('input[aria-label="Archivo add"]').setInputFiles({name,mimeType,buffer});

test('an identical file is reused instead of duplicated, and fake images are rejected by content',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Dedupe and signature');
  await open(page);
  await addSprite(page,'soldado.png',PNG);
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await addSprite(page,'soldado-copia.png',PNG);
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(2);
  await expect(status(page)).toContainText('no se duplicó');
  // A text file disguised as PNG never enters the library.
  await addSprite(page,'trampa.png',Buffer.from('<svg xmlns="http://www.w3.org/2000/svg" onload="alert(1)"/>'));
  await expect(status(page)).toContainText('contenido del archivo no coincide');
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(2);
  // A real PNG with a misleading name and type is accepted by its content.
  await page.locator('input[aria-label="Archivo effect"]').setInputFiles({name:'efecto.mp4',mimeType:'video/mp4',buffer:PNG2});
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(3);
  await page.getByTestId('studio-library-toggle').click();
  await expect(page.getByTestId('studio-library-item')).toHaveCount(2);
  await expect(page.getByTestId('studio-library-summary')).toContainText('2 archivos');
});

test('library: reuse a file in another beat, rename it, and see where it is used',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Library reuse');
  await open(page);
  await addSprite(page,'estandarte.png',PNG);
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(0);
  await page.getByTestId('studio-library-toggle').click();
  const item=page.getByTestId('studio-library-item');
  await expect(item).toHaveCount(1);
  await expect(item).toContainText('en uso en 1 escena');
  await item.getByTestId('studio-library-use-sprite').click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await expect(item).toContainText('en uso en 2 escenas');
  await expect(item.getByTestId('studio-library-delete')).toBeDisabled();
  const name=item.getByTestId('studio-library-name');
  await name.fill('Estandarte real');
  await name.press('Enter');
  await expect(status(page)).toContainText('renombrado');
  await page.getByRole('button',{name:'Cerrar biblioteca'}).click();
  await page.getByTestId('studio-library-toggle').click();
  await expect(page.getByTestId('studio-library-name')).toHaveValue('Estandarte real');
  // Same file as background: still a single library item.
  await page.getByTestId('studio-library-use-background').click();
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',/^blob:/);
  await expect(page.getByTestId('studio-library-item')).toHaveCount(1);
});

test('cleaning never deletes files still reachable by undo, and frees orphans after saving and reloading',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Safe cleanup');
  await open(page);
  await addSprite(page,'temporal.png',PNG);
  await page.getByTestId('studio-delete').click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(0);
  await page.getByTestId('studio-library-toggle').click();
  // Still in the undo history: protected.
  await expect(page.getByTestId('studio-library-item')).toHaveAttribute('data-protected','true');
  await expect(page.getByTestId('studio-library-clean')).toBeDisabled();
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await expect(page.getByTestId('studio-added-layer').locator('img')).toHaveAttribute('src',/^blob:/);
  await page.getByRole('button',{name:'↷ Rehacer'}).click();
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-library-toggle').click();
  await expect(page.getByTestId('studio-library-item')).toHaveAttribute('data-protected','false');
  await page.getByTestId('studio-library-clean').click();
  await page.getByTestId('studio-library-clean-confirm').click();
  await expect(page.getByTestId('studio-library-item')).toHaveCount(0);
  await expect(status(page)).toContainText('1 archivos sin uso eliminados');
});

test('ZIP backup: export, then import with merge, replace or cancel, restoring the media files',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'ZIP import/export');
  await open(page);
  await page.locator('input[aria-label="Archivo effect"]').setInputFiles({name:'destello.gif',mimeType:'image/gif',buffer:GIF});
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await page.getByTestId('studio-save').click();
  const [download]=await Promise.all([page.waitForEvent('download'),
    page.getByRole('button',{name:'⇩ Exportar proyecto'}).click()]);
  expect(download.suggestedFilename()).toBe('decreto-real-studio-proyecto.zip');
  const zipPath=(await download.path())!;
  const fs=await import('node:fs/promises');
  const entries=readZip(new Uint8Array(await fs.readFile(zipPath)));
  expect(entries.map(e=>e.name).filter(n=>n.startsWith('media/'))).toHaveLength(1);
  expect(entries.find(e=>e.name.startsWith('media/'))!.name).toMatch(/\.gif$/);

  // A different draft: edit beat 6 and remove the effect from beat 5; wipe the media library.
  await page.getByTestId('studio-delete').click();
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await page.getByTestId('studio-x').fill('5');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByTestId('studio-save').click();
  await page.evaluate(()=>new Promise(resolve=>{const r=indexedDB.deleteDatabase('decreto-real-studio-media-v1');r.onsuccess=r.onerror=r.onblocked=()=>resolve(null);}));

  const project=page.locator('input[aria-label="Archivo project"]');
  // Cancel: nothing changes.
  await project.setInputFiles(zipPath);
  await expect(page.getByTestId('studio-import-dialog')).toContainText('1 escenas editadas');
  await page.getByTestId('studio-import-cancel').click();
  await expect(page.getByTestId('studio-import-dialog')).toHaveCount(0);
  await expect(page.getByTestId('studio-x')).toHaveValue('5');
  // Merge: keeps beat 6, brings back beat 5 with its effect and the file itself.
  await project.setInputFiles(zipPath);
  await page.getByTestId('studio-import-merge').click();
  await expect(status(page)).toContainText('fusionado');
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await expect(page.getByTestId('studio-x')).toHaveValue('5');
  await page.getByRole('button',{name:'Escena anterior'}).click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await expect(page.getByTestId('studio-added-layer').locator('img')).toHaveAttribute('src',/^blob:/);
  // Undo the merge, then replace everything.
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(0);
  await project.setInputFiles(zipPath);
  await page.getByTestId('studio-import-replace').click();
  await expect(status(page)).toContainText('reemplazó');
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
});

test('legacy JSON backups (Studio v2) still import, and corrupt files are refused without changes',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Legacy import');
  await open(page);
  const id='media-11111111-1111-4111-8111-111111111111';
  const legacy=JSON.stringify({studioPackage:2,
    document:{version:1,scenes:{'opening:4':{Xervias:{x:7,y:0,scale:1,mirror:false,layer:4,visible:true,assetId:id}}},
      assets:{[id]:{name:'xervias.png',mime:'image/png'}}},
    media:[{id,name:'xervias.png',mime:'image/png',data:'data:image/png;base64,'+PNG.toString('base64')}]});
  const project=page.locator('input[aria-label="Archivo project"]');
  await project.setInputFiles({name:'respaldo-v2.json',mimeType:'application/json',buffer:Buffer.from(legacy)});
  await expect(page.getByTestId('studio-import-dialog')).toContainText('respaldo antiguo (JSON)');
  await page.getByTestId('studio-import-merge').click();
  await expect(page.locator('.dcop-hero > img')).toHaveAttribute('src',/^blob:/);
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await expect(page.getByTestId('studio-x')).toHaveValue('7');
  await project.setInputFiles({name:'roto.zip',mimeType:'application/zip',buffer:Buffer.from('PK\u0003\u0004 no es un zip')});
  await expect(status(page)).toContainText('ZIP');
  await expect(page.getByTestId('studio-import-dialog')).toHaveCount(0);
  await expect(page.getByTestId('studio-x')).toHaveValue('7');
});
