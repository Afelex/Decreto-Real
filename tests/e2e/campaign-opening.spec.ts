import { expect,test } from '@playwright/test';
import { GUIDED_STEPS } from '../../campaign/guidedOpeningDuel';
import { OPENING_BEATS, AFTER_DUEL_BEATS } from '../../screens/CampaignOpening';

test('cinematic prologue teaches all cards and guarantees victory by Decreto Final', async ({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','Complete cinematic onboarding sampled on main phone');
  await page.goto('/Decreto-Real/#/campania/inicio');
  await expect(page.getByRole('heading',{name:'El Sello y la Revolución Solar'})).toBeVisible();
  await page.getByRole('button',{name:/Comenzar historia/}).click();
  await expect(page.getByRole('heading',{name:'El misterio del Sello Real'})).toBeVisible();
  for(let i=0;i<OPENING_BEATS.length;i++) await page.locator('.dcop-narrative footer button').click();
  await expect(page.getByRole('region',{name:'Duelo guiado de Xervias contra Domingo Quispe'})).toBeVisible();
  for(const step of GUIDED_STEPS){
    if(step.action==='coin') await page.locator('.dcop-coin').click();
    else if(step.action && /^(attack|impact|defense|order)/.test(step.action)) await page.locator('.dcop-card.active').click();
    else await page.locator('.dcop-next').click();
  }
  await expect(page.getByRole('heading',{name:'El precio de la victoria'})).toBeVisible();
  for(let i=0;i<AFTER_DUEL_BEATS.length;i++) await page.locator('.dcop-narrative footer button').click();
  await expect.poll(async()=>page.evaluate(()=>JSON.parse(window.localStorage.getItem('decreto-real.campania.v1')||'{}').stars?.['01'])).toBe(3);
  await expect(page).toHaveURL(/campania\/conversacion\/01/);
});

test('campaign pause menu retains checkpoint when returning to title',async ({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','Checkpoint sampled on main phone');
  await page.goto('/Decreto-Real/#/campania/inicio');
  await page.getByRole('button',{name:/Comenzar historia/}).click();
  await page.locator('.dcop-narrative footer button').click();
  await page.getByRole('button',{name:'Abrir menú de campaña'}).click();
  await expect(page.getByRole('dialog',{name:'Menú de campaña'})).toBeVisible();
  await page.getByRole('button',{name:/Volver al menú principal/}).click();
  await page.getByRole('button',{name:'Empezar campaña'}).click();
  await expect(page.getByText('¡Por favor! ¡No hemos hecho nada!',{exact:false})).toBeVisible();
});
