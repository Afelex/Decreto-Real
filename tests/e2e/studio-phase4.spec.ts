import {test,expect,type Page} from '@playwright/test';

/**
 * Decreto Real Studio v3 · fase 4: textos (negrita, tamaño de los bloques),
 * elementos e intervenciones solo para desarrolladores, globos en cualquier
 * intervención, línea de tiempo, aplicar a la escena, comparar, autoguardado.
 */
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);

async function open(page:Page,step=4){
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep='+step);
  await expect(page.getByTestId('dr-studio')).toBeVisible();
}
const box=async(page:Page,selector:string)=>(await page.locator(selector).first().boundingBox())!;
const fontSize=(page:Page)=>page.locator('.dcop-dialog-body p').evaluate(el=>parseFloat(getComputedStyle(el).fontSize));

test('dialogue text can be rewritten and emphasised with bold, also in the story preview',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Dialogue text');
  await open(page);
  const field=page.getByTestId('studio-dialogue-text');
  await expect(field).toHaveValue('¡Un momento! ¿Qué está sucediendo aquí?');
  await field.fill('¡Un momento! ¿Qué está pasando aquí?');
  await field.evaluate((el:HTMLTextAreaElement)=>{el.focus();el.setSelectionRange(0,12);});
  await page.getByTestId('studio-bold').click();
  await expect(field).toHaveValue('**¡Un momento!** ¿Qué está pasando aquí?');
  await expect(page.locator('.dcop-dialog-body p strong')).toHaveText('¡Un momento!');
  await expect(page.locator('.dcop-dialog-body p')).toHaveText('¡Un momento! ¿Qué está pasando aquí?');
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview').click();
  await expect(page.locator('.dcop-dialog-body p strong')).toHaveText('¡Un momento!');
  await page.getByTestId('studio-return').click();
  await page.getByTestId('studio-dialogue-reset').click();
  await expect(page.locator('.dcop-dialog-body p strong')).toHaveCount(0);
  await expect(page.locator('.dcop-dialog-body p')).toHaveText('¡Un momento! ¿Qué está sucediendo aquí?');
});

test('the bottom text block can be enlarged for one beat or for all of them',async({page},info)=>{
  test.skip(only(['mobile-390','landscape','desktop-1280'])(info.project.name),'Dialogue size');
  await open(page);
  const font=await fontSize(page);
  const panel=await box(page,'.dcop-narrative');
  const domingo=await box(page,'[data-studio-actor="actor-domingo"] > img');
  await page.getByTestId('studio-dialogue-text-scale').fill('1.4');
  await page.getByTestId('studio-dialogue-box-scale').fill('1.5');
  await expect.poll(()=>fontSize(page)).toBeGreaterThan(font*1.3);
  expect((await box(page,'.dcop-narrative')).height).toBeGreaterThan(panel.height*1.4);
  // The characters stand on the taller block instead of disappearing behind it.
  expect((await box(page,'[data-studio-actor="actor-domingo"] > img')).y+((await box(page,'[data-studio-actor="actor-domingo"] > img')).height))
    .toBeLessThan(domingo.y+domingo.height-10);
  // Only this beat.
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await expect.poll(()=>fontSize(page)).toBeLessThan(font*1.05);
  // All beats.
  await page.getByTestId('studio-dialogue-scope').selectOption('all');
  await page.getByTestId('studio-dialogue-text-scale').fill('1.2');
  await page.getByTestId('studio-step-select').selectOption('12');
  await expect.poll(()=>fontSize(page)).toBeGreaterThan(font*1.15);
  await page.getByTestId('studio-step-select').selectOption('4');
  // The beat with its own size keeps it.
  await expect.poll(()=>fontSize(page)).toBeGreaterThan(font*1.3);
});

