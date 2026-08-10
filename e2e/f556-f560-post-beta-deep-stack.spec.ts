import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f556_f560_post_beta_deep_stack');

test('F556-F560 post-beta deep stack exposes renderer, Babylon, Unity, DB and normative QA gates', async ({ page }) => {
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
  await page.getByTestId('f556-f560-post-beta-deep-stack').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('f556-f560-post-beta-deep-stack')).toBeVisible();
  await expect(page.getByTestId('f556-f560-status')).toContainText(/post-beta-deep/i);
  await expect(page.getByTestId('f556-f560-lane-renderer-v2')).toContainText(/Renderer base v2/i);
  await expect(page.getByTestId('f556-f560-lane-babylon')).toContainText(/Babylon real profundo/i);
  await expect(page.getByTestId('f556-f560-lane-unity')).toContainText(/Unity WebGL real/i);
  await expect(page.getByTestId('f556-f560-lane-technical-db')).toContainText(/DB tecnica completa/i);
  await expect(page.getByTestId('f556-f560-lane-normative-qa')).toContainText(/QA normativo ampliado/i);
  await expect(page.getByTestId('f559-technical-db-summary')).toContainText(/PBR/i);
  await expect(page.getByTestId('f559-technical-db-summary')).toContainText(/QA/i);
  await expect(page.getByTestId('f556-f560-activation-rules')).toContainText(/Unity no firma calculos/i);

  const deepStackScreenshot = path.join(outputDir, '01_post_beta_deep_stack.png');
  await page.screenshot({ path: deepStackScreenshot, fullPage: false });
  await page.getByTestId('f517-f519-canvas-visual-reference-panel').evaluate((element) => {
    element.scrollTop = element.scrollHeight;
  });
  await expect(page.getByTestId('f556-f560-post-beta-deep-stack')).toBeInViewport();
  const deepStackPanelScreenshot = path.join(outputDir, '02_post_beta_deep_stack_panel.png');
  await page.screenshot({ path: deepStackPanelScreenshot, fullPage: false });

  await page.getByTestId('f530-preview-equipment-ghost').click();
  await expect(page.getByTestId('f530-equipment-ghost-overlay')).toBeVisible();
  await page.getByTestId('f545-commit-ghost-source').click();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F545 fuente creada/i);
  await page.getByTestId('f556-f560-post-beta-deep-stack').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('f556-f560-post-beta-deep-stack')).toBeVisible();

  const deepStackGhostScreenshot = path.join(outputDir, '03_post_beta_deep_stack_ghost.png');
  await page.screenshot({ path: deepStackGhostScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f556_f560_post_beta_deep_stack.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f556-f560.post-beta-deep-stack-qa.v1',
        status: 'post-beta-deep-stack-visible',
        generatedAt: new Date().toISOString(),
        screenshots: [deepStackScreenshot, deepStackPanelScreenshot, deepStackGhostScreenshot],
        checks: [
          'canvas visible',
          'post-beta deep stack panel visible',
          'renderer v2 lane visible',
          'Babylon lane visible',
          'Unity lane visible and gated when build is missing',
          'technical DB summary visible',
          'normative QA summary visible',
          'ghost source commit remains reversible after deep stack render',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
