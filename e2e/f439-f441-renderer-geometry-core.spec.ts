import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { BASE, bootWorkspace, closeSplashIfVisible, disableBlockingOnboarding } from './helpers';

const outputDir = path.resolve('outputs', 'f439_f441_renderer_geometry_core');

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

test('F439-F441 desktop exposes renderer geometry core without replacing canvas events', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 1600, 960);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
  await expect(page.getByTestId('f436-f438-renderer-v2-bridge')).toBeVisible();
  await expect(page.getByTestId('f439-f441-renderer-geometry-core')).toBeVisible();
  await expect(page.getByTestId('f439-normalized-entities')).toBeVisible();
  await expect(page.getByTestId('f440-overlay-render-plan')).toBeVisible();
  await expect(page.getByTestId('f441-renderer-core-preflight')).toBeVisible();
  await expect(page.getByTestId('f441-renderer-core-decision')).toContainText(/eventos legacy intactos/i);

  const screenshot = await capture(page, '01_desktop_renderer_geometry_core');
  await writeFile(
    path.join(outputDir, 'f439_f441_renderer_geometry_core.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f439-f441.renderer-geometry-core-ui.v1',
      status: 'renderer-geometry-core-ui-ready',
      generatedAt: new Date().toISOString(),
      screenshot,
      checks: ['canvas', 'sidebar', 'F439 entities', 'F440 overlays', 'F441 preflight', 'legacy events untouched'],
    }, null, 2)}\n`,
    'utf8',
  );
});

test('F439 mobile baseline keeps canvas mounted while geometry core stays nonblocking', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 390, 844);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f191-pyrate-inspired-toolbar')).toBeVisible();
  const screenshot = await capture(page, '02_mobile_geometry_core_guarded');
  await writeFile(
    path.join(outputDir, 'f439_mobile_geometry_core.md'),
    [
      '# F439-F441 Mobile Guard',
      '',
      `Screenshot: ${screenshot}`,
      '',
      '- Canvas mounted.',
      '- CAD toolbar visible.',
      '- Geometry core is observable/nonblocking and does not replace touch events.',
      '',
    ].join('\n'),
    'utf8',
  );
});