test('elements, title and whole beats can be hidden from players and stay visible to developers',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Developer-only visibility');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-dev-only').click();
  await expect(page.locator('[data-studio-actor="actor-domingo"]')).toHaveClass(/dcop-studio-devonly/);
  await page.getByTestId('studio-actor-select').selectOption('Globo de texto');
  await page.getByTestId('studio-dev-only').click();
  await page.getByTestId('studio-title-devonly').click();
  // Next beat (6: Domingo «No te metas») is hidden from players as a whole.
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await page.getByTestId('studio-beat-devonly').click();
  await expect(page.getByTestId('devonly-beat-notice')).toBeVisible();
  await page.getByRole('button',{name:'Escena anterior'}).click();
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-preview').click();

  // Developer view: everything visible.
  await expect(page.getByTestId('studio-audience')).toContainText('desarrollador');
  await expect(page.locator('.dcop-actor-domingo')).toBeVisible();
  await expect(page.locator('.dcop-quick-bubble')).toBeVisible();
  await expect(page.locator('.dcop-chapter-title')).toBeVisible();
  // Player view = published version.
  await page.getByTestId('studio-audience').click();
  await expect(page.getByTestId('studio-audience')).toContainText('jugador');
  await expect(page.locator('.dcop-actor-domingo')).toBeHidden();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await expect(page.locator('.dcop-chapter-title')).toHaveCount(0);
  await expect(page.locator('.dcop-hero')).toBeVisible();
  // The hidden beat 6 is skipped for players: 5 → 7.
  await expect(page.getByLabel('Progreso del diálogo')).toContainText('ESCENA 5/21');
  await page.getByRole('button',{name:'Continuar'}).click();
  await expect(page.getByLabel('Progreso del diálogo')).toContainText('ESCENA 7/21');
  // Back to developer: the hidden beat is shown with its notice.
  await page.getByTestId('studio-return').click();
  await page.getByTestId('studio-step-select').selectOption('4');
  await page.getByTestId('studio-preview').click();
  await expect(page.getByTestId('studio-audience')).toContainText('desarrollador');
  await page.getByRole('button',{name:'Continuar'}).click();
  await expect(page.getByLabel('Progreso del diálogo')).toContainText('ESCENA 6/21');
  await expect(page.getByTestId('devonly-beat-notice')).toBeVisible();
  // The real public game is untouched by local drafts.
  await page.goto('/Decreto-Real/#/campania/prologo?escena=xervias');
  await expect(page.getByTestId('prologue-dialogue')).toBeVisible();
  await expect(page.getByTestId('devonly-beat-notice')).toHaveCount(0);
  await expect(page.getByTestId('studio-audience')).toHaveCount(0);
});

test('a speech bubble can be added to any beat, with bold text and either side',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Bubbles anywhere');
  await open(page,7);
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
  await page.getByTestId('studio-add-bubble').click();
  await expect(page.locator('.dcop-quick-bubble')).toBeVisible();
  await expect(page.getByTestId('studio-actor-select')).toHaveValue('bubble');
  await page.getByTestId('studio-bubble-text').fill('¡Es **falso**!');
  await expect(page.locator('.dcop-quick-bubble strong')).toHaveText('falso');
  await expect(page.locator('.dcop-quick-bubble')).toHaveClass(/\bleft\b/);
  await page.getByTestId('studio-bubble-side').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveClass(/\bright\b/);
  await page.getByTestId('studio-delete').click();
  await expect(page.locator('.dcop-quick-bubble')).toHaveCount(0);
});

test('timeline shows all beats with thumbnails and edit marks, and jumps to a beat',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Timeline');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Xervias');
  await page.getByTestId('studio-x').fill('5');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByTestId('studio-timeline-toggle').click();
  const items=page.getByTestId('studio-timeline-item');
  await expect(items).toHaveCount(49);
  await expect(page.locator('[data-scene="prologo/xervias-01"]')).toHaveAttribute('data-edited','true');
  await expect(page.locator('[data-scene="prologo/xervias-01"]')).toHaveAttribute('aria-current','step');
  await expect(page.locator('[data-scene="prologo/xervias-01"] .dr-studio-thumb img')).toHaveCount(2);
  await page.getByTestId('studio-timeline-edited').check();
  await expect(items).toHaveCount(1);
  await page.getByTestId('studio-timeline-edited').uncheck();
  await page.locator('[data-scene="prologo/cetro-01"]').click();
  await expect(page.getByTestId('studio-step-select')).toHaveValue(String(21+13));
  await expect(page.locator('[data-scene="prologo/cetro-01"]')).toHaveAttribute('aria-current','step');
});

