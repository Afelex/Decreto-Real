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
