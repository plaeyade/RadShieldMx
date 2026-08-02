import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f464_f468_visual_beta');

test('F464-F468 visual beta exposes QA, materials, canvas sync, Memoria evidence and RC gate', async ({ page }) => {
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

  await expect(page.getByTestId('f464-f468-visual-beta')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('f463-update-pbr-db').click();
  await page.getByTestId('f461-photoreal-walkthrough-preset').click();
  await expect(page.getByTestId('f464-f468-visual-beta')).toContainText(/beta-visual-ready|beta-visual-review/);
  await expect(page.getByTestId('f465-material-technical-links')).toBeVisible();
  await expect(page.getByTestId('f465-material-technical-links')).toContainText(/kg\/m2/);
  await expect(page.getByTestId('f466-canvas-3d-sync-map')).toBeVisible();
  await expect(page.getByTestId('f466-canvas-3d-sync-map')).toContainText(/barrier:|source:|region:/);
  await expect(page.getByTestId('f467-memoria-visual-evidence')).toBeVisible();
  await expect(page.getByTestId('f468-export-visual-beta-pack')).toBeVisible();

  const betaGateScreenshot = path.join(outputDir, '01_visual_beta_gate.png');
  const materialLinksScreenshot = path.join(outputDir, '02_material_links.png');
  const syncScreenshot = path.join(outputDir, '03_canvas_3d_sync.png');
  const memoriaScreenshot = path.join(outputDir, '04_memoria_visual_evidence.png');
  await page.getByTestId('f464-f468-visual-beta').screenshot({ path: betaGateScreenshot });
  await page.getByTestId('f465-material-technical-links').screenshot({ path: materialLinksScreenshot });
  await page.getByTestId('f466-canvas-3d-sync-map').screenshot({ path: syncScreenshot });
  await page.getByTestId('f467-memoria-visual-evidence').screenshot({ path: memoriaScreenshot });
  await writeFile(
    path.join(outputDir, 'f464_f468_visual_beta_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f464-f468.visual-beta-ui.v1',
      status: 'visual-beta-visible',
      generatedAt: new Date().toISOString(),
      screenshots: [betaGateScreenshot, materialLinksScreenshot, syncScreenshot, memoriaScreenshot],
      checks: [
        'F464 QA visual beta gate visible',
        'F465 material technical links visible',
        'F466 canvas/3D sync map visible',
        'F467 Memoria visual evidence section visible',
        'F468 export beta pack command visible',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
