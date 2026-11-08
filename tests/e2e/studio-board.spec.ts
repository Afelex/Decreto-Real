import {test,expect,type Page} from '@playwright/test';

/** Studio · Tablero: ajustes visuales del duelo por perfil de pantalla, sin tocar el juego. */
const only=(names:string[])=>(projectName:string)=>!names.includes(projectName);
async function openBoard(page:Page){
  await page.goto('/Decreto-Real/?drDev=1#/game?studio=1');
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.locator('.dr-royal-layout')).toBeVisible();
}
const set=async(page:Page,id:string,value:string)=>{await page.getByTestId(id).fill(value);await page.getByTestId(id).press('Tab');};

test('portraits, decks and buttons can be moved and scaled without breaking their own transforms',async({page},info)=>{
  test.skip(only(['mobile-390','landscape','desktop-1280'])(info.project.name),'Board studio');
  await openBoard(page);
  const expected=info.project.name==='desktop-1280'?'Escritorio':info.project.name==='landscape'?'Horizontal':'Móvil vertical';
  await expect(page.getByTestId('studio-board-profile')).toContainText(expected);
  await page.getByTestId('studio-actor-select').selectOption({label:'Botón «Fin de turno»'});
  const finish=page.locator('.dr-royal-finish');
  const before=(await finish.boundingBox())!;
  await set(page,'studio-scale-number','130');
  await set(page,'studio-x','-10');
  await expect(finish).toHaveClass(/dr-board-adjusted/);
  const after=(await finish.boundingBox())!;
  expect(after.width).toBeGreaterThan(before.width*1.2);
  expect(after.x+after.width/2).toBeLessThan(before.x+before.width/2-10);
  // Editing freezes the game: clicking «Fin de turno» does not end the turn.
  await page.getByRole('button',{name:'Contraer editor'}).click().catch(()=>{});
  const enabledBefore=await finish.isEnabled();
  await finish.click({force:true});
  await page.waitForTimeout(600);
  expect(await finish.isEnabled()).toBe(enabledBefore);
  await expect(page.locator('.dr-royal-layout')).toHaveClass(/dr-board-editing/);
  await page.getByRole('button',{name:'Abrir editor'}).click().catch(()=>{});
  await page.getByTestId('studio-save').click();
  await page.reload();
  await expect(page.locator('.dr-royal-finish')).toHaveClass(/dr-board-adjusted/);
});

test('elements can be hidden from players and the layout is per screen profile',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Board visibility and profiles');
  await openBoard(page);
  await page.getByTestId('studio-actor-select').selectOption({label:'Mazo del rival'});
  await page.getByTestId('studio-dev-only').click();
  await page.getByTestId('studio-actor-select').selectOption({label:'Tu retrato'});
  await set(page,'studio-y','-4');
  await page.getByTestId('studio-save').click();
  await page.getByTestId('studio-exit').click();
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
  // QA (desarrollador) sigue viendo el mazo; el retrato queda movido.
  await expect(page.locator('.dr-royal-rival-deck')).toBeVisible();
  await expect(page.locator('.dr-royal-character.player')).toHaveClass(/dr-board-adjusted/);
  // Otro perfil (horizontal) no hereda el ajuste del móvil.
  await page.setViewportSize({width:844,height:390});
  await expect(page.locator('.dr-royal-character.player')).not.toHaveClass(/dr-board-adjusted/);
});

test('the scenes catalog opens the board editor',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Catalog');
  await page.goto('/Decreto-Real/?drDev=1#/studio/escenas');
  await page.getByTestId('studio-catalog-tablero').click();
  await expect(page.getByTestId('studio-board-profile')).toBeVisible();
});


