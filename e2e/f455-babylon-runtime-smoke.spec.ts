import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f455_babylon_runtime_smoke');

test('F455 opens Medical 3D and renders Babylon runtime smoke preview', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('e2e-open-medical-3d').click();

  await expect(page.getByTestId('f307-f309-render-engine-selector')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f455-babylon-runtime-smoke')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-canvas')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-status')).toContainText(/ready|loading/, { timeout: 30_000 });

  const cardBox = await page.getByTestId('f455-babylon-runtime-smoke').evaluate((node) => {
    const box = (node as HTMLElement).getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  });
  expect(cardBox.width).toBeGreaterThan(180);
  expect(cardBox.height).toBeGreaterThan(120);

  const screenshot = path.join(outputDir, '01_babylon_runtime_smoke_dialog.png');
  const previewScreenshot = path.join(outputDir, '02_babylon_runtime_smoke_card.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.getByTestId('f455-babylon-runtime-smoke').screenshot({ path: previewScreenshot });
  await writeFile(
    path.join(outputDir, 'f455_babylon_runtime_smoke_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f455.babylon-runtime-smoke-ui.v1',
      status: 'babylon-runtime-smoke-visible',
      generatedAt: new Date().toISOString(),
      screenshot,
      previewScreenshot,
      checks: [
        'main canvas remains visible',
        'Medical 3D dialog opens',
        'Babylon smoke card visible',
        'Babylon runtime canvas visible',
        'visual screenshot captured',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
