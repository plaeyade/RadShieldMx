import { test, expect } from '@playwright/test';
import { disableBlockingOnboarding, closeSplashIfVisible } from './helpers';

test.describe('Static deploy smoke', () => {
  test('loads app shell and required static artifacts without backend opt-ins', async ({ page, request, baseURL }) => {
    const consoleErrors: string[] = [];
    const missingResponses: string[] = [];

    await disableBlockingOnboarding(page);

    page.on('console', (msg) => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (text.includes('frame-ancestors') && text.includes('<meta>')) return;
      consoleErrors.push(text);
    });

    page.on('response', (response) => {
      if (response.status() === 404) missingResponses.push(response.url());
    });

    // El baseURL del proyecto ya incluye la base de Pages (/RadShieldMx/ en el CI; ver playwright.config.ts).
    const base = baseURL ?? 'http://127.0.0.1:4174/';
    await page.goto('./', { waitUntil: 'networkidle' });
    await closeSplashIfVisible(page);
    await expect(page).toHaveTitle(/RadShield-MX/i);
    await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible({ timeout: 15000 });

    const artifactPaths = [
      'manifest.json',
      'manual_usuario.html',
    ];

    for (const artifactPath of artifactPaths) {
      const response = await request.get(new URL(artifactPath, base).toString());
      expect(response.ok(), `${artifactPath} should be served (${response.status()} ${response.url()})`).toBe(true);
    }

    const backendCalls = missingResponses.filter((url) => url.includes('/api/') || url.includes('/api/trpc'));
    expect(backendCalls).toHaveLength(0);
    expect(missingResponses).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
  });
});
