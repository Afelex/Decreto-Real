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


test('opening arrest renders character sprites above a clean background and a readable dialogue panel',async ({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Visual novel mobile staging');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=arresto');
  await expect(page.getByRole('heading',{name:'Una orden inesperada'})).toBeVisible();
  await expect(page.locator('.dcop-scene-figures>div')).toHaveCount(2);
  await expect(page.locator('.dcop-scene-figures .dcop-speaking')).toHaveCount(1);
  await expect(page.locator('.dcop-nameplate')).toHaveText('Madre');
  await expect(page.locator('.dcop-dialog-box img')).toHaveCount(0);
  const metrics=await page.evaluate(()=>{
    const panel=document.querySelector('.dcop-dialog-box')!.getBoundingClientRect();
    const stage=document.querySelector('.dcop-stage')!.getBoundingClientRect();
    return {top:panel.top,bottom:panel.bottom,left:panel.left,right:panel.right,
      stageBottom:stage.bottom,width:innerWidth, documentWidth:document.documentElement.scrollWidth};
  });
  expect(metrics.top).toBeGreaterThan(0);
  expect(metrics.bottom).toBeLessThanOrEqual(metrics.stageBottom+1);
  expect(metrics.left).toBeGreaterThanOrEqual(0);
  expect(metrics.right).toBeLessThanOrEqual(metrics.width+1);
  expect(metrics.documentWidth).toBeLessThanOrEqual(metrics.width+1);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.locator('.dcop-nameplate')).toHaveText('Domingo Quispe');
  await expect(page.locator('.dcop-scene-figures .dcop-speaking')).toHaveCount(1);
});

test('the approved Xervias ring is a special insert and the game card is layered separately',async ({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Visual novel cut-in on phone');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=anillo');
  await expect(page.locator('.dcop-scene-figures>div')).toHaveCount(2);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.locator('.dcop-invocation-shimmer')).toBeVisible();
  await expect(page.locator('.dcop-invocation-shimmer .dcop-summoned-card')).toHaveAttribute('src',/carta_dorada_invocacion\.png|carta-invocacion-real\.svg/);
  await expect(page.locator('.dcop-scene-figures')).toHaveCount(0);
});


test('adults in the arrest and confrontation share one visual head line',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Phone prologue composition');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=arresto');
  await expect(page.locator('.dcop-scene-figures>div')).toHaveCount(2);
  const positions=await page.locator('.dcop-scene-figures>div img:not(.dcop-child-sprite)').evaluateAll(images=>
    images.map(x=>({top:x.getBoundingClientRect().top,height:x.getBoundingClientRect().height})));
  expect(positions.length).toBe(2);
  expect(Math.abs(positions[0].top-positions[1].top)).toBeLessThanOrEqual(2);
  expect(Math.abs(positions[0].height-positions[1].height)).toBeLessThanOrEqual(2);
  await page.goto('/Decreto-Real/#/campania/prologo?escena=xervias');
  await expect(page.locator('.dcop-scene-figures>div')).toHaveCount(2);
  const next=await page.locator('.dcop-scene-figures>div img:not(.dcop-child-sprite)').evaluateAll(images=>images.map(x=>x.getBoundingClientRect().top));
  expect(Math.abs(next[0]-next[1])).toBeLessThanOrEqual(2);
});
test('intro retired the person-painted desk image',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Phone prologue intro');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=pergamino');
  const src=await page.locator('.dcop-backdrop').getAttribute('src');
  expect(src).not.toContain('fondo_01_mesa.webp');
  expect(src).not.toContain('portada-poster.jpg');
  await expect(page.locator('.dcop-parchment')).toBeVisible();
});
test('one golden ceremonial card per duelist, then an original VS scene',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Phone cinematic sequence');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=anillo');
  await expect(page.locator('.dcop-summoned-card')).toHaveCount(0);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('xervias-golden-invocation')).toBeVisible();
  await expect(page.locator('.dcop-invocation-shimmer .dcop-summoned-card')).toHaveCount(1);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('domingo-integrated-invocation')).toHaveCount(0);
  await page.locator('.dcop-dialog-body footer button').click();
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('domingo-integrated-invocation')).toBeVisible();
  await expect(page.locator('.dcop-counter-invocation img')).toHaveCount(0);
  await expect(page.getByTestId('domingo-integrated-invocation').locator('img')).toHaveAttribute('src',/domingo_08_invocacion_combate\.png|domingo_02_molesto\.webp/);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('cinematic-versus')).toBeVisible();
  await expect(page.getByTestId('cinematic-versus')).toContainText('XERVIAS');
  await expect(page.getByTestId('cinematic-versus')).toContainText('DOMINGO QUISPE');
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.locator('.dr-royal-layout')).toBeVisible();
});
test('guided duel HUD always shows neutral tiny portraits, not story figures',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Phone duel HUD');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=duelo');
  await expect(page.locator('.dr-royal-character-frame > img:first-child')).toHaveCount(2);
  await expect(page.getByAltText('Retrato de tu personaje')).toHaveAttribute('src',/retratos\/jugador\.webp/);
  const opponent=await page.getByAltText('Retrato del rival').getAttribute('src');
  expect(opponent).toMatch(/rival-01-domingo-quispe\.webp|domingo_perfil_duelo\.webp/);
  await expect(page.getByTestId('guided-large-actor')).toHaveCount(1);
  const limits=await page.locator('.dr-royal-character-frame').evaluateAll(items=>
    items.map(x=>x.getBoundingClientRect().width));
  expect(Math.abs(limits[0]-limits[1])).toBeLessThanOrEqual(1);
});


