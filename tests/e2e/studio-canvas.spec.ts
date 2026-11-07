import {test,expect,type Page} from '@playwright/test';
import {readZip} from '../../campaign/studio/zip';

/**
 * Decreto Real Studio v3 · fase 3: lienzo, grilla, ajuste magnético, guías,
 * alineación y plano único de capas, en móvil (táctil) y escritorio (ratón).
 */
const CANVAS_PROJECTS=['mobile-320','mobile-390','landscape','desktop-1280'];
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);
// Intervención 5 (xervias-01): Xervias habla, Domingo atenuado y globo «¡Un momento!».
const STEP=4;
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');

async function open(page:Page,step=STEP){
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep='+step);
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.locator('[data-studio-actor="actor-domingo"]')).toBeVisible();
}
const isDesktop=(page:Page)=>(page.viewportSize()?.width??0)>=1180;
async function collapse(page:Page){
  if(isDesktop(page))return;
  const button=page.getByRole('button',{name:'Contraer editor'});
  if(await button.count())await button.click();
}
async function expand(page:Page){
  const button=page.getByRole('button',{name:'Abrir editor'});
  if(await button.count())await button.click();
}
/** Caja del sprite de una capa, relativa al escenario (px). */
async function spriteBox(page:Page,id:string){
  return page.evaluate(layer=>{
    const stage=document.querySelector('.dcop-stage')!.getBoundingClientRect();
    const host=document.querySelector('[data-studio-actor="'+layer+'"]')!;
    const el=host.querySelector(':scope > img:not(.dcop-child-sprite)')??host;
    const r=el.getBoundingClientRect();
    return {left:r.left-stage.left,right:r.right-stage.left,top:r.top-stage.top,bottom:r.bottom-stage.top,
      stageLeft:stage.left,stageTop:stage.top,stageWidth:stage.width,stageHeight:stage.height};
  },id);
}
/** Punto (en la página) dentro del sprite, lejos de sus bordes. */
async function spritePoint(page:Page,id:string,fx=.5,fy=.45){
  const b=await spriteBox(page,id);
  return {x:b.stageLeft+b.left+(b.right-b.left)*fx,y:b.stageTop+b.top+(b.bottom-b.top)*fy};
}
async function drag(page:Page,from:{x:number;y:number},dx:number,dy:number){
  await page.mouse.move(from.x,from.y);
  await page.mouse.down();
  for(let i=1;i<=8;i++)await page.mouse.move(from.x+dx*i/8,from.y+dy*i/8);
  await page.mouse.up();
}
const distanceToGrid=(value:number,step:number)=>Math.abs(value-Math.round(value/step)*step);
async function hitLayer(page:Page,point:{x:number;y:number}){
  return page.evaluate(({x,y})=>{
    const el=document.elementFromPoint(x,y) as HTMLElement|null;
    return (el?.closest('[data-studio-actor]') as HTMLElement|null)?.dataset.studioActor??el?.className??null;
  },point);
}

test('grid: visible toggle, density and transparency, and it never blocks selecting or dragging',async({page},info)=>{
  test.skip(only(CANVAS_PROJECTS)(info.project.name),'Canvas on phones, landscape and desktop');
  await open(page);
  await expect(page.getByTestId('studio-grid')).toHaveCount(0);
  await page.getByTestId('studio-grid-toggle').click();
  await expect(page.getByTestId('studio-grid-toggle')).toHaveAttribute('aria-pressed','true');
  const grid=page.getByTestId('studio-grid');
  await expect(grid).toBeVisible();
  await expect(grid).toHaveAttribute('data-columns','12');
  const {stageWidth}=await spriteBox(page,'actor-domingo');
  expect(Math.abs(Number(await grid.getAttribute('data-cell-px'))-stageWidth/12)).toBeLessThan(.02);
  await page.getByTestId('studio-canvas-settings').click();
  await page.getByTestId('studio-grid-columns').selectOption('24');
  await expect(grid).toHaveAttribute('data-columns','24');
  expect(Math.abs(Number(await grid.getAttribute('data-cell-px'))-stageWidth/24)).toBeLessThan(.02);
  await page.getByTestId('studio-grid-opacity').fill('0.6');
  await expect(grid).toHaveCSS('opacity','0.6');
  await page.getByTestId('studio-canvas-settings').click();
  // The grid, axes and margins sit above the actors but never receive the pointer.
  await page.getByTestId('studio-axes-toggle').click();
  await page.getByTestId('studio-safe-toggle').click();
  await expect(page.getByTestId('studio-safe-margins')).toBeVisible();
  await expect(page.getByTestId('studio-dialogue-band')).toBeVisible();
  await collapse(page);
  const point=await spritePoint(page,'actor-domingo');
  expect(await hitLayer(page,point)).toBe('actor-domingo');
  await drag(page,point,-20,0);
  await expand(page);
  await expect(page.getByTestId('studio-actor-select')).toHaveValue('actor-domingo');
  expect(Number(await page.getByTestId('studio-x').inputValue())).toBeLessThan(0);
  // Preferences survive a reload but are never part of the document.
  await page.reload();
  await expect(page.getByTestId('studio-grid')).toHaveAttribute('data-columns','24');
});

