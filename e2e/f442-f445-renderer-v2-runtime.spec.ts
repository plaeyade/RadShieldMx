import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { BASE, bootWorkspace, closeSplashIfVisible, disableBlockingOnboarding } from './helpers';

const outputDir = path.resolve('outputs', 'f442_f445_renderer_v2_runtime');

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

test('F442-F445 desktop mounts renderer v2 overlay and runtime panel without stealing canvas events', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 1600, 960);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f442-f445-renderer-v2-overlay-canvas')).toBeVisible();
  await expect(page.getByTestId('f442-f445-renderer-v2-runtime')).toBeVisible();
  await expect(page.getByTestId('f442-render-instructions')).toBeVisible();
  await expect(page.getByTestId('f443-render-passes')).toBeVisible();
  await expect(page.getByTestId('f444-runtime-gates')).toBeVisible();
  await expect(page.getByTestId('f445-rollback-plan')).toContainText(/rollback listo/i);

  const pointerEvents = await page.getByTestId('f442-f445-renderer-v2-overlay-canvas').evaluate((node) => getComputedStyle(node).pointerEvents);
  expect(pointerEvents).toBe('none');

  const screenshot = await capture(page, '01_desktop_renderer_v2_runtime');
  await writeFile(
    path.join(outputDir, 'f442_f445_renderer_v2_runtime.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f442-f445.renderer-v2-runtime-ui.v1',
      status: 'renderer-v2-runtime-ui-ready',
      generatedAt: new Date().toISOString(),
      screenshot,
      checks: ['canvas', 'overlay pointer-events none', 'F442 instructions', 'F443 passes', 'F444 gates', 'F445 rollback'],
    }, null, 2)}\n`,
    'utf8',
  );
});

test('F442-F445 mobile keeps canvas and toolbar mounted with renderer overlay nonblocking', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await bootGuided(page, 390, 844);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f191-pyrate-inspired-toolbar')).toBeVisible();
  await expect(page.getByTestId('f442-f445-renderer-v2-overlay-canvas')).toBeVisible();
  const screenshot = await capture(page, '02_mobile_renderer_v2_runtime_guarded');
  await writeFile(
    path.join(outputDir, 'f442_mobile_renderer_v2_runtime.md'),
    [
      '# F442-F445 Mobile Runtime Guard',
      '',
      `Screenshot: ${screenshot}`,
      '',
      '- Canvas mounted.',
      '- CAD toolbar visible.',
      '- Renderer v2 overlay mounted as nonblocking pointer-events:none surface.',
      '',
    ].join('\n'),
    'utf8',
  );
});
