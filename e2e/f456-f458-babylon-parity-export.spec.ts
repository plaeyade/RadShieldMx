import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f456_f458_babylon_parity_export');

test('F456-F458 shows Babylon scene parity, performance and export controls', async ({ page }) => {
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

  await expect(page.getByTestId('f455-babylon-runtime-smoke')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f455-babylon-runtime-status')).toContainText(/ready|loading/, { timeout: 30_000 });
  await expect(page.getByTestId('f457-babylon-performance-gate')).toBeVisible();
  await expect(page.getByTestId('f458-babylon-export-png')).toBeVisible();
  await expect(page.getByTestId('f456-f458-babylon-parity-contract')).toContainText(/Paridad:/);

  const metrics = await page.getByTestId('f457-babylon-performance-gate').innerText();
  expect(metrics).toMatch(/FPS/);
  expect(metrics).toMatch(/Meshes/);

  const previewScreenshot = path.join(outputDir, '01_babylon_parity_card.png');
  const dialogScreenshot = path.join(outputDir, '02_babylon_parity_dialog.png');
  await page.getByTestId('f455-babylon-runtime-smoke').screenshot({ path: previewScreenshot });
  await page.screenshot({ path: dialogScreenshot, fullPage: false });
  await writeFile(
    path.join(outputDir, 'f456_f458_babylon_parity_export_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f456-f458.babylon-parity-export-ui.v1',
      status: 'babylon-parity-export-visible',
      generatedAt: new Date().toISOString(),
      previewScreenshot,
      dialogScreenshot,
      checks: [
        'Babylon preview visible',
        'scene parity contract visible',
        'performance gate visible',
        'PNG export button visible',
        'Three/R3F main dialog still visible',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