test('snap to grid: a drag lands on a grid line; without snap the position is free',async({page},info)=>{
  test.skip(only(CANVAS_PROJECTS)(info.project.name),'Snap on phones, landscape and desktop');
  await open(page);
  await collapse(page);
  const start=await spritePoint(page,'actor-domingo');
  const before=await spriteBox(page,'actor-domingo');
  await drag(page,start,-37,0);
  await expand(page);
  const freeX=Number(await page.getByTestId('studio-x').inputValue());
  expect(Math.abs(freeX-Math.round(-370000/before.stageWidth)/100)).toBeLessThanOrEqual(.011);
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('0');

  await page.getByTestId('studio-snap-toggle').click();
  await expect(page.getByTestId('studio-snap-toggle')).toHaveAttribute('aria-pressed','true');
  await collapse(page);
  await drag(page,start,-37,0);
  const after=await spriteBox(page,'actor-domingo');
  const step=after.stageWidth/12;
  const best=Math.min(...[after.left,(after.left+after.right)/2,after.right].map(v=>distanceToGrid(v,step)));
  expect(best).toBeLessThan(.6);
  await expand(page);
  expect(Number(await page.getByTestId('studio-x').inputValue())).not.toBe(freeX);
  // One gesture = one undo step, with or without snapping.
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
});

test('smart guides appear while aligned with another layer and disappear on release',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Smart guides');
  await open(page);
  await page.getByTestId('studio-smart-toggle').click();
  await collapse(page);
  const xervias=await spriteBox(page,'actor-xervias');
  const domingo=await spriteBox(page,'actor-domingo');
  // Move Domingo's bottom close to Xervias' bottom (3 px away) and hold.
  const start=await spritePoint(page,'actor-domingo');
  const dy=xervias.bottom-domingo.bottom-30;
  await page.mouse.move(start.x,start.y);
  await page.mouse.down();
  await page.mouse.move(start.x,start.y+dy/2);
  await page.mouse.move(start.x,start.y+dy+27);
  await expect(page.getByTestId('studio-guide-y')).toBeVisible();
  await page.mouse.up();
  await expect(page.getByTestId('studio-guide-y')).toHaveCount(0);
  const snapped=await spriteBox(page,'actor-domingo');
  expect(Math.abs(snapped.bottom-xervias.bottom)).toBeLessThan(.6);
});

test('numeric fields accept a minus sign typed key by key and stay exact',async({page},info)=>{
  test.skip(only(CANVAS_PROJECTS)(info.project.name),'Exact numeric controls');
  await open(page);
  await page.getByTestId('studio-snap-toggle').click();
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  const x=page.getByTestId('studio-x');
  await x.click();
  await x.fill('');
  await x.pressSequentially('-11.37');
  await expect(x).toHaveValue('-11.37');
  await x.press('Enter');
  await expect(page.locator('[data-studio-actor="actor-domingo"]')).toHaveAttribute('style',/--studio-x: -11.37;/);
  await page.getByTestId('studio-scale-number').fill('137');
  await page.getByTestId('studio-scale-number').press('Tab');
  await expect(page.getByTestId('studio-scale')).toHaveValue('1.37');
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-scale')).toHaveValue('1');
  await expect(x).toHaveValue('-11.37');
});

