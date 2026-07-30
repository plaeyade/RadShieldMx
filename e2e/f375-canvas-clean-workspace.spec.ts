import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.describe('F375 canvas clean workspace', () => {
  test('toggles between clean workspace and guided overlays without hiding canvas/sidebar', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      window.localStorage.removeItem('radshield_canvas_chrome_mode_f375');
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByTestId('f374-canvas-command-dock')).toBeVisible();

    const toggle = page.getByTestId('f375-clean-workspace-toggle');
    await expect(toggle).toBeVisible();
    await expect(toggle).toHaveAttribute('data-f375-canvas-mode', 'clean');
    await expect(page.getByTestId('f375-clean-guide-strip')).toBeVisible();
    await expect(page.getByTestId('f215-canvas-scene-presets')).toBeHidden();

    await toggle.click();
    await expect(toggle).toHaveAttribute('data-f375-canvas-mode', 'guided');
    await expect(page.getByTestId('f214-sketchup-canvas-reorg')).toBeVisible();
    await expect(page.getByTestId('f215-canvas-scene-presets')).toBeVisible();
    await expect(page.getByTestId('f216-mini-view-manager')).toBeVisible();
    await expect(page.getByTestId('f217-visual-export-by-scene')).toBeVisible();

    await toggle.click();
    await expect(toggle).toHaveAttribute('data-f375-canvas-mode', 'clean');
    await expect(page.getByTestId('f375-clean-guide-strip')).toBeVisible();
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
  });
});