test('mother, child and Domingo are grounded 15px into the dialogue edge',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mobile visual novel staging regression');
  for(const scene of ['arresto','desenlace']){
    await page.goto('/Decreto-Real/#/campania/prologo?escena='+scene);
    if(scene==='desenlace'){
      await page.locator('.dcop-dialog-body footer button').click();
      await page.locator('.dcop-dialog-body footer button').click();
      await expect(page.locator('.dcop-nameplate')).toHaveText('Madre');
    }
    await expect(page.locator('.dcop-scene-figures .dcop-civil .dcop-child-sprite')).toBeVisible();
    const layout=await page.evaluate(()=>{
      const panel=document.querySelector('.dcop-narrative')!.getBoundingClientRect();
      const actors=document.querySelector('.dcop-scene-figures')!.getBoundingClientRect();
      const mother=document.querySelector('.dcop-civil img:not(.dcop-child-sprite)') as HTMLImageElement;
      const boy=document.querySelector('.dcop-child-sprite') as HTMLImageElement;
      const boyRect=boy.getBoundingClientRect();
      const motherRect=mother.getBoundingClientRect();
      const styles=getComputedStyle(boy);
      return {
        overlap:actors.bottom-panel.top,
        parentBottom:motherRect.bottom,
        childBottom:boyRect.bottom,
        childWidthRatio:boyRect.width/motherRect.width,
        childInFront:Number(styles.zIndex)>Number(getComputedStyle(mother).zIndex),
        childAtRight:boyRect.left>motherRect.left,
        motherAnchor:getComputedStyle(mother).objectPosition,
        childAnchor:styles.objectPosition,
        horizontalOverflow:document.documentElement.scrollWidth-innerWidth
      };
    });
    expect(layout.overlap).toBeGreaterThanOrEqual(13);
    expect(layout.overlap).toBeLessThanOrEqual(17);
    expect(Math.abs(layout.parentBottom-layout.childBottom)).toBeLessThanOrEqual(2);
    expect(layout.childWidthRatio).toBeGreaterThanOrEqual(.75);
    expect(layout.childInFront).toBe(true);
    expect(layout.childAtRight).toBe(true);
    expect(layout.motherAnchor).toMatch(/(?:bottom|100%)$/);
    expect(layout.childAnchor).toMatch(/(?:bottom|100%)$/);
    expect(layout.horizontalOverflow).toBeLessThanOrEqual(1);
  }
});

