import {test,expect} from '@playwright/test';
const mediaId='media-11111111-1111-4111-8111-111111111111';
const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO7+wL8AAAAASUVORK5CYII=','base64');
const published={version:3,assets:{[mediaId]:{name:'Publicado',mime:'image/png'}},scenes:{
  'prologo/arresto-01':{background:{assetId:mediaId},title:'Rótulo privado',titleDevOnly:true,dialogue:{text:'**Publicado** para todos'},layers:[
    {id:'actor-madre',kind:'actor',actor:'Madre',x:13,y:0,scale:1,rotation:0,opacity:1,mirror:false,z:14,visible:true},
    {id:'actor-nino',kind:'actor',actor:'Niño',x:0,y:0,scale:1,rotation:0,opacity:1,mirror:false,z:16,visible:true,devOnly:true},
  ]},
  'prologo/arresto-02':{devOnly:true,dialogue:{text:'Intervención privada'}},
  'prologo/arresto-03':{dialogue:{text:'Siguiente intervención pública'}},
}};
test.beforeEach(async({page},info)=>{
  test.skip(!['mobile-390','desktop-1280'].includes(info.project.name),'Publicación en móvil y escritorio');
  await page.route('**/studio/composiciones.json',route=>route.fulfill({json:published}));
  await page.route('**/studio/media/*.png',route=>route.fulfill({contentType:'image/png',body:png}));
});
test('el juego compilado aplica la publicación y oculta lo marcado solo dev sin leer borradores',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('decreto-real.studio.borradores.v3',JSON.stringify({version:3,scenes:{'prologo/arresto-01':{dialogue:{text:'Borrador privado'}}}})));
  await page.goto('http://127.0.0.1:4174/Decreto-Real/#/campania/prologo?escena=arresto');
  await expect(page.locator('.dcop-dialog-body strong')).toHaveText('Publicado');
  await expect(page.locator('.dcop-backdrop')).toHaveAttribute('src',new RegExp('studio/media/'+mediaId+'.png'));
  await expect.poll(()=>page.locator('.dcop-backdrop').evaluate((el:HTMLImageElement)=>el.naturalWidth)).toBe(1);
  await expect(page.locator('.dcop-civil')).toHaveAttribute('style',/--studio-x: 13/);
  await expect(page.locator('.dcop-child-sprite')).toBeHidden();
  await expect(page.getByText('Rótulo privado',{exact:true})).toHaveCount(0);
  await expect(page.locator('.dcop-stage')).toHaveCSS('--dr-stage-w',/px/);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();
  await expect(page.locator('.dcop-dialog-body')).toContainText('Siguiente intervención pública');
  await expect(page.getByTestId('dr-studio')).toHaveCount(0);
});
test('con drDev el borrador tiene prioridad y se puede partir de lo publicado',async({page})=>{
  await page.addInitScript(()=>localStorage.setItem('decreto-real.studio.borradores.v3',JSON.stringify({version:3,scenes:{'prologo/arresto-01':{dialogue:{text:'Borrador local'}}}})));
  await page.goto('http://127.0.0.1:4174/Decreto-Real/?drDev=1#/studio');
  await expect(page.getByTestId('studio-dialogue-text')).toHaveValue('Borrador local');
  await page.getByRole('button',{name:'Partir de lo publicado',exact:true}).click();
  await expect(page.getByTestId('studio-dialogue-text')).toHaveValue('**Publicado** para todos');
  await page.getByRole('button',{name:'↶ Deshacer'}).click();
  await expect(page.getByTestId('studio-dialogue-text')).toHaveValue('Borrador local');
});
test('sin publicación se mantiene el guion original',async({page})=>{
  await page.route('**/studio/composiciones.json',route=>route.fulfill({status:404,body:''}));
  await page.goto('http://127.0.0.1:4174/Decreto-Real/#/campania/prologo?escena=arresto');
  await expect(page.locator('.dcop-dialog-body')).toContainText('hijo');
  await expect(page.locator('.dcop-art')).not.toHaveClass(/studio-plane/);
});

test('Studio sin borrador parte de la publicación y reexporta sus medios públicos',async({page})=>{
  await page.goto('http://127.0.0.1:4174/Decreto-Real/?drDev=1#/studio');
  await expect(page.getByTestId('studio-dialogue-text')).toHaveValue('**Publicado** para todos');
  const downloadPromise=page.waitForEvent('download');
  await page.getByRole('button',{name:'⇪ Exportar para publicar',exact:true}).click();
  const download=await downloadPromise;
  expect(download.suggestedFilename()).toBe('decreto-real-studio-publicacion.zip');
  await expect(page.locator('.dr-studio-bottom [role="status"]')).toContainText('1 archivos');
});
