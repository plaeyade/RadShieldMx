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

/** Carga el ejemplo «Guíame» (PET/CT) desde el menú Archivo; desde la Fase 10 la app arranca sin plano. */
export async function cargarEjemploGuiame(page: Page) {
  await page.getByTestId('f295-primary-file-dropdown').click();
  await page.getByTestId('f10-help-guiame').click();
  await page.getByTestId('guia-crear-proyecto').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-plano').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-fuentes').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-ocupacion').click();
  await page.getByTestId('guia-cerrar').click();
  await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);
}
