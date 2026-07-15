import { test, expect } from '@playwright/test';
import { BASE, disableBlockingOnboarding, closeSplashIfVisible } from './helpers';

test.describe('Static deploy smoke', () => {
  test('loads app shell and required static artifacts without backend opt-ins', async ({ page, request }) => {
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

    await page.goto(BASE);
    await closeSplashIfVisible(page);
    await expect(page).toHaveTitle(/RadShield-MX/i);
    await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible({ timeout: 15000 });

    const artifactPaths = [
      'manifest.json',
      'manual_usuario.html',
      'wasm/shielding_math.wasm',
    ];

    for (const artifactPath of artifactPaths) {
      const response = await request.get(new URL(artifactPath, BASE).toString());
      expect(response.ok(), `${artifactPath} should be served`).toBe(true);
    }

    const backendCalls = missingResponses.filter((url) => url.includes('/api/') || url.includes('/api/trpc'));
    expect(backendCalls).toHaveLength(0);
    expect(missingResponses).toHaveLength(0);
    expect(consoleErrors).toHaveLength(0);
  });
});