test('the player hand and both turn labels can be positioned separately in Studio',async({page},info)=>{
  test.skip(only(['mobile-390','landscape','desktop-1280'])(info.project.name),'Studio turn labels and hand');
  await openBoard(page);
  const hand=page.locator('.dr-royal-player-hand');
  await expect(hand).toHaveAttribute('data-studio-actor','native-tablero-mano-jugador');
  const handBefore=(await hand.boundingBox())!;
  await page.getByTestId('studio-actor-select').selectOption({label:'Tu mano (cartas)'});
  await expect(page.getByTestId('studio-visible')).toBeDisabled();
  await expect(page.getByTestId('studio-dev-only')).toBeDisabled();
  await set(page,'studio-y','-6');
  const handAfter=(await hand.boundingBox())!;
  expect(handAfter.y).toBeLessThan(handBefore.y-10);

  for(const [label,selector] of [
    ['Etiqueta «Tu Turno»','.dr-event-indicator.is-player'],
    ['Etiqueta «Turno del Oponente»','.dr-event-indicator.is-opponent'],
  ]){
    const indicator=page.locator(selector);
    await expect(indicator).toBeVisible();
    await page.getByTestId('studio-actor-select').selectOption({label});
    const ribbon=page.locator('.dr-event-turn--studio-preview .dr-event-turn__ribbon');
    await expect(ribbon).toBeVisible();
    const before=(await ribbon.boundingBox())!;
    await set(page,'studio-x','-5');
    const after=(await ribbon.boundingBox())!;
    expect(after.x).toBeLessThan(before.x-10);
  }
  await page.getByTestId('studio-save').click();
  await page.reload();
  await expect(hand).toHaveClass(/dr-board-adjusted/);
  await expect(page.locator('.dr-event-indicator.is-player')).toHaveClass(/dr-board-adjusted/);
  await expect(page.locator('.dr-event-indicator.is-opponent')).toHaveClass(/dr-board-adjusted/);
});


test('Studio previews tutorial dialogue, combo, coin and narrative portraits without playing',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Tutorial editor');
  await openBoard(page);
  const pick=page.getByTestId('studio-actor-select');
  await pick.selectOption({label:'Tutorial · Ventana de diálogo'});
  const coach=page.getByTestId('campaign-guided-coach');
  await expect(coach).toHaveAttribute('data-studio-actor','native-tablero-tutorial-dialogo');
  await expect(coach).toContainText('Duelo guiado');
  await page.getByTestId('studio-guide-step').selectOption('11');
  await expect(coach).toContainText('12/32');
  await page.getByTestId('studio-guide-text').fill('Arrastra el ataque para practicar el combo.');
  await page.getByTestId('studio-guide-text').press('Tab');
  await expect(coach).toContainText('Arrastra el ataque para practicar el combo.');
  await set(page,'studio-y','-6');
  await expect(coach).toHaveClass(/dr-board-adjusted/);
  for(const [label,selector] of [
    ['Tutorial · COMBO ×2/×3 de Ataque','.dr-royal-combo'],
    ['Tutorial · Moneda y encabezado','.dr-event-coin-panel'],
    ['Tutorial · Menú de combo','.dr-event-choice'],
    ['Tutorial · Ilustración de Domingo','.dr-royal-guided-actor.is-rival'],
    ['Tutorial · Ilustración de Xervias','.dr-royal-guided-actor.is-player'],
  ]){
    await pick.selectOption({label});
    await expect(page.locator(selector)).toHaveAttribute('data-studio-actor',/native-tablero-/);
    await set(page,'studio-y','-5');
    await expect(page.locator(selector)).toHaveClass(/dr-board-adjusted/);
  }
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await page.getByTestId('studio-guide-step').selectOption('11');
  await expect(page.getByTestId('studio-guide-text')).toHaveValue('Arrastra el ataque para practicar el combo.');
  await expect(page.getByTestId('campaign-guided-coach')).toHaveClass(/dr-board-adjusted/);
});


