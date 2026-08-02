import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f479_f483_advanced_photoreal_pack');

test('F479-F483 advanced photoreal pack is visible and exportable', async ({ page }) => {
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
  await expect(page.getByTestId('f479-f483-advanced-photoreal-pack')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f479-photoreal-texture-plan')).toContainText(/Concreto alta densidad|Asset root/);
  await expect(page.getByTestId('f480-photoreal-hdri-plan')).toContainText(/clinical_softbox/);
  await expect(page.getByTestId('f481-photoreal-decal-plan')).toContainText(/Radiacion|penetracion|Footprint/);
  await expect(page.getByTestId('f482-photoreal-render-presets')).toContainText(/Inspeccion|Cinematico/);
  await expect(page.getByTestId('f483-export-photoreal-pack')).toBeVisible();
  await page.getByTestId('f461-photoreal-walkthrough-preset').click();

  const panelScreenshot = path.join(outputDir, '01_advanced_photoreal_pack.png');
  const presetsScreenshot = path.join(outputDir, '02_render_presets.png');
  await page.getByTestId('f479-f483-advanced-photoreal-pack').screenshot({ path: panelScreenshot });
  await page.getByTestId('f482-photoreal-render-presets').screenshot({ path: presetsScreenshot });
  await writeFile(
    path.join(outputDir, 'f479_f483_advanced_photoreal_pack_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f479-f483.advanced-photoreal-pack-ui.v1',
      status: 'advanced-photoreal-pack-visible',
      generatedAt: new Date().toISOString(),
      screenshots: [panelScreenshot, presetsScreenshot],
      checks: [
        'F479 texture plan visible',
        'F480 HDRI plan visible',
        'F481 decal plan visible',
        'F482 render presets visible',
        'F483 export command visible',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
