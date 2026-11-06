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
  await expect(page.getByRole('status')).toContainText('guardado');

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
  await expect(page.getByTestId('dr-studio')).toContainText('Escena 3 de');
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
    page.getByRole('button',{name:'⇩ Exportar JSON'}).click()
  ]);
  expect(download.suggestedFilename()).toBe('decreto-real-studio-v1.json');
});