test('narrative layout is independently editable per tutorial beat and remains after reload',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Individual tutorial scenes');
  await openBoard(page);
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await page.getByTestId('studio-guide-step').selectOption('11');
  await expect(page.getByTestId('studio-narrative-scope')).toContainText('paso 12/32');
  const first=page.getByTestId('campaign-guided-coach');
  await expect(first).toBeVisible();
  await set(page,'studio-y','-12');
  await expect(first).toHaveClass(/dr-board-adjusted/);
  await page.getByTestId('studio-guide-step').selectOption('12');
  await expect(page.getByTestId('studio-y')).not.toHaveValue('-12');
  await page.getByTestId('studio-guide-step').selectOption('11');
  await expect(page.getByTestId('studio-y')).toHaveValue('-12');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await page.getByTestId('studio-guide-step').selectOption('11');
  await expect(page.getByTestId('studio-y')).toHaveValue('-12');
  await page.getByTestId('studio-guide-step').selectOption('12');
  await expect(page.getByTestId('studio-y')).not.toHaveValue('-12');
});

test('narrative card edits speaker and direction while preserving the guided action',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Narrative card editor');
  await openBoard(page);
  await page.getByTestId('studio-guide-step').selectOption('11');
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  const intent=page.getByTestId('studio-narrative-intent');
  await expect(intent).toHaveValue(/Explicar el daño recibido/);
  await expect(page.getByTestId('studio-narrative-trigger')).toContainText('Continuar diálogo');
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await page.getByTestId('studio-narrative-speaker').selectOption('Domingo Quispe');
  await expect(page.getByTestId('campaign-guided-coach')).toContainText('Domingo Quispe');
  await page.getByTestId('studio-narrative-tone').selectOption('sereno');
  await page.getByTestId('studio-narrative-direction').fill('Despejar las cartas; retrato a la derecha.');
  await page.getByTestId('studio-narrative-direction').press('Tab');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-guide-step').selectOption('11');
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  await expect(page.getByTestId('studio-narrative-speaker')).toHaveValue('Domingo Quispe');
  await expect(page.getByTestId('studio-narrative-tone')).toHaveValue('sereno');
  await expect(page.getByTestId('studio-narrative-direction')).toHaveValue('Despejar las cartas; retrato a la derecha.');
  await page.getByTestId('studio-guide-step').selectOption('12');
  await expect(page.getByTestId('studio-narrative-speaker')).toHaveValue('Xervias');
});


test('Studio presents whole tutorial compositions and keeps edits isolated by step',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Narrative composition');
  await openBoard(page);
  const chooser=page.getByTestId('studio-guide-step');
  const coach=page.getByTestId('campaign-guided-coach');
  await expect(coach).toBeVisible();
  await expect(page.locator('.dr-royal-guided-actor.is-rival')).toBeVisible();
  await chooser.selectOption('5');
  await expect(coach).toBeVisible();
  await expect(coach).toHaveClass(/is-guided-action/);
  await expect(page.locator('.dr-royal-guided-actor.is-player')).toHaveCount(0);
  await chooser.selectOption('8');
  await expect(page.locator('.dr-royal-combo')).toBeVisible();
  await expect(page.locator('.dr-event-choice')).toBeVisible();
  await chooser.selectOption('3');
  await expect(page.locator('.dr-event-coin-panel')).toBeVisible();
  await chooser.selectOption('11');
  await expect(page.locator('.dr-royal-guided-actor.is-player')).toBeVisible();
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  const before=await page.getByTestId('studio-y').inputValue();
  await set(page,'studio-y','-16');
  await chooser.selectOption('12');
  const next=await page.getByTestId('studio-y').inputValue();
  expect(next).not.toBe('-16');
  await chooser.selectOption('11');
  await expect(page.getByTestId('studio-y')).toHaveValue('-16');
  await page.getByTestId('studio-layout-reapply').click();
  await expect(page.getByTestId('studio-y')).toHaveValue(before);
  await page.getByTestId('studio-layout-complete').click();
  await expect(page.getByTestId('studio-y')).toHaveValue(before);
  await page.getByTestId('studio-save').click();
  await page.reload();
  await chooser.selectOption('11');
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await expect(page.getByTestId('studio-y')).toHaveValue(before);
});


