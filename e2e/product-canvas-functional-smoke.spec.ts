import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.describe('Product canvas functional smoke', () => {
  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.addInitScript(() => {
      localStorage.setItem('radshield_canvas_chrome_mode_f375', 'clean');
      localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    });
    await bootWorkspace(page);
  });

  test('keeps visible canvas actions wired to real handlers', async ({ page }) => {
    test.setTimeout(60_000);
    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
    await expect(page.getByTestId('f191-pyrate-inspired-toolbar')).toBeVisible();
    await expect(page.getByTestId('f374-canvas-command-dock')).toBeVisible();
    await expect(canvas).toBeVisible();

    const box = await canvas.boundingBox();
    expect(box?.width ?? 0).toBeGreaterThan(700);
    expect(box?.height ?? 0).toBeGreaterThan(380);

    await page.getByTestId('f374-command-barrier').click();
    await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/barrera/i);
    await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/Dibujar barrera/i);

    await canvas.click({ button: 'right', position: { x: 420, y: 280 } });
    await expect(page.getByTestId('canvas-context-menu')).toBeVisible();
    await page.getByTestId('canvas-context-action-source').click();
    await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/fuente/i);
    await expect(page.getByTestId('canvas-context-menu')).toBeHidden();

    await canvas.click({ button: 'right', position: { x: 460, y: 300 } });
    const download = page.waitForEvent('download');
    await page.getByTestId('canvas-context-action-export').click();
    await expect(page.getByTestId('canvas-context-menu')).toBeHidden();
    await expect((await download).suggestedFilename()).toMatch(/radshield.*\.png/i);

    await canvas.click({ button: 'right', position: { x: 500, y: 320 } });
    await page.getByTestId('canvas-context-action-evidence').click();
    await expect(page.getByRole('heading', { name: /Evidence Pack/i }).first()).toBeVisible({ timeout: 15_000 });
  });
});
