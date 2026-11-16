import { expect, test } from '@playwright/test';

test('los botones del menú no tienen emojis y son menos anchos y más altos', async ({ page }) => {
  await page.goto('/Decreto-Real/#/');
  const versus = page.getByRole('button', { name: 'Versus IA' });
  const multiplayer = page.getByRole('button', { name: 'Multijugador' });
  await expect(versus).toBeVisible({ timeout: 25000 });
  await expect(multiplayer).toBeVisible();
  expect(await page.locator('.dr-cinematic-button-icon').count()).toBe(0);

  const viewport = page.viewportSize();
  const first = await versus.boundingBox();
  const second = await multiplayer.boundingBox();
  expect(first).not.toBeNull();
  expect(second).not.toBeNull();
  if (!viewport || !first || !second) return;
  const maxWidth = Math.min(viewport.width * .71, 520);
  expect(first.width).toBeLessThanOrEqual(maxWidth);
  expect(second.width).toBeLessThanOrEqual(maxWidth);
  expect(first.height).toBeGreaterThanOrEqual(40);
  expect(second.height).toBeGreaterThanOrEqual(40);
  expect(Math.abs(first.width - second.width)).toBeLessThan(2);
});

test('el logo aparece mientras se descarga el MP3; no se muestra el menú si falla el sonido habilitado', async ({ page }) => {
  await page.addInitScript(() => window.localStorage.setItem('decreto_music','true'));
  await page.route(/audio\/suno-g3\/mus_menu_reinos_del_peru_v01\.mp3/, route =>
    route.fulfill({status:503, contentType:'text/plain', body:'Musica temporalmente no disponible'}));
  await page.goto('/Decreto-Real/#/');
  const screen = page.getByTestId('initial-loading-screen');
  await expect(screen).toBeVisible();
  await expect(screen.getByRole('alert')).toContainText('Música del menú preparada', { timeout: 20000 });
  await expect(page.getByRole('button',{name:'Versus IA'})).toHaveCount(0);
  await page.unroute(/audio\/suno-g3\/mus_menu_reinos_del_peru_v01\.mp3/);
  await screen.getByRole('button',{name:'Reintentar'}).click();
  await expect(page.getByRole('button',{name:'Versus IA'})).toBeVisible({ timeout:25000 });
});

test('si Chrome bloquea autoplay aparece un botón que habilita la música con un toque', async ({ page }) => {
  await page.addInitScript(() => {
    window.localStorage.setItem('decreto_music','true');
    const nativePlay=HTMLMediaElement.prototype.play;
    let audioUnlocked=false;
    document.addEventListener('pointerdown',event=>{
      if ((event.target as HTMLElement).closest('.dr-cinematic-music-unlock')) audioUnlocked=true;
    },true);
    HTMLMediaElement.prototype.play=function() {
      if(this instanceof HTMLAudioElement) {
        return audioUnlocked ? Promise.resolve() :
          Promise.reject(new DOMException('Autoplay blocked','NotAllowedError'));
      }
      return nativePlay.call(this);
    };
  });
  await page.goto('/Decreto-Real/#/');
  const menu = page.getByRole('button',{name:'Versus IA'});
  await expect(menu).toBeVisible({timeout:25000});
  const button = page.getByRole('button',{name:'Activar música del menú'});
  await expect(button).toBeVisible();
  await button.click();
  await expect(button).toHaveCount(0);
  await expect(menu).toBeVisible();
});
