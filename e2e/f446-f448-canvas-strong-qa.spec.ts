import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f446_f448_canvas_strong_qa');

test('F446-F448 validates canvas surfaces, right click, quick actions and nonblocking renderer overlay', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  await expect(page.getByTestId('f374-canvas-command-dock')).toBeVisible();
  await expect(page.getByTestId('f442-f445-renderer-v2-overlay-canvas')).toBeVisible();
  await expect(page.getByTestId('f446-f448-canvas-strong-qa')).toBeVisible();
  await expect(page.getByTestId('f446-surface-checks')).toBeVisible();
  await expect(page.getByTestId('f447-interaction-checks')).toBeVisible();
  await expect(page.getByTestId('f448-regression-gates')).toBeVisible();
  const canvas = page.getByTestId('f100-main-floorplan-canvas');

  const overlayPointerEvents = await page
    .getByTestId('f442-f445-renderer-v2-overlay-canvas')
    .evaluate((node) => getComputedStyle(node).pointerEvents);
  expect(overlayPointerEvents).toBe('none');

  const initialF515bAction = await canvas.evaluate((node) => node.getAttribute('data-f515b-last-event-action'));
  expect(initialF515bAction).toBe('stable');
  await canvas.hover({ position: { x: 500, y: 320 } });
  await page.mouse.wheel(0, -240);
  await page.keyboard.down(process.platform === 'darwin' ? 'Meta' : 'Control');
  await page.mouse.wheel(0, -240);
  await page.keyboard.up(process.platform === 'darwin' ? 'Meta' : 'Control');
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('zoom-view');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'zoom-view');

  await page.getByTestId('f374-command-barrier').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/barrera/i);
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/Dibujar barrera/i);

  await page.getByTestId('f374-command-source').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/fuente/i);
  await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/Colocar equipo\/fuente/i);
  await expect(page.getByTestId('f376-source-selector-window')).toBeVisible();
  await expect(page.getByTestId('f376-source-selector-close')).toBeVisible();
  await page.getByTestId('f376-source-selector-close').click();
  await expect(page.getByTestId('f376-source-selector-window')).toBeHidden();
  await page.getByTestId('f375-clean-workspace-toggle').click();
  await expect(page.getByTestId('f375-clean-guide-strip')).toBeVisible();

  await canvas.click({ button: 'right', position: { x: 640, y: 360 } });
  await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
  await expect(page.getByTestId('canvas-context-action-barrier')).toBeVisible();
  await expect(page.getByTestId('canvas-context-action-calc')).toBeVisible();
  await page.getByTestId('canvas-context-action-measure').click();
  await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/medir|cota|measure/i);
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('activate-tool');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'activate-tool');

  await canvas.click({ button: 'right', position: { x: 700, y: 390 } });
  await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
  await page.getByTestId('canvas-context-action-fit').click();
  await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('fit-view');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'fit-view');

  await canvas.click({ button: 'right', position: { x: 730, y: 420 } });
  await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
  await page.getByTestId('canvas-context-action-export').click();
  await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('export-png');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'export-png');

  await canvas.click({ button: 'right', position: { x: 760, y: 450 } });
  await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
  await page.getByTestId('canvas-context-action-evidence').click();
  await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
  await expect(page.getByTestId('f515b-canvas-event-action')).toContainText('open-evidence');
  await expect(canvas).toHaveAttribute('data-f515b-last-event-action', 'open-evidence');
  await page.keyboard.press('Escape');

  const screenshot = path.join(outputDir, '01_canvas_strong_qa.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await writeFile(
    path.join(outputDir, 'f446_f448_canvas_strong_qa.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f446-f448.canvas-strong-qa-ui.v1',
      status: 'canvas-strong-qa-ui-ready',
      generatedAt: new Date().toISOString(),
      screenshot,
      checks: [
        'sidebar visible',
        'canvas visible',
        'command dock actions',
        'right click menu actions',
        'renderer overlay pointer-events none',
        'F446-F448 QA panel visible',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
