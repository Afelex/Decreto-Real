import {test,expect,type Page} from '@playwright/test';

/** Decreto Real Studio v3 · fase 7: Studio en las pantallas narrativas fuera del prólogo. */
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);
const PNG=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');
async function catalog(page:Page){
  await page.goto('/Decreto-Real/?drDev=1#/studio/escenas');
  await expect(page.getByTestId('studio-scenes-catalog-page')).toBeVisible();
}

test('scenes catalog opens an after-victory conversation; its text, bold and title persist',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Narrative screens');
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path^="/campania/conversacion/"]').first().click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  const text=page.getByTestId('studio-dialogue-text');
  await text.fill('Una línea **nueva** del guion.');
  await text.press('Tab');
  await expect(page.locator('.dca-conversation p strong')).toHaveText('nueva');
  await page.getByTestId('studio-title-text').fill('Título editado');
  await page.getByTestId('studio-title-text').press('Tab');
  await expect(page.locator('.dca-header h1')).toHaveText('Título editado');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await expect(page.locator('.dca-conversation p strong')).toHaveText('nueva');
  // The next line of the same conversation keeps its own text.
  await page.getByRole('button',{name:'Contraer editor'}).click();
  await page.locator('.dca-primary').click();
  await expect(page.locator('.dca-conversation p strong')).toHaveCount(0);
  await page.getByRole('button',{name:'Abrir editor'}).click();
  await page.getByTestId('studio-exit').click();
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
});

test('region entrance: each line is edited separately and native layout stays',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Region moments');
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path^="/campania/entrada/"]').first().click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-screen-text-select').selectOption({label:'Zhinchi'});
  await page.getByTestId('studio-dialogue-text').fill('Zhinchi habla **distinto**.');
  await page.getByTestId('studio-dialogue-text').press('Tab');
  const dialogue=page.locator('.dcmoment-dialogue p');
  await expect(dialogue.nth(1).locator('strong').last()).toHaveText('distinto');
  await expect(dialogue.nth(0).locator('strong')).toHaveCount(1); // solo «Xervias:»
  await expect(page.locator('.dcmoment-missions li')).toHaveCount(4);
});

test('epilogue and credits accept added layers and a new background per page',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Epilogue and credits');
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path="/campania/epilogo"]').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.locator('input[aria-label="Archivo image"]').setInputFiles({name:'sello.png',mimeType:'image/png',buffer:PNG});
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(1);
  await page.getByTestId('studio-x').fill('12');
  await page.getByTestId('studio-x').press('Enter');
  await expect(page.getByTestId('studio-added-layer')).toHaveAttribute('style',/--studio-x: 12;/);
  await page.getByRole('button',{name:'Contraer editor'}).click();
  await page.getByRole('button',{name:'Siguiente ›'}).click();
  await expect(page.getByTestId('studio-added-layer')).toHaveCount(0);
  await page.getByRole('button',{name:'Abrir editor'}).click();
  await page.getByTestId('studio-save').click();
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path="/campania/creditos"]').click();
  await page.locator('input[aria-label="Archivo background"]').setInputFiles({name:'fondo.png',mimeType:'image/png',buffer:PNG});
  await expect(page.locator('.dcredits-screen')).toHaveAttribute('style',/blob:/);
});


test('campaign audiovisual director edits a region dialogue without affecting other lines',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Shared campaign AV director');
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path^="/campania/entrada/"]').first().click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await page.getByTestId('studio-campaign-av').locator('summary').click();
  for(const lane of ['dialogue','portrait','music','effect','action']){
    await expect(page.getByTestId('studio-av-lane-'+lane)).toBeVisible();
  }
  await page.getByTestId('studio-campaign-av-tone').selectOption('preocupado');
  await page.getByTestId('studio-campaign-av-sound').selectOption('CLICK');
  await page.getByTestId('studio-campaign-av-soundDelayMs').selectOption('500');
  await page.getByTestId('studio-campaign-av-direction').fill('Dejar libre el retrato de Xervias.');
  await page.getByTestId('studio-campaign-av-direction').press('Tab');
  await expect(page.getByTestId('studio-campaign-av-inspector')).toContainText('CLICK');
  await page.getByTestId('studio-screen-text-select').selectOption({label:'Zhinchi'});
  await expect(page.getByTestId('studio-campaign-av-tone')).toHaveValue('neutral');
  await expect(page.getByTestId('studio-campaign-av-sound')).toHaveValue('none');
  await page.getByTestId('studio-campaign-av-tone').selectOption('sereno');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-campaign-av').locator('summary').click();
  await page.getByTestId('studio-screen-text-select').selectOption({label:'Zhinchi'});
  await expect(page.getByTestId('studio-campaign-av-tone')).toHaveValue('sereno');
  await page.getByTestId('studio-screen-text-select').selectOption({index:0});
  await expect(page.getByTestId('studio-campaign-av-tone')).toHaveValue('preocupado');
  await expect(page.getByTestId('studio-campaign-av-direction')).toHaveValue('Dejar libre el retrato de Xervias.');
});


test('mission dialogue edits drive the actual duel and keep the rules unchanged',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mission authoring smoke test on phone');
  await catalog(page);
  await page.locator('[data-testid="studio-catalog-item"][data-path="/campania/mision/03"]').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.getByRole('heading',{name:'Niebla sobre el Callao'})).toBeVisible();
  const select=page.getByTestId('studio-screen-text-select');
  await select.selectOption({index:0});
  await page.getByTestId('studio-dialogue-text').fill('Una inspección importante en el Callao.');
  await page.getByTestId('studio-dialogue-text').press('Tab');
  await expect(page.locator('.dc-scene-narration')).toContainText('Una inspección importante en el Callao.');
  await select.selectOption({index:2}); // primera réplica del rival antes del combate
  await page.getByTestId('studio-dialogue-text').fill('La carga del Callao debe continuar. Nadie puede revisar estas cajas.');
  await page.getByTestId('studio-dialogue-text').press('Tab');
  await page.getByTestId('studio-save').click();
  await page.getByRole('button',{name:/Preparar combate/}).click();
  await expect(page.getByTestId('story-combat-dialogue')).toContainText('La carga del Callao debe continuar.');
});
