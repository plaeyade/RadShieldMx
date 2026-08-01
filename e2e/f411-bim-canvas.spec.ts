import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f411_bim_canvas');

async function capture(page: Page, name: string) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
});

test('F411 BIM canvas studio surfaces are visible and connected', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f411-bim-ribbon')).toBeVisible();
  await expect(page.getByTestId('f411-bim-project-manager')).toBeVisible();
  await expect(page.getByTestId('f411-bim-details')).toBeVisible();
  await expect(page.getByTestId('f411-bim-layers')).toBeVisible();
  await expect(page.getByTestId('f411-bim-navigation-rail')).toBeVisible();
  await expect(page.getByTestId('f411-bim-methodology-card')).toBeVisible();
  await expect(page.getByTestId('f412-bim-entity-catalog')).toBeVisible();
  await expect(page.getByTestId('f412-bim-rs-parameters')).toBeVisible();
  await expect(page.getByTestId('f412-bim-roundtrip-gates')).toBeVisible();
  await expect(page.getByTestId('f413-bim-execution-plan')).toBeVisible();
  await expect(page.getByTestId('f411-bim-command-line')).toBeVisible();

  await page.getByTestId('f411-bim-ribbon-shielding').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/Barrera|Muro/i);
  await page.getByTestId('f411-bim-ribbon-equipment').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/Fuente/i);

  const screenshot = await capture(page, '01_bim_canvas_studio');
  const output = {
    schema: 'radshield-mx.f411.bim-canvas-ui.v1',
    phase: 'F411',
    status: 'bim-canvas-ui-ready',
    generatedAt: new Date().toISOString(),
    screenshot,
    surfaces: [
      'f411-bim-ribbon',
      'f411-bim-project-manager',
      'f411-bim-details',
      'f411-bim-layers',
      'f411-bim-navigation-rail',
      'f411-bim-methodology-card',
      'f412-bim-entity-catalog',
      'f412-bim-rs-parameters',
      'f412-bim-roundtrip-gates',
      'f413-bim-execution-plan',
      'f411-bim-command-line',
    ],
  };

  await writeFile(path.join(outputDir, 'f411_bim_canvas_ui.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await writeFile(
    path.join(outputDir, 'f411_bim_canvas_ui.md'),
    [
      '# F411 BIM Canvas UI',
      '',
      `Status: ${output.status}`,
      `Screenshot: ${screenshot}`,
      '',
      '## Surfaces',
      ...output.surfaces.map((surface) => `- OK ${surface}`),
      '',
    ].join('\n'),
    'utf8',
  );
});