test('align: «Igualar suelo» puts both characters on the same floor line',async({page},info)=>{
  test.skip(only(['mobile-390','landscape','desktop-1280'])(info.project.name),'Alignment');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-y').fill('-8');
  await page.getByTestId('studio-y').press('Tab');
  const lifted=await spriteBox(page,'actor-domingo');
  const xervias=await spriteBox(page,'actor-xervias');
  expect(Math.abs(lifted.bottom-xervias.bottom)).toBeGreaterThan(10);
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await page.getByTestId('studio-multi').click();
  await collapse(page);
  await page.mouse.click(...Object.values(await spritePoint(page,'actor-domingo')) as [number,number]);
  await expand(page);
  await expect(page.getByTestId('studio-selection-count')).toContainText('2 elementos');
  await page.getByTestId('studio-align-floor').click();
  const a=await spriteBox(page,'actor-xervias');
  const b=await spriteBox(page,'actor-domingo');
  expect(Math.abs(a.bottom-b.bottom)).toBeLessThan(1);
  // Lowest feet win: Xervias did not move.
  expect(Math.abs(a.bottom-xervias.bottom)).toBeLessThan(1);
  // A single undo restores the whole alignment.
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  expect(Math.abs((await spriteBox(page,'actor-domingo')).bottom-lifted.bottom)).toBeLessThan(1);
  // Top alignment against the stage.
  await page.getByTestId('studio-align-ref').selectOption('stage');
  await page.getByTestId('studio-align-top').click();
  expect(Math.abs((await spriteBox(page,'actor-xervias')).top)).toBeLessThan(1);
  expect(Math.abs((await spriteBox(page,'actor-domingo')).top)).toBeLessThan(1);
});

test('desktop: Shift+click multi-select, Alt suspends snapping, arrows nudge one cell and G toggles the grid',async({page},info)=>{
  test.skip(only(['desktop-1280'])(info.project.name),'Mouse and keyboard');
  await open(page);
  await page.getByTestId('studio-snap-toggle').click();
  const start=await spritePoint(page,'actor-domingo');
  const {stageWidth}=await spriteBox(page,'actor-domingo');
  await page.keyboard.down('Alt');
  await drag(page,start,-37,0);
  await page.keyboard.up('Alt');
  expect(Math.abs(Number(await page.getByTestId('studio-x').inputValue())-Math.round(-370000/stageWidth)/100)).toBeLessThanOrEqual(.011);
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  // Keyboard: click the actor (focus leaves the inspector), then nudge.
  await page.mouse.click(start.x,start.y);
  await page.keyboard.press('ArrowRight');
  await expect(page.getByTestId('studio-x')).toHaveValue(String(Math.round(10000/12)/100));
  await page.getByTestId('studio-snap-toggle').click();
  await page.mouse.click(start.x+stageWidth/12,start.y);
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByTestId('studio-x')).toHaveValue(String(Math.round(10000/12)/100-.5));
  await page.keyboard.press('g');
  await expect(page.getByTestId('studio-grid')).toBeVisible();
  await page.keyboard.press('g');
  await expect(page.getByTestId('studio-grid')).toHaveCount(0);
  // Shift+click builds a multi-selection.
  await page.keyboard.down('Shift');
  await page.mouse.click(...Object.values(await spritePoint(page,'actor-xervias')) as [number,number]);
  await page.keyboard.up('Shift');
  await expect(page.getByTestId('studio-selection-count')).toContainText('2 elementos');
  await expect(page.getByTestId('studio-group-box')).toHaveCount(1);
});

