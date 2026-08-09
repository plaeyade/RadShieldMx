import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f535_f539_equipment_ghost_visual');

test('F535-F539 validates equipment ghost preview visually without persistent canvas writes', async ({ page }) => {
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
  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible({ timeout: 20_000 });
  await expect(canvas).toBeVisible();
  await expect(page.getByTestId('f525-f529-clinical-placement-pack')).toBeVisible();
  await expect(page.getByTestId('f530-f534-equipment-placement-preview')).toBeVisible();

  await page.getByTestId('f530-preview-equipment-ghost').click();
  const centerGhost = page.getByTestId('f530-equipment-ghost-overlay');
  await expect(centerGhost).toBeVisible();
  await expect(centerGhost).toContainText(/TX|NM|DX|CY/);
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F530 preview/i);

  const centerGhostPointerEvents = await centerGhost.evaluate((node) => getComputedStyle(node).pointerEvents);
  expect(centerGhostPointerEvents).toBe('none');
  const firstBox = await centerGhost.boundingBox();
  expect(firstBox?.width ?? 0).toBeGreaterThan(40);
  expect(firstBox?.height ?? 0).toBeGreaterThan(40);

  await canvas.click({ button: 'right', position: { x: 720, y: 420 } });
  await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
  await page.getByTestId('canvas-context-action-f530-ghost').click();
  await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
  await expect(centerGhost).toBeVisible();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F530 context/i);

  const contextBox = await centerGhost.boundingBox();
  expect(contextBox?.width ?? 0).toBeGreaterThan(40);
  expect(contextBox?.height ?? 0).toBeGreaterThan(40);
  expect(Math.abs((contextBox?.x ?? 0) - (firstBox?.x ?? 0)) + Math.abs((contextBox?.y ?? 0) - (firstBox?.y ?? 0))).toBeGreaterThan(1);

  await page.getByTestId('f531-confirm-equipment-point').click();
  await expect(centerGhost).toBeVisible();
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/F531 confirmado/i);
  await expect(page.getByTestId('f530-f534-equipment-placement-preview')).toContainText(/false/i);

  await canvas.hover({ position: { x: 500, y: 320 } });
  await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
  await page.mouse.wheel(0, -180);
  await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('zoom-view');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'zoom-view');

  const screenshot = path.join(outputDir, '01_equipment_ghost_preview.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await writeFile(
    path.join(outputDir, 'f535_f539_equipment_ghost_visual.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f535-f539.equipment-ghost-visual-qa.v1',
        status: 'equipment-ghost-visual-qa-ready',
        generatedAt: new Date().toISOString(),
        screenshot,
        checks: [
          'F525 placement panel visible',
          'F530-F534 ghost preview panel visible',
          'center preview creates ghost overlay',
          'context menu preview moves ghost overlay',
          'confirm keeps ghost non-persistent',
          'ghost overlay uses pointer-events none',
          'canvas event harness remains active after ghost preview',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