test('speaking does not change adult head slots or vertical anchors',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mobile adult alignment regression');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=arresto');
  const positions=async()=>page.locator('.dcop-scene-figures>div img:not(.dcop-child-sprite)').evaluateAll(imgs=>
    imgs.map(img=>({top:img.getBoundingClientRect().top,bottom:img.getBoundingClientRect().bottom,
      objectPosition:getComputedStyle(img).objectPosition})));
  const first=await positions();
  await page.locator('.dcop-dialog-body footer button').click();
  const second=await positions();
  expect(first).toHaveLength(2);
  expect(second).toHaveLength(2);
  for(let i=0;i<2;i++){
    expect(Math.abs(first[i].top-second[i].top)).toBeLessThanOrEqual(2);
    expect(Math.abs(first[i].bottom-second[i].bottom)).toBeLessThanOrEqual(2);
    expect(first[i].objectPosition).toMatch(/bottom|100%/);
  }
});



test('scene 7 puts Xervias left and mother with enlarged distinct child at right',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mobile scene 7 staging');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=xervias');
  await page.locator('.dcop-dialog-body footer button').click();
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.locator('.dcop-nameplate')).toHaveText('Madre');
  const actors=page.locator('.dcop-scene-figures');
  await expect(actors).toHaveClass(/dcop-family-right/);
  await expect(actors.locator(':scope > div').first()).toHaveClass(/dcop-hero/);
  await expect(actors.locator(':scope > div').last()).toHaveClass(/dcop-civil/);
  await expect(actors.locator('.dcop-child-sprite')).toBeVisible();
  const bounds=await page.evaluate(()=>{
    const hero=document.querySelector('.dcop-family-right .dcop-hero')!.getBoundingClientRect();
    const mother=document.querySelector('.dcop-family-right .dcop-civil')!.getBoundingClientRect();
    const child=document.querySelector('.dcop-family-right .dcop-child-sprite')!.getBoundingClientRect();
    return {heroX:hero.left,motherX:mother.left,childX:child.left};
  });
  expect(bounds.heroX).toBeLessThan(bounds.motherX);
  expect(bounds.childX).toBeLessThan(bounds.motherX+100);
});

test('Domingo is enlarged and genuinely angry when the guard defies Xervias',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mobile scene 15 expression');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=desafio');
  for(let i=0;i<3;i++)await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.locator('.dcop-nameplate')).toHaveText('Domingo Quispe');
  await expect(page.locator('.dcop-actor-domingo img')).toHaveAttribute('src',/domingo_07_enojado\.png|domingo_02_molesto\.webp/);
  const width=await page.evaluate(()=>{
    const d=document.querySelector('.dcop-actor-domingo img')!.getBoundingClientRect().width;
    const x=document.querySelector('.dcop-hero img')!.getBoundingClientRect().width;
    return d/x;
  });
  expect(width).toBeGreaterThan(1.10);
});

test('scene 16 ring-only, scene 17 PNG card, scene 20 embedded Domingo art',async({page},info)=>{
  test.skip(info.project.name!=='mobile-390','Mobile invocations');
  await page.goto('/Decreto-Real/#/campania/prologo?escena=anillo');
  await expect(page.locator('.dcop-nameplate')).toHaveText('Xervias');
  await expect(page.locator('.dcop-invocation-shimmer')).toHaveCount(0);
  await expect(page.locator('.dcop-counter-invocation')).toHaveCount(0);
  await expect(page.locator('.dcop-hero img')).toHaveAttribute('src',/xervias_05_anillo_energia\.png|xervias_01_objecion\.webp/);
  await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('xervias-golden-invocation')).toBeVisible();
  const card=page.locator('.dcop-invocation-shimmer .dcop-summoned-card');
  await expect(card).toHaveCount(1);
  await expect(card).toHaveAttribute('src',/carta_dorada_invocacion\.png|carta-invocacion-real\.svg/);
  for(let i=0;i<3;i++)await page.locator('.dcop-dialog-body footer button').click();
  await expect(page.getByTestId('domingo-integrated-invocation')).toBeVisible();
  await expect(page.locator('.dcop-counter-invocation')).toHaveCount(0);
  const opponent=page.getByTestId('domingo-integrated-invocation').locator('img');
  await expect(opponent).toHaveAttribute('src',/domingo_08_invocacion_combate\.png|domingo_02_molesto\.webp/);
});
