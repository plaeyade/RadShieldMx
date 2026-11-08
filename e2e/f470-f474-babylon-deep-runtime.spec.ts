import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f470_f474_babylon_deep_runtime');


// Fase 1 motor de dosis: la vista previa Babylon está detrás de VISOR_3D_BABYLON (apagada por omisión).
// Esta prueba sólo aplica a un build con VITE_VISOR_3D_BABYLON=true; ejecutarla con E2E_VISOR_3D_BABYLON=1.
const VISOR_3D_BABYLON = process.env.E2E_VISOR_3D_BABYLON === '1';
test.skip(!VISOR_3D_BABYLON, 'Babylon desactivado (featureFlags.VISOR_3D_BABYLON); ver docs/plan-motores-calculo.md');

test('F470-F474 Babylon deep runtime exposes interactive scene controls', async ({ page }) => {
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
  await expect(page.getByTestId('f470-f474-babylon-deep-runtime')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f471-babylon-pick-hud')).toContainText(/Seleccione|HUD/);
  await expect(page.getByTestId('f472-babylon-camera-modes')).toBeVisible();
  await expect(page.getByTestId('f473-babylon-overlays')).toContainText(/barrier-role-bands/);

  await page.getByTestId('f472-babylon-camera-top').click();
  await expect(page.getByTestId('f472-babylon-camera-top')).toBeVisible();
  await page.getByTestId('f472-babylon-camera-front').click();
  await page.getByTestId('f472-babylon-camera-iso').click();

  const previewScreenshot = path.join(outputDir, '01_babylon_deep_runtime.png');
  const hudScreenshot = path.join(outputDir, '02_babylon_pick_hud.png');
  const cameraScreenshot = path.join(outputDir, '03_babylon_camera_modes.png');
  await page.getByTestId('f455-babylon-runtime-smoke').screenshot({ path: previewScreenshot });
  await page.getByTestId('f471-babylon-pick-hud').screenshot({ path: hudScreenshot });
  await page.getByTestId('f472-babylon-camera-modes').screenshot({ path: cameraScreenshot });
  await writeFile(
    path.join(outputDir, 'f470_f474_babylon_deep_runtime_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f470-f474.babylon-deep-runtime-ui.v1',
      status: 'babylon-deep-visible',
      generatedAt: new Date().toISOString(),
      screenshots: [previewScreenshot, hudScreenshot, cameraScreenshot],
      checks: [
        'F470 deep runtime panel visible',
        'F471 picking HUD visible',
        'F472 camera modes clickable',
        'F473 overlay registry visible',
        'F474 screenshot evidence generated',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
