import { defineConfig, devices } from '@playwright/test';

const useManagedWebServer = process.env.PLAYWRIGHT_NO_WEBSERVER !== '1';
// Con `webServer.port`, Playwright reescribe PLAYWRIGHT_TEST_BASE_URL en los workers a http://localhost:<puerto>, sin la
// base de Pages: las specs acababan en la raíz del preview (manifest.json daba 404 en static-deploy.spec.ts). Con el
// servidor propio la URL se arma con VITE_BASE_PATH (/RadShieldMx/ en el CI), igual que el sitio publicado.
const baseURL = useManagedWebServer
  ? `http://127.0.0.1:4174${process.env.VITE_BASE_PATH?.startsWith('/') ? process.env.VITE_BASE_PATH : '/'}`
  : process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4174';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: 'list',
  use: {
    baseURL,
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },
  projects: [
    { name: 'chromium', use: { ...devices['Desktop Chrome'], channel: 'chrome' } },
    { name: 'firefox', use: { ...devices['Desktop Firefox'] } },
  ],
  ...(useManagedWebServer ? {
    webServer: {
      command: 'node ./node_modules/vite/bin/vite.js preview --configLoader runner --host 127.0.0.1 --port 4174',
      port: 4174,
      reuseExistingServer: !process.env.CI,
    },
  } : {}),
});
