import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f540_f544_ghost_drag');

test('F540-F544 drags equipment ghost without persistent CAD writes', async ({ page }) => {
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
  await expect(page.getByTestId('f530-f534-equipment-placement-preview')).toBeVisible();
  await expect(page.getByTestId('f540-f544-ghost-drag-gate')).toContainText(/Persistencia CAD false/i);

  await page.getByTestId('f530-preview-equipment-ghost').click();
  const ghost = page.getByTestId('f530-equipment-ghost-overlay');
  const handle = page.getByTestId('f540-equipment-ghost-drag-handle');
  await expect(ghost).toBeVisible();
  await expect(handle).toBeVisible();

  const overlayPointerEvents = await ghost.evaluate((node) => getComputedStyle(node).pointerEvents);
  expect(overlayPointerEvents).toBe('none');
  await expect(ghost).toHaveAttribute('data-f540-can-persist', 'false');

  const before = await ghost.boundingBox();
  expect(before?.width ?? 0).toBeGreaterThan(40);
  expect(before?.height ?? 0).toBeGreaterThan(40);
  if (!before) throw new Error('Missing ghost bounding box before drag');

  await page.mouse.move(before.x + before.width / 2, before.y + before.height / 2);
  await page.mouse.down();
  await page.mouse.move(before.x + before.width / 2 + 96, before.y + before.height / 2 + 54, { steps: 8 });
  await page.mouse.up();

  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F541 drag end/i);
  const after = await ghost.boundingBox();
  if (!after) throw new Error('Missing ghost bounding box after drag');
  expect(Math.abs(after.x - before.x) + Math.abs(after.y - before.y)).toBeGreaterThan(40);

  await page.getByTestId('f531-confirm-equipment-point').click();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F531 confirmado/i);
  await expect(page.getByTestId('f540-f544-ghost-drag-gate')).toContainText(/Persistencia CAD false/i);

  const screenshot = path.join(outputDir, '01_ghost_dragged.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await writeFile(
    path.join(outputDir, 'f540_f544_ghost_drag.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f540-f544.ghost-drag-qa.v1',
        status: 'ghost-drag-non-persistent-ready',
        generatedAt: new Date().toISOString(),
        screenshot,
        checks: [
          'F540 gate visible',
          'F530 ghost created',
          'overlay remains pointer-events none',
          'drag handle receives pointer events',
          'ghost moves with pointer delta',
          'F541 drag end command emitted',
          'F531 confirm keeps persistence false',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
