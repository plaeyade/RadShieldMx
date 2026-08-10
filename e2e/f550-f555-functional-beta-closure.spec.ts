import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f550_f555_beta_functional_closure');

test('F550-F555 functional beta closure shows BIM palette, gates and reversible source commit', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  await expect(page.getByTestId('f550-f555-functional-beta-closure')).toBeVisible();
  await expect(page.getByTestId('f550-f555-release-status')).toContainText(/beta-functional-gated/i);
  await expect(page.getByTestId('f551-bim-complete-palette')).toBeVisible();
  await expect(page.getByTestId('f551-palette-project-manager')).toBeVisible();
  await expect(page.getByTestId('f551-palette-tx')).toBeVisible();
  await expect(page.getByTestId('f551-palette-heatmap-high')).toBeVisible();
  await expect(page.getByTestId('f550-f555-track-three-r3f')).toContainText(/real/i);
  await expect(page.getByTestId('f550-f555-track-unity')).toContainText(/missing-assets|needs-e2e/i);
  await expect(page.getByTestId('f550-f555-rollback-policy')).toContainText(/fallback Three/i);

  const paletteScreenshot = path.join(outputDir, '01_canvas_bim_palette.png');
  await page.screenshot({ path: paletteScreenshot, fullPage: false });

  await page.getByTestId('f530-preview-equipment-ghost').click();
  await expect(page.getByTestId('f530-equipment-ghost-overlay')).toBeVisible();
  await page.getByTestId('f545-commit-ghost-source').click();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F545 fuente creada/i);
  await expect(page.getByTestId('f530-equipment-ghost-overlay')).toBeHidden();

  const sourceScreenshot = path.join(outputDir, '02_ghost_source_commit.png');
  await page.screenshot({ path: sourceScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f550_f555_functional_beta_closure.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f550-f555.functional-beta-closure-qa.v1',
        status: 'visual-beta-functional-gated',
        generatedAt: new Date().toISOString(),
        screenshots: [paletteScreenshot, sourceScreenshot],
        checks: [
          'canvas visible',
          'F550-F555 closure panel visible',
          'BIM palette visible',
          'Three/R3F remains real/fallback',
          'Unity remains gated until exported build/assets exist',
          'rollback/fallback policy visible',
          'ghost can still commit into real selected source',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
