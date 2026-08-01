import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { BASE, bootWorkspace, closeSplashIfVisible, disableBlockingOnboarding } from './helpers';

const outputDir = path.resolve('outputs', 'f436_f438_renderer_v2_bridge');

async function capture(page: Page, name: string) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

async function bootGuided(page: Page, width: number, height: number) {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
  await page.setViewportSize({ width, height });
  if (width < 700) {
    await disableBlockingOnboarding(page);
    await page.goto(BASE);
    await closeSplashIfVisible(page);
    return;
  }
  await bootWorkspace(page);
}

test('F436-F438 desktop baseline exposes renderer v2 bridge and keeps legacy canvas alive', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 1600, 960);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
  await expect(page.getByTestId('f436-f438-renderer-v2-bridge')).toBeVisible();
  await expect(page.getByTestId('f436-visual-baseline')).toBeVisible();
  await expect(page.getByTestId('f437-pdf-evidence-live-link')).toBeVisible();
  await expect(page.getByTestId('f438-renderer-geometry-core')).toBeVisible();
  await expect(page.getByTestId('f438-feature-flag-policy')).toContainText(/VITE_CANVAS_HIGH_RISK_CAD/);

  const screenshot = await capture(page, '01_desktop_renderer_v2_bridge');
  await writeFile(
    path.join(outputDir, 'f436_f438_renderer_v2_bridge.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f436-f438.renderer-v2-bridge-ui.v1',
      status: 'renderer-v2-bridge-ui-ready',
      generatedAt: new Date().toISOString(),
      screenshot,
      checks: ['canvas', 'sidebar', 'F436 baseline', 'F437 links', 'F438 core', 'flag policy'],
    }, null, 2)}\n`,
    'utf8',
  );
});

test('F436 mobile/tablet baseline keeps canvas mounted with guarded chrome', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 390, 844);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f191-pyrate-inspired-toolbar')).toBeVisible();
  const screenshot = await capture(page, '02_mobile_canvas_guarded');
  await writeFile(
    path.join(outputDir, 'f436_mobile_baseline.md'),
    [
      '# F436 Mobile Baseline',
      '',
      `Screenshot: ${screenshot}`,
      '',
      '- Canvas mounted.',
      '- CAD toolbar visible.',
      '- BIM side panels may collapse on small viewport.',
      '',
    ].join('\n'),
    'utf8',
  );
});
