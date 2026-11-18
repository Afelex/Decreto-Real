import { expect, test } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';

/**
 * Real production preview (built Vite assets) rather than the Vite dev server.
 * Capture observed elapsed time and resource entries without fragile hard
 * cutoffs: CI runners are not a substitute for a real Android device.
 */
test('producción: la portada no descarga el MP4 del duelo antes de entrar', async ({ page }, testInfo) => {
  const battleRequests: string[] = [];
  const errors: string[] = [];
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.url().includes('/escenarios/partida-inicial-loop.mp4')) battleRequests.push(request.url());
  });
  const start=Date.now();
  await page.goto('http://127.0.0.1:4174/Decreto-Real/#/');
  await expect(page.getByRole('button',{name:'Versus IA'})).toBeVisible();
  const menuReadyMs=Date.now()-start;
  // Former menu prefetch triggered after 1500 ms even without any interest.
  await page.waitForTimeout(1750);
  expect(battleRequests).toEqual([]);
  const resourceReport=await page.evaluate(() => {
    const resources=performance.getEntriesByType('resource') as PerformanceResourceTiming[];
    return {
      js: resources.filter(r=>r.name.includes('/assets/')&&r.name.endsWith('.js')).length,
      css: resources.filter(r=>r.name.includes('/assets/')&&r.name.endsWith('.css')).length,
      video: resources.filter(r=>r.name.endsWith('.mp4')).map(r=>r.name.split('/').pop()),
      totalReportedTransferBytes: resources.reduce((acc,r)=>acc+r.transferSize,0),
    };
  });
  const clickAt=Date.now();
  await page.getByRole('button',{name:'Versus IA'}).click();
  await page.getByRole('button',{name:'Comenzar duelo'}).click();
  await expect(page.getByTestId('duel-entrance')).toBeVisible();
  await page.getByRole('button',{name:'Omitir introducción'}).click();
  await expect(page.getByRole('button',{name:'Lanzar Moneda'})).toBeEnabled();
  const coinReadyMs=Date.now()-clickAt;
  const report={viewport:page.viewportSize(),menuReadyMs,coinReadyMs,resourceReport};
  const reportText=JSON.stringify(report,null,2);
  await mkdir('test-results/ia-metrics',{recursive:true});
  await writeFile(`test-results/ia-metrics/${testInfo.project.name}.json`,reportText,'utf8');
  console.log('[IA_PERF] '+testInfo.project.name+' '+JSON.stringify(report));
  await testInfo.attach('rendimiento-menu-ia.json',{
    body:reportText,contentType:'application/json',
  });
  expect(errors).toEqual([]);
});

test('ciclo del duelo: pausa, cancelación, reinicio y salida al menú sin errores', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror',error=>errors.push(error.message));
  // The player wins the coin toss; no randomness-dependent strategy is needed.
  await page.addInitScript(()=>{Math.random=()=>0.99;});
  await page.goto('/Decreto-Real/#/game');
  await expect(page.getByRole('button',{name:'Lanzar Moneda'})).toBeEnabled();
  // The coin modal correctly covers the board: pause only after a turn begins.
  await page.getByRole('button',{name:'Lanzar Moneda'}).click();
  await expect(page.locator('.dr-event-indicator.is-player')).toBeVisible({timeout:12000});

  await page.getByRole('button',{name:'Abrir menú de pausa'}).click({timeout:8000});
  await expect(page.getByTestId('royal-pause-menu')).toBeVisible();
  await page.getByRole('button',{name:/REINICIAR PARTIDA/i}).click({timeout:8000});
  await expect(page.getByRole('alertdialog')).toBeVisible();
  await page.getByRole('button',{name:/CANCELAR/i}).click();
  await expect(page.getByRole('dialog',{name:'PAUSA'})).toBeVisible();
  await page.getByRole('button',{name:/REINICIAR PARTIDA/i}).click({timeout:8000});
  await page.getByRole('button',{name:/SÍ, REINICIAR/i}).click();
  await expect(page.getByRole('button',{name:'Lanzar Moneda'})).toBeEnabled({timeout:10000});

  await page.getByRole('button',{name:'Lanzar Moneda'}).click();
  await expect(page.locator('.dr-event-indicator.is-player')).toBeVisible({timeout:12000});
  await page.getByRole('button',{name:'Abrir menú de pausa'}).click();
  await page.getByRole('button',{name:'VOLVER AL MENÚ PRINCIPAL'}).click();
  let exitConfirmation = page.getByRole('alertdialog',{name:'¿Deseas salir de la partida?'});
  await expect(exitConfirmation).toBeVisible();
  await exitConfirmation.getByRole('button',{name:'CANCELAR'}).click();
  await expect(page.getByRole('dialog',{name:'PAUSA'})).toBeVisible();
  await page.getByRole('button',{name:'VOLVER AL MENÚ PRINCIPAL'}).click();
  exitConfirmation = page.getByRole('alertdialog',{name:'¿Deseas salir de la partida?'});
  await exitConfirmation.getByRole('button',{name:'SÍ',exact:true}).click();
  await expect(page.getByTestId('royal-pause-menu')).toHaveCount(0);
  await expect(page.getByRole('button',{name:'Versus IA'})).toBeVisible();
  await expect(page.locator('.dr-royal-end-banner-stage.is-defeat')).toHaveCount(0);
  expect(errors).toEqual([]);
});
