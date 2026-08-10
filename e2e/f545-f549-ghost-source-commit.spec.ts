import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f545_f549_ghost_source_commit');

test('F545-F549 commits dragged equipment ghost into a real selected source', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('f545-f549-ghost-source-commit-gate')).toContainText(/Crear fuente activo/i);

  await page.getByTestId('f530-preview-equipment-ghost').click();
  const ghost = page.getByTestId('f530-equipment-ghost-overlay');
  const handle = page.getByTestId('f540-equipment-ghost-drag-handle');
  await expect(ghost).toBeVisible();

  const before = await ghost.boundingBox();
  if (!before) throw new Error('Missing ghost bounding box before commit');
  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 78, before.y + before.height / 2 + 36, { steps: 6 });
  await page.mouse.up();
  await expect(handle).toBeVisible();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F541 drag end/i);

  await page.getByTestId('f545-commit-ghost-source').click();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F545 fuente creada/i);
  await expect(ghost).toBeHidden();
  await expect(page.getByText(/Ultimo: F545 fuente creada/i)).toBeVisible();

  const screenshot = path.join(outputDir, '01_source_committed_from_ghost.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await writeFile(
    path.join(outputDir, 'f545_f549_ghost_source_commit.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f545-f549.ghost-source-commit-qa.v1',
        status: 'source-committed-from-ghost-ready',
        generatedAt: new Date().toISOString(),
        screenshot,
        checks: [
          'F545 commit gate visible',
          'ghost preview visible before commit',
          'ghost drag completed',
          'Crear fuente executes',
          'ghost is cleared after commit',
          'canvas command reports F545 fuente creada',
          'canvas visual status reports the committed source',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
