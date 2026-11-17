import { expect, test, type Page } from '@playwright/test';

/** A fake socket keeps the browser test deterministic without a live Railway room. */
async function openGuest(page: Page, url: string) {
  await page.addInitScript(() => {
    localStorage.setItem('decreto-real.pvp.duelist.v1', JSON.stringify({
      version: 1, active: 0,
      slots: [{ name: 'Duelista Invitado',
        appearance: { portrait: 'xervias', entrance: 'clasica', back: 'clasico', nameFx: 'clasico' } }],
      progress: { matches: 0, wins: 0, impacts: 0 }, rewardedRooms: [],
    }));
    const sent: Record<string, unknown>[] = [];
    (window as any).__pvpSent = sent;
    class MockSocket extends EventTarget {
      static OPEN = 1;
      readyState = 0;
      constructor(_url: string) {
        super();
        (window as any).__pvpSocket = this;
        queueMicrotask(() => { this.readyState = 1; this.dispatchEvent(new Event('open')); });
      }
      send(value: string) { sent.push(JSON.parse(value)); }
      close() { this.readyState = 3; this.dispatchEvent(new Event('close')); }
      emit(value: object) { this.dispatchEvent(new MessageEvent('message', { data: JSON.stringify(value) })); }
    }
    (window as any).WebSocket = MockSocket;
  });
  await page.goto(url);
  await expect(page.getByRole('button', { name: 'Empezar partida' })).toBeVisible();
}

test('un enlace invitado no une automáticamente; muestra dos botones grandes y permite volver', async ({ page }) => {
  await openGuest(page, '/Decreto-Real/?sala=27KP#/multijugador');
  const start = page.getByRole('button', { name: 'Empezar partida' });
  const back = page.getByRole('button', { name: 'Volver al menú Multijugador' });
  await expect(start).toBeEnabled();
  await expect(back).toBeEnabled();
  const a = await start.boundingBox();
  const b = await back.boundingBox();
  expect(a?.height).toBeGreaterThanOrEqual(63);
  expect(b?.height).toBeGreaterThanOrEqual(63);
  expect(a?.width).toBeGreaterThanOrEqual(250);
  expect(b?.width).toBeGreaterThanOrEqual(250);
  expect(await page.evaluate(() => (window as any).__pvpSent.filter((m: any) => m.type === 'join'))).toEqual([]);
  await back.click();
  await expect(page.getByRole('button', { name: 'Jugar ahora' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Empezar partida' })).toHaveCount(0);
  expect(new URL(page.url()).searchParams.has('sala')).toBe(false);
  expect(await page.evaluate(() => (window as any).__pvpSent.filter((m: any) => m.type === 'join'))).toEqual([]);
});

test('el invitado comienza solo cuando pulsa Empezar partida, una vez', async ({ page }) => {
  await openGuest(page, '/Decreto-Real/?sala=27KP#/multijugador');
  await page.getByRole('button', { name: 'Empezar partida' }).click();
  await expect(page.getByRole('button', { name: 'Conectando al duelo…' })).toBeDisabled();
  const entries = await page.evaluate(() => (window as any).__pvpSent.filter((m: any) => m.type === 'join'));
  expect(entries).toHaveLength(1);
  expect(entries[0]).toMatchObject({ code: '27KP', name: 'Duelista Invitado' });
});

test('desafío desde Amigos y chat exige pulsar Empezar partida', async ({ page }) => {
  await openGuest(page, '/Decreto-Real/#/multijugador');
  await page.evaluate(() => (window as any).__pvpSocket.emit({
    type: 'social:incoming_challenge', from: 'other-user', name: 'Rival',
    code: '27KP',
  }));
  await expect(page.getByText('Rival', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Empezar partida' })).toBeVisible();
  expect(await page.evaluate(() => (window as any).__pvpSent.filter((m: any) => m.type === 'social:accept_challenge'))).toEqual([]);
  await page.getByRole('button', { name: 'Volver al menú Multijugador' }).click();
  await expect(page.getByRole('button', { name: 'Jugar ahora' })).toBeVisible();
  const actions = await page.evaluate(() => (window as any).__pvpSent);
  expect(actions.some((m: any) => m.type === 'social:decline_challenge' && m.code === '27KP')).toBe(true);
  expect(actions.some((m: any) => m.type === 'social:accept_challenge')).toBe(false);
});
