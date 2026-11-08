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

test('VS screen: bands, names and the VS mark are editable pieces',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Versus');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=20');
  await expect(page.getByTestId('cinematic-versus')).toBeVisible();
  for(const label of ['VS · Marco completo','VS · Franja de Domingo','VS · Nombre de Domingo','VS · Marca «VS»','VS · Franja de Xervias','VS · Nombre de Xervias'])
    await expect(page.getByTestId('studio-actor-select').locator('option',{hasText:label})).toHaveCount(1);
  await page.getByTestId('studio-actor-select').selectOption({label:'VS · Marca «VS»'});
  await page.getByTestId('studio-scale-number').fill('140');
  await page.getByTestId('studio-scale-number').press('Tab');
  await expect(page.locator('[data-studio-actor="native-versus-vs"]')).toHaveAttribute('style',/--studio-scale: 1.4;/);
  await page.getByTestId('studio-actor-select').selectOption({label:'VS · Nombre de Xervias'});
  await page.getByTestId('studio-y').fill('-5');
  await page.getByTestId('studio-y').press('Tab');
  await expect(page.locator('[data-studio-actor="native-versus-nombre-jugador"]')).toHaveAttribute('style',/--studio-y: -5;/);
  await expect(page.getByTestId('cinematic-versus')).toContainText(/xervias/i);
});

test('Enter in the dialogue text creates a visible new line',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Line breaks');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=0');
  const field=page.getByTestId('studio-dialogue-text');
  await field.fill('');
  await field.pressSequentially('Virreinato del Perú, siglo XVII.');
  await field.press('Enter');
  await field.pressSequentially('El Sello Real da autoridad.');
  await field.press('Tab');
  const p=page.locator('.dcop-dialog-body p');
  await expect(p).toHaveCSS('white-space','pre-line');
  const lines=await p.evaluate(el=>Math.round(el.getBoundingClientRect().height/parseFloat(getComputedStyle(el).lineHeight)));
  expect(lines).toBeGreaterThanOrEqual(2);
  expect(await p.evaluate(el=>el.textContent)).toBe('Virreinato del Perú, siglo XVII.\nEl Sello Real da autoridad.');
});

test('copy a position, scale and rotation and paste it on another beat',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Copy/paste transform');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=4');
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  for(const [id,value] of [['studio-x','-12'],['studio-scale-number','115'],['studio-rotation','10']]){
    await page.getByTestId(id).fill(value);await page.getByTestId(id).press('Tab');
  }
  await expect(page.getByTestId('studio-paste-transform')).toBeDisabled();
  await page.getByTestId('studio-copy-transform').click();
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('Copiado: X -12');
  await page.getByRole('button',{name:'Escena siguiente'}).click();
  await page.getByTestId('studio-actor-select').selectOption('Domingo Quispe');
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
  await page.getByTestId('studio-paste-transform').click();
  await expect(page.getByTestId('studio-x')).toHaveValue('-12');
  await expect(page.getByTestId('studio-scale-number')).toHaveValue('115');
  await expect(page.getByTestId('studio-rotation')).toHaveValue('10');
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-x')).toHaveValue('0');
});


test('mobile inspector protects accidental edits while scrolling and offers quick undo/save',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Mobile touch editor');
  await page.goto('/Decreto-Real/?drDev=1#/campania/prologo?studio=1&studioStep=20');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  const versus=page.getByTestId('cinematic-versus');
  const stage=page.locator('.dcop-stage');
  const vb=(await versus.boundingBox())!;
  const sb=(await stage.boundingBox())!;
  expect(vb.height).toBeGreaterThan(sb.height*.95);
  await page.getByTestId('studio-actor-select').selectOption({label:'VS · Marca «VS»'});
  await expect(page.getByTestId('studio-scale')).toBeDisabled();
  await expect(page.getByRole('button',{name:'Escala en porcentaje: sumar'})).toBeDisabled();
  await page.getByTestId('studio-inspector-scroll').evaluate(el=>{el.scrollTop=el.scrollHeight;});
  await expect(page.getByTestId('studio-scale-number')).toHaveValue('100');
  await page.getByTestId('studio-controls-lock').click();
  await expect(page.getByTestId('studio-scale')).toBeEnabled();
  await page.getByTestId('studio-scale-number').fill('140');
  await page.getByTestId('studio-scale-number').press('Tab');
  await page.getByTestId('studio-undo-quick').click();
  await expect(page.getByTestId('studio-scale-number')).toHaveValue('100');
  await page.getByTestId('studio-save-quick').click();
  await expect(page.getByTestId('studio-tools-toggle')).toBeVisible();
  await expect(page.getByRole('toolbar',{name:'Lienzo de Studio'})).toBeHidden();
  await page.getByTestId('studio-tools-toggle').click();
  await expect(page.getByRole('toolbar',{name:'Lienzo de Studio'})).toBeVisible();
});
