import { expect,test } from '@playwright/test';
import { GUIDED_STEPS } from '../../campaign/guidedOpeningDuel';

test('scene 8 uses the identical GameBoard engine and ends with authentic fourth Impact',async ({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','Full narrated real-board battle sampled on 390px phone');
  test.setTimeout(240000);
  await page.goto('/Decreto-Real/#/campania/prologo?escena=duelo');
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.locator('.dr-royal-layout')).toBeVisible();
  await expect(page.locator('.dcop-battle')).toHaveCount(0);
  await expect(page.getByTestId('campaign-guided-coach')).toBeVisible();
  const coach=page.getByTestId('campaign-guided-coach');
  const cardAction=/^(attack|impact|defense|order)/;
  for(const step of GUIDED_STEPS){
    await expect(coach).toContainText(step.text,{timeout:45000});
    const action=step.action;
    if(!action){
      await coach.getByRole('button').click();
    }else if(action==='coin'){
      await page.getByRole('button',{name:'Lanzar Moneda'}).click();
    }else if(cardAction.test(action)){
      const card=page.locator('.dr-royal-hand-card:not(.unavailable)').first();
      await expect(card).toBeVisible({timeout:25000});
      await card.click();
      if(action.startsWith('impact')){
        const n=Number(action.slice(-1));
        const title=n===4?'Final':['I','II','III'][n-1];
        await page.getByRole('button',{name:'Casilla Impacto '+title,exact:true}).click();
      }else{
        await page.getByRole('button',{name:'Campo para activar Ataque, Defensa, Orden o Mística'}).click();
      }
    }else if(action==='combo2'){
      await page.locator('.dr-event-ability--damage').click();
    }else if(action==='combo3'){
      await page.locator('.dr-event-ability--heal').click();
    }else if(action.startsWith('end')){
      await page.getByRole('button',{name:'Terminar turno'}).click();
    }
    // rival steps advance automatically after real opponent card animation
  }
  await expect(page.getByRole('heading',{name:'El precio de la victoria'})).toBeVisible();
});

test('the regular free duel retains its existing board and unrestricted card controls',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','Shared board smoke test');
  await page.goto('/Decreto-Real/#/game');
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await expect(page.getByTestId('campaign-guided-coach')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Lanzar Moneda'})).toBeVisible();
});

test('guided battle pause returns to the menu without losing the story scene',async({page},testInfo)=>{
  test.skip(testInfo.project.name!=='mobile-390','Checkpoint sampled on main phone');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=duelo');
  await expect(page.locator('.dr-classic-screen')).toBeVisible();
  await page.getByRole('button',{name:'Abrir menú de pausa'}).click();
  await expect(page.getByRole('heading',{name:'Pausa'})).toBeVisible();
  await page.getByRole('button',{name:'Volver al menú principal'}).click();
  await expect(page.getByRole('navigation',{name:'Menú principal'})).toBeVisible();
});


test('the post-duel chapter introduces Zhinchi and the final card has only one public button',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Visual-novel end card mobile QA');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=zhinchi');
  await expect(page.getByRole('heading',{name:'La llegada del capitán'})).toBeVisible();
  await expect(page.getByText('¡Alto! ¿Qué sucede aquí?')).toBeVisible();
  await page.goto('/Decreto-Real/#/campania/prologo?escena=cetro');
  await expect(page.getByRole('heading',{name:'El sello bajo sospecha'})).toBeVisible();
  await page.goto('/Decreto-Real/#/campania/prologo?escena=fin');
  await expect(page.getByRole('heading',{name:'Fin del Prólogo'})).toBeVisible();
  await expect(page.getByRole('button',{name:'Volver al menú',exact:true})).toBeVisible();
  await expect(page.locator('.dcop-final-screen button')).toHaveCount(1);
  await expect(page.getByRole('button',{name:'Continuar ›'})).toHaveCount(0);
});
