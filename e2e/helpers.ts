import { expect, type Page } from '@playwright/test';

// Igual que `baseURL` en playwright.config.ts: con el servidor propio, PLAYWRIGHT_TEST_BASE_URL llega reescrito a
// http://localhost:<puerto> (sin /RadShieldMx/), así que la URL se arma con VITE_BASE_PATH.
export const BASE = process.env.PLAYWRIGHT_NO_WEBSERVER === '1'
  ? process.env.PLAYWRIGHT_TEST_BASE_URL || '/'
  : `http://127.0.0.1:4174${process.env.VITE_BASE_PATH?.startsWith('/') ? process.env.VITE_BASE_PATH : '/'}`;

export async function disableBlockingOnboarding(page: Page) {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_mosaic', '1');
  });
}

export async function closeSplashIfVisible(page: Page) {
  const continueButton = page.getByRole('button', { name: /Continuar/i });
  if (await continueButton.isVisible({ timeout: 6000 }).catch(() => false)) {
    await continueButton.click();
  }
}

export async function bootWorkspace(page: Page) {
  await disableBlockingOnboarding(page);
  await page.goto(BASE);
  await closeSplashIfVisible(page);
  await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible({ timeout: 15000 });
}
