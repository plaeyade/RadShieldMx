import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f459_f463_visual_stack');

test('F459-F463 visual stack shows Unity bridge, PBR DB, Babylon visuals and WASD mode', async ({ page }) => {
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

  await expect(page.getByTestId('f459-f463-visual-stack')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f459-f460-unity-bridge-summary')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-smoke')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-status')).toContainText(/ready|loading/, { timeout: 30_000 });
  await expect(page.getByTestId('f461-photoreal-advanced-profile')).toBeVisible();
  await expect(page.getByTestId('f462-pbr-material-gallery')).toBeVisible();
  await expect(page.getByTestId('f463-wasd-visual-guide')).toBeVisible();
  await page.getByTestId('f463-update-pbr-db').click();
  await expect(page.getByTestId('f462-pbr-material-gallery')).toContainText(/TM\/NIPOLL|f461-f463/);
  await page.getByTestId('f461-photoreal-walkthrough-preset').click();
  await expect(page.getByTestId('f463-wasd-visual-guide')).toContainText(/ON/);

  const visualStackScreenshot = path.join(outputDir, '01_visual_stack_dialog.png');
  const materialsScreenshot = path.join(outputDir, '02_pbr_material_gallery.png');
  const babylonScreenshot = path.join(outputDir, '03_babylon_visual_card.png');
  await page.screenshot({ path: visualStackScreenshot, fullPage: false });
  await page.getByTestId('f462-pbr-material-gallery').screenshot({ path: materialsScreenshot });
  await page.getByTestId('f455-babylon-runtime-smoke').screenshot({ path: babylonScreenshot });
  await writeFile(
    path.join(outputDir, 'f459_f463_visual_stack_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f459-f463.visual-stack-ui.v1',
      status: 'visual-stack-visible',
      generatedAt: new Date().toISOString(),
      visualStackScreenshot,
      materialsScreenshot,
      babylonScreenshot,
      checks: [
        'Unity bridge summary visible',
        'Babylon visual preview visible',
        'Photoreal profile visible',
        'PBR material DB gallery visible and updateable',
        'WASD walkthrough preset visible and enabled',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