test('visual audit flags a dialogue overlapping the hand and can suggest a reversible correction',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Story visual audit');
  await openBoard(page);
  await page.getByTestId('studio-guide-step').selectOption('5');
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  const coach=page.getByTestId('campaign-guided-coach');
  const displacement=await page.evaluate(()=>{
    const coach=document.querySelector('[data-testid="campaign-guided-coach"]')!;
    const hand=document.querySelector('.dr-royal-player-hand')!;
    const stage=document.querySelector('.dr-royal-screen')!;
    const a=coach.getBoundingClientRect(),b=hand.getBoundingClientRect(),root=stage.getBoundingClientRect();
    return ((b.top+b.height/2)-(a.top+a.height/2))/root.height*100;
  });
  const original=Number(await page.getByTestId('studio-y').inputValue());
  await set(page,'studio-y',String(Math.round((original+displacement)*100)/100));
  await page.getByTestId('studio-audit-refresh').click();
  await expect(page.getByTestId('studio-overlap-count')).toContainText('problema');
  await expect(page.getByTestId('studio-overlap-warning').first()).toBeVisible();
  await page.getByTestId('studio-audit-fix').click();
  await expect(page.getByTestId('studio-y')).not.toHaveValue(String(Math.round((original+displacement)*100)/100));
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(coach).toBeVisible();
});

test('player preview hides Studio without advancing tutorial or changing edits',async({page},info)=>{
  test.skip(only(['mobile-390','desktop-1280'])(info.project.name),'Clean narrative preview');
  await openBoard(page);
  await page.getByTestId('studio-guide-step').selectOption('8');
  await page.getByTestId('studio-actor-select').selectOption({label:'Tutorial · Ventana de diálogo'});
  await expect(page.getByTestId('campaign-guided-coach')).toContainText('Duelo guiado · 9/32');
  await expect(page.locator('.dr-royal-combo')).toBeVisible();
  await page.getByTestId('studio-preview-player').click();
  await expect(page.getByTestId('dr-studio')).toBeHidden();
  await expect(page.getByTestId('studio-player-return')).toBeVisible();
  await expect(page.getByTestId('campaign-guided-coach')).toBeVisible();
  await expect(page.getByTestId('campaign-guided-coach')).not.toHaveAttribute('data-studio-actor',/.+/);
  await expect(page.getByTestId('campaign-guided-coach')).toContainText('9/32');
  await expect(page.locator('.dr-royal-layout')).toHaveClass(/dr-board-editing/);
  await page.getByTestId('studio-player-return').click();
  await expect(page.getByTestId('dr-studio')).toBeVisible();
  await expect(page.getByTestId('studio-guide-step')).toHaveValue('8');
});


test('Studio selects a real narrative expression and the guided portrait follows it',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Narrative sprites');
  await openBoard(page);
  await page.getByTestId('studio-guide-step').selectOption('0');
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  const sprite=page.getByTestId('studio-narrative-sprite');
  const preview=page.getByTestId('studio-narrative-sprite-preview').locator('img');
  const actor=page.locator('.dr-royal-guided-actor.is-rival img');
  await expect(sprite).toHaveValue('');
  await expect(preview).toHaveAttribute('src',/domingo_02_arrogante\.webp/);
  await expect(actor).toHaveAttribute('src',/domingo_02_arrogante\.webp/);
  await sprite.selectOption('domingo-burlon');
  await expect(preview).toHaveAttribute('src',/domingo_03_burlon\.webp/);
  await expect(actor).toHaveAttribute('src',/domingo_03_burlon\.webp/);
  await page.getByTestId('studio-narrative-tone').selectOption('neutral');
  await expect(actor).toHaveAttribute('src',/domingo_03_burlon\.webp/);
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  await expect(page.getByTestId('studio-narrative-sprite')).toHaveValue('domingo-burlon');
  await expect(page.locator('.dr-royal-guided-actor.is-rival img')).toHaveAttribute('src',/domingo_03_burlon\.webp/);
  await sprite.selectOption('');
  await expect(page.locator('.dr-royal-guided-actor.is-rival img')).toHaveAttribute('src',/domingo_01_neutro\.webp/);
  await page.getByTestId('studio-guide-step').selectOption('1');
  await expect(page.getByTestId('studio-narrative-sprite-preview').locator('img')).toHaveAttribute('src',/xervias_01_objecion\.webp/);
  await expect(page.locator('.dr-royal-guided-actor.is-player img')).toHaveAttribute('src',/xervias_01_objecion\.webp/);
});


