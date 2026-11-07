import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/e2e',
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:4173', browserName: 'chromium', hasTouch: true, isMobile: true, trace: 'retain-on-failure', screenshot: 'only-on-failure',
    // Optional local override when the pinned browser build is unavailable; CI installs its own.
    ...(process.env.PW_CHROMIUM_PATH ? { launchOptions: { executablePath: process.env.PW_CHROMIUM_PATH } } : {}) },
  projects: [
    { name: 'mobile-320', use: { viewport: { width: 320, height: 568 } } },
    { name: 'mobile-360', use: { viewport: { width: 360, height: 800 } } },
    { name: 'mobile-390', use: { viewport: { width: 390, height: 844 } } },
    { name: 'short-360', use: { viewport: { width: 360, height: 480 } } },
    { name: 'landscape', use: { viewport: { width: 844, height: 390 } } },
    // Escritorio con ratón (sin táctil): solo los specs de Decreto Real Studio.
    { name: 'desktop-1280', testMatch: /studio.*\.spec\.ts/, use: { viewport: { width: 1280, height: 800 }, isMobile: false, hasTouch: false } },
  ],
  webServer: [{ command: 'npm run dev -- --host 127.0.0.1 --port 4173 --strictPort', url: 'http://127.0.0.1:4173/Decreto-Real/', reuseExistingServer: !process.env.CI },
    { command: 'npm run build && npm run preview -- --host 127.0.0.1 --port 4174 --strictPort', url: 'http://127.0.0.1:4174/Decreto-Real/', reuseExistingServer: !process.env.CI }],
});
