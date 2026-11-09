import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: '.',
  testMatch: 'preview.browser.spec.mjs',
  workers: 1,
  retries: 1,
  timeout: 30000,
  use: { browserName: 'chromium', headless: true },
  reporter: 'list',
});