test('editorial review walks all 32 steps and updates warnings after editing',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Tutorial editorial review');
  await openBoard(page);
  const review=page.getByTestId('studio-narrative-review');
  await review.locator('summary').click();
  await page.getByTestId('studio-reading-filter').selectOption('all');
  await expect(page.getByTestId('studio-reading-step')).toHaveCount(32);
  await page.getByTestId('studio-reading-step').nth(5).click();
  await expect(page.getByTestId('studio-guide-step')).toHaveValue('5');
  await expect(page.getByTestId('campaign-guided-coach')).toContainText('6/32');
  await expect(page.getByTestId('studio-reading-current')).toContainText('Paso 6/32');
  await expect(page.getByTestId('studio-reading-measure')).toContainText('líneas medidas');
  const editor=page.getByTestId('studio-guide-text');
  await editor.fill('Ahora.');
  await editor.press('Tab');
  await expect(page.getByTestId('studio-reading-current')).toContainText('No menciona claramente la acción requerida');
  await expect(page.getByTestId('studio-reading-count')).toContainText('por revisar');
  await editor.fill('Arrastra la carta de Ataque al campo.');
  await editor.press('Tab');
  await expect(page.getByTestId('studio-reading-current')).not.toContainText('No menciona claramente la acción requerida');
  await page.getByTestId('studio-reading-previous').click();
  await expect(page.getByTestId('studio-guide-step')).toHaveValue('4');
  await page.getByTestId('studio-reading-next').click();
  await expect(page.getByTestId('studio-guide-step')).toHaveValue('5');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await page.getByTestId('studio-guide-step').selectOption('5');
  await expect(page.getByTestId('studio-guide-text')).toHaveValue('Arrastra la carta de Ataque al campo.');
  await page.getByTestId('studio-narrative-review').locator('summary').click();
  await expect(page.getByTestId('studio-reading-current')).not.toContainText('No menciona claramente la acción requerida');
});


test('phase 2 sprite gallery and visibility direction work per guided scene without editing combat',async({page},info)=>{
  test.skip(only(['mobile-390'])(info.project.name),'Narrative portrait direction');
  await openBoard(page);
  const step=page.getByTestId('studio-guide-step');
  await step.selectOption('5');
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  const mode=page.getByTestId('studio-narrative-portrait-mode');
  await expect(mode).toHaveValue('auto');
  await expect(page.locator('.dr-royal-guided-actor.is-player')).toHaveCount(0);
  await mode.selectOption('show');
  await expect(page.locator('.dr-royal-guided-actor.is-player img')).toHaveAttribute('src',/xervias_/);
  await page.getByTestId('studio-sprite-gallery').locator('summary').click();
  await expect(page.getByTestId('studio-sprite-option-xervias-energia')).toBeVisible();
  await page.getByTestId('studio-sprite-option-xervias-energia').click();
  await expect(page.locator('.dr-royal-guided-actor.is-player img')).toHaveAttribute('src',/xervias_05_anillo_energia\.png/);
  await mode.selectOption('hide');
  await expect(page.locator('.dr-royal-guided-actor.is-player')).toHaveCount(0);
  await mode.selectOption('show');
  await page.getByTestId('studio-save').click();
  await page.reload();
  await step.selectOption('5');
  await page.getByTestId('studio-narrative-card').locator('summary').click();
  await expect(page.getByTestId('studio-narrative-portrait-mode')).toHaveValue('show');
  await expect(page.getByTestId('studio-narrative-sprite')).toHaveValue('xervias-energia');
  await expect(page.locator('.dr-royal-guided-actor.is-player img')).toHaveAttribute('src',/xervias_05_anillo_energia\.png/);
  await step.selectOption('6');
  await expect(page.getByTestId('studio-narrative-portrait-mode')).toHaveValue('auto');
});
