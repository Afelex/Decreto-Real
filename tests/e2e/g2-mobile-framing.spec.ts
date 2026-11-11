import { expect, test } from '@playwright/test';

// Revisión reproducible de los 25 originales sin sobrescribir arte ni progreso.
// Los 25 PNG de salida se pueden descargar como artefacto de GitHub Actions.
test.beforeEach(async ({},info)=>{
  test.skip(info.project.name!=='mobile-390','Encadres de referencia: móvil 390 × 844');
});
const root='/Decreto-Real/';

test('G2: todas las imágenes 2:3 se pueden comparar en el recorte móvil y guardar 25 capturas',async({page},testInfo)=>{
  test.setTimeout(180_000);
  await page.goto(root+'?drDev=1#/artes');
  await expect(page.getByRole('heading',{name:'Biblioteca central de artes'})).toBeVisible();
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  // Solo los 25 fondos, no los seis maestros G2 visibles en el mismo filtro.
  const cards=page.locator('.dr-art-card').filter({hasText:/G2 (?:FON|M35|M36)/i});
  await expect(cards).toHaveCount(25);
  for(let index=0;index<25;index++){
    await cards.nth(index).click();
    await page.getByTestId('g2-preview-mobile-button').click();
    const preview=page.getByTestId('g2-review-preview');
    await expect(preview).toHaveAttribute('data-preview-mode','mobile');
    const img=preview.locator('img');
    await expect.poll(()=>img.evaluate(node=>node instanceof HTMLImageElement?[node.naturalWidth,node.naturalHeight]:[]))
      .toEqual([1024,1536]);
    const state=await preview.evaluate(element=>{
      const img=element.querySelector('img')!;
      const style=getComputedStyle(img);
      const box=element.getBoundingClientRect();
      return {ratio:box.width/box.height,fit:style.objectFit,position:style.objectPosition};
    });
    expect(state.fit).toBe('cover');
    expect(state.position).toBe('50% 50%');
    expect(state.ratio).toBeGreaterThan(0.45);
    expect(state.ratio).toBeLessThan(0.48);
    await expect(preview.locator('.dr-art-preview-top-guide')).toBeVisible();
    await preview.screenshot({path:testInfo.outputPath('g2-mobile-'+String(index+1).padStart(2,'0')+'.png')});
  }
});

test('la galería compara franja horizontal con foco al 32% y permite volver a original',async({page})=>{
  await page.goto(root+'?drDev=1#/artes');
  await page.getByRole('combobox',{name:'Filtrar por generación'}).selectOption('DR-G2-2026');
  // Solo los 25 fondos, no los seis maestros G2 visibles en el mismo filtro.
  const cards=page.locator('.dr-art-card').filter({hasText:/G2 (?:FON|M35|M36)/i});
  await expect(cards).toHaveCount(25);
  // Verifica prólogo, regiones y transición del derrumbe.
  for(const index of [0,1,3,9,17,20,21,22,23,24]){
    await cards.nth(index).click();
    await page.getByTestId('g2-preview-strip-button').click();
    const preview=page.getByTestId('g2-review-preview');
    await expect(preview).toHaveAttribute('data-preview-mode','strip');
    const frame=await preview.evaluate(el=>{
      const image=el.querySelector('img')!;
      const style=getComputedStyle(image);
      const box=el.getBoundingClientRect();
      return {fit:style.objectFit,pos:style.objectPosition,ratio:box.width/box.height};
    });
    expect(frame.fit).toBe('cover');
    expect(frame.pos).toBe('50% 32%');
    expect(frame.ratio).toBeGreaterThan(3.15);
    expect(frame.ratio).toBeLessThan(3.35);
  }
  await page.getByRole('button',{name:'Original',exact:true}).click();
  await expect(page.getByTestId('g2-review-preview')).toHaveAttribute('data-preview-mode','original');
});

test('la franja de una misión G2 usa el foco 32% y G1 queda inalterado',async({page})=>{
  await page.goto(root+'#/campania/mision/01');
  const g2=page.locator('.dc-region-scene.dc-region-g2 .dc-region-illustration');
  await expect(g2).toBeVisible();
  await expect(g2).toHaveAttribute('src',/prologo-plaza-del-pregon\.webp$/);
  const result=await g2.evaluate(node=>{
    const style=getComputedStyle(node);
    const b=node.getBoundingClientRect();
    return {fit:style.objectFit,pos:style.objectPosition,width:b.width,height:b.height};
  });
  expect(result.fit).toBe('cover');
  expect(result.pos).toBe('50% 32%');
  expect(result.width).toBeGreaterThan(270);
  expect(result.height).toBeLessThan(130);
});