test('apply a composition to the whole scene, copy from the previous beat, and undo it in one step',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Batch composition');
  await open(page,1);
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await page.getByTestId('studio-x').fill('10');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByTestId('studio-apply-scene').click();
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('2 intervenciones');
  await page.getByRole('button',{name:'Escena siguiente'}).click(); // arresto-02
  await page.getByTestId('studio-actor-select').selectOption('Madre');
  await expect(page.getByTestId('studio-x')).toHaveValue('10');
  // The text of each beat is preserved.
  await expect(page.getByTestId('studio-dialogue-text')).toHaveValue(/Lo siento, señora/);
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
  await page.getByTestId('studio-copy-previous').click();
  await expect(page.getByTestId('studio-x')).toHaveValue('10');
});

test('compare shows the original composition and texts without the edits',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Before/after');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-x').fill('-12');
  await page.getByTestId('studio-x').press('Tab');
  await page.getByTestId('studio-dialogue-text').fill('Texto editado');
  await page.getByTestId('studio-dialogue-text').press('Tab');
  await expect(page.locator('.dcop-actor-domingo')).toHaveAttribute('style',/--studio-x: -12;/);
  await page.getByTestId('studio-compare').click();
  await expect(page.locator('.dcop-actor-domingo')).not.toHaveAttribute('style',/--studio-x/);
  await expect(page.locator('.dcop-dialog-body p')).toHaveText('¡Un momento! ¿Qué está sucediendo aquí?');
  await page.getByTestId('studio-compare').click();
  await expect(page.locator('.dcop-actor-domingo')).toHaveAttribute('style',/--studio-x: -12;/);
  await expect(page.locator('.dcop-dialog-body p')).toHaveText('Texto editado');
});

test('unsaved work triggers a leave warning and can be recovered after reloading',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Autosave and recovery');
  await open(page);
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await page.getByTestId('studio-x').fill('-7');
  await page.getByTestId('studio-x').press('Tab');
  await expect(page.getByTestId('studio-save')).toContainText('Guardar');
  await expect.poll(()=>page.evaluate(()=>localStorage.getItem('decreto-real.studio.autoguardado.v3'))).not.toBeNull();
  const dialogs:string[]=[];
  page.on('dialog',dialog=>{dialogs.push(dialog.type());void dialog.accept();});
  await page.reload();
  expect(dialogs).toContain('beforeunload');
  await expect(page.getByTestId('studio-recovery')).toBeVisible();
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
  await page.getByTestId('studio-recover').click();
  await expect(page.getByTestId('studio-x')).toHaveValue('-7');
  await page.getByTestId('studio-save').click();
  expect(await page.evaluate(()=>localStorage.getItem('decreto-real.studio.autoguardado.v3'))).toBeNull();
  await page.reload();
  await expect(page.getByTestId('studio-recovery')).toHaveCount(0);
});

test('on phones the inspector can be docked at the bottom',async({page},info)=>{
  test.skip(only(['mobile-390','mobile-320'])(info.project.name),'Panel dock');
  await open(page);
  const top=await box(page,'[data-testid="dr-studio"]');
  expect(top.y).toBeLessThan(20);
  await page.getByTestId('studio-dock').click();
  await expect(page.getByTestId('dr-studio')).toHaveClass(/dr-studio-dock-bottom/);
  await page.getByRole('button',{name:'Contraer editor'}).click();
  const bottom=await box(page,'[data-testid="dr-studio"]');
  expect(bottom.y).toBeGreaterThan(page.viewportSize()!.height/2);
  await page.reload();
  await expect(page.getByTestId('dr-studio')).toHaveClass(/dr-studio-dock-bottom/);
});
