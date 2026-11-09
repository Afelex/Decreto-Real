import { test, expect } from '@playwright/test';
import { spawn } from 'node:child_process';

let server;
let base;

test.beforeAll(async () => {
  const processServer = spawn(process.execPath, ['index.mjs'], {
    cwd: new URL('.', import.meta.url).pathname,
    env: { ...process.env, PORT: '0', ALLOWED_ORIGINS: 'http://127.0.0.1:5173' },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  server = processServer;
  base = await new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('No inició servidor de prueba')), 12000);
    let output = '';
    processServer.stdout.setEncoding('utf8');
    processServer.stdout.on('data', chunk => {
      output += chunk;
      const matched = /Decreto Real PvP en puerto (\d+)/.exec(output);
      if (matched) { clearTimeout(timer); resolve('http://127.0.0.1:' + matched[1]); }
    });
    processServer.on('error', err => { clearTimeout(timer); reject(err); });
    processServer.on('exit', code => { clearTimeout(timer); reject(new Error('Server exit ' + code)); });
  });
});

test.afterAll(() => { if (server && !server.killed) server.kill('SIGTERM'); });

test('dos navegadores móviles completan un duelo con reconexión y resultado sincronizado', async ({ browser }) => {
  const a = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const b = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const one = await a.newPage(), two = await b.newPage();
  try {
    await one.goto(base + '/prueba');
    await expect(one.locator('#network')).toContainText('Conectado');
    await one.locator('#name').fill('Invitado Uno');
    await one.getByRole('button', { name: 'Crear sala privada' }).click();
    await expect(one.locator('#waiting')).toBeVisible();
    const code = (await one.locator('#room').innerText()).trim();
    expect(code).toMatch(/^[A-F0-9]{10}$/);

    await two.goto(base + '/prueba?sala=' + code);
    await expect(two.locator('#network')).toContainText('Conectado');
    await two.locator('#name').fill('Invitado Dos');
    await two.getByRole('button', { name: 'Unirme a una sala' }).click();
    await expect(one.locator('#duel')).toBeVisible();
    await expect(two.locator('#duel')).toBeVisible();
    await expect(one.locator('#rivalName')).toHaveText('Invitado Dos');
    await expect(two.locator('#rivalName')).toHaveText('Invitado Uno');
    await expect(one.locator('#myHp')).toHaveText('20');
    await expect(two.locator('#myHp')).toHaveText('20');
    await expect(one.locator('#rivalCards')).toContainText('Cartas rivales:');

    await two.reload();
    await expect(two.locator('#network')).toContainText('Conectado');
    await expect(two.locator('#duel')).toBeVisible();
    await expect(one.locator('#rivalInfo')).toContainText('Conectado');

    const oneTurn = (await one.locator('#turn').innerText()) === 'TU TURNO';
    const active = oneTurn ? one : two;
    const passive = oneTurn ? two : one;
    await active.locator('#end').click();
    await expect(active.locator('#turn')).toContainText('TURNO DEL RIVAL');
    await expect(passive.locator('#turn')).toHaveText('TU TURNO');

    one.on('dialog', dialog => dialog.accept());
    await one.locator('#surrender').click();
    await expect(one.locator('#result')).toHaveText('DERROTA');
    await expect(two.locator('#result')).toHaveText('¡VICTORIA!');
    await expect(one.locator('#new')).toBeVisible();
  } finally {
    await a.close();
    await b.close();
  }
});