test('scale and rotation handles respect snapping steps',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Canvas handles');
  await open(page);
  await page.getByTestId('studio-snap-toggle').click();
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await collapse(page);
  const handle=page.getByTestId('studio-handle-scale');
  await expect(handle).toBeVisible();
  const h=(await handle.boundingBox())!;
  await drag(page,{x:h.x+h.width/2,y:h.y+h.height/2},-23,-31);
  await expand(page);
  const scale=Number(await page.getByTestId('studio-scale-number').inputValue());
  expect(scale).toBeLessThan(100);
  expect(Math.abs(scale%5)).toBe(0);
  await collapse(page);
  const r=(await page.getByTestId('studio-handle-rotate').boundingBox())!;
  await drag(page,{x:r.x+r.width/2,y:r.y+r.height/2},60,25);
  await expand(page);
  const rotation=Number(await page.getByTestId('studio-rotation').inputValue());
  expect(rotation).not.toBe(0);
  expect(Math.abs(rotation%15)).toBe(0);
});

test('locked layers are selected but not dragged; the background is locked by default',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Locking');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-lock').click();
  await expect(page.getByTestId('studio-lock')).toHaveAttribute('aria-pressed','true');
  await collapse(page);
  await drag(page,await spritePoint(page,'actor-domingo'),-40,0);
  await expand(page);
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
  await page.getByTestId('studio-actor-select').selectOption('Fondo');
  await expect(page.getByTestId('studio-lock')).toHaveAttribute('aria-pressed','true');
  await page.getByTestId('studio-x').fill('6');
  await page.getByTestId('studio-x').press('Tab');
  await expect(page.locator('.dcop-backdrop')).toHaveClass(/dcop-studio-framed/);
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('style',/--studio-x: 6;/);
});

test('single layer plane: an effect can sit BETWEEN two characters',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Single z plane');
  await open(page);
  await page.locator('input[aria-label="Archivo effect"]').setInputFiles({name:'niebla.png',mimeType:'image/png',buffer:PNG});
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  // A large effect covering the whole stage.
  await page.getByTestId('studio-scale-number').fill('275');
  await page.getByTestId('studio-scale-number').press('Tab');
  const layer=page.getByTestId('studio-layer');
  // z 13: above the dimmed Domingo (12), below the speaking Xervias (14).
  await layer.fill('13');
  await layer.press('Tab');
  await collapse(page);
  const xPoint=await spritePoint(page,'actor-xervias',.5,.6);
  const dPoint=await spritePoint(page,'actor-domingo',.5,.6);
  expect(await hitLayer(page,xPoint)).toBe('actor-xervias');
  expect(await hitLayer(page,dPoint)).toMatch(/^extra-/);
  await expand(page);
  await layer.fill('11');
  await layer.press('Tab');
  await collapse(page);
  expect(await hitLayer(page,dPoint)).toBe('actor-domingo');
  await expand(page);
  await layer.fill('48');
  await layer.press('Tab');
  await collapse(page);
  expect(await hitLayer(page,xPoint)).toMatch(/^extra-/);
});

test('grid and guides exist only inside the editor and never reach the exported project',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Editor-only canvas');
  await open(page);
  await page.getByTestId('studio-grid-toggle').click();
  await page.getByTestId('studio-axes-toggle').click();
  await page.getByTestId('studio-safe-toggle').click();
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-x').fill('4');
  await page.getByTestId('studio-x').press('Tab');
  const [download]=await Promise.all([
    page.waitForEvent('download'),
    page.getByRole('button',{name:'⇩ Exportar proyecto'}).click(),
  ]);
  const fs=await import('node:fs/promises');
  const entries=readZip(new Uint8Array(await fs.readFile((await download.path())!)));
  const text=new TextDecoder().decode(entries.find(e=>e.name==='proyecto.json')!.data);
  expect(text).not.toMatch(/"(grid|snap|columns|axes|safe|smart|prefs)"/);
  await page.getByTestId('studio-preview').click();
  await expect(page.getByTestId('studio-return')).toBeVisible();
  for(const id of ['studio-canvas','studio-grid','studio-axes','studio-safe-margins','studio-selection-box'])
    await expect(page.getByTestId(id)).toHaveCount(0);
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?escena=xervias');
  await expect(page.getByTestId('prologue-dialogue')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toHaveCount(0);
  await page.goto('/Decreto-Real/#/campania/prologo?escena=xervias');
  await expect(page.getByTestId('prologue-dialogue')).toBeVisible();
  await expect(page.getByTestId('studio-canvas')).toHaveCount(0);
  await expect(page.getByTestId('studio-grid')).toHaveCount(0);
});
