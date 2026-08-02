import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f475_f478_unity_webgl_exported_build');

test('F475-F478 Unity WebGL exported build gate is visible and safe', async ({ page }) => {
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

  await expect(page.getByTestId('f475-f478-unity-webgl-exported-build')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f475-unity-export-folder-requirements')).toContainText(/public\/unity\/radshield-medical-3d/);
  await expect(page.getByTestId('f476-unity-iframe-shell')).toBeVisible();
  await expect(page.getByTestId('f477-unity-case-bridge')).toContainText(/medical_3d_unity_handoff/);
  await expect(page.getByTestId('f478-unity-live-gate-status')).toContainText(/external-url-ready|local-build-path-ready|export-folder-required/);
  await expect(page.getByTestId('f477-unity-export-handoff')).toBeVisible();

  const gateScreenshot = path.join(outputDir, '01_unity_webgl_exported_build_gate.png');
  const bridgeScreenshot = path.join(outputDir, '02_unity_case_bridge.png');
  await page.getByTestId('f475-f478-unity-webgl-exported-build').screenshot({ path: gateScreenshot });
  await page.getByTestId('f477-unity-case-bridge').screenshot({ path: bridgeScreenshot });
  await writeFile(
    path.join(outputDir, 'f475_f478_unity_webgl_exported_build_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f475-f478.unity-webgl-exported-build-ui.v1',
      status: 'unity-exported-build-gate-visible',
      generatedAt: new Date().toISOString(),
      screenshots: [gateScreenshot, bridgeScreenshot],
      checks: [
        'F475 exported folder requirements visible',
        'F476 iframe/new-tab shell visible',
        'F477 Unity case bridge visible',
        'F478 live gate status visible',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
