import { expect, type Page } from '@playwright/test';

export const BASE = process.env.PLAYWRIGHT_TEST_BASE_URL || '/';

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
