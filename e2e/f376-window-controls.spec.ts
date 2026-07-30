import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.describe('F376 floating window controls', () => {
  test('source selector can minimize, pass clicks to canvas dock, restore and close', async ({ page }) => {
    test.setTimeout(90_000);
    await page.addInitScript(() => {
      window.localStorage.setItem('radshield_canvas_chrome_mode_f375', 'clean');
    });
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByTestId('f374-canvas-command-dock')).toBeVisible();

    await page.getByTestId('f374-command-source').click();
    await expect(page.getByTestId('f376-source-selector-window')).toBeVisible();
    await expect(page.getByTestId('f376-source-selector-close')).toBeVisible();

    await page.getByTestId('f376-source-selector-minimize').click();
    await expect(page.getByTestId('f376-source-selector-overlay')).toHaveAttribute('data-f376-source-pass-through', 'true');
    await expect(page.getByTestId('f376-source-selector-minimized')).toBeVisible();

    await page.getByTestId('f374-command-region').click();
    await expect(page.getByTestId('f376-source-selector-minimized')).toBeVisible();

    await page.getByTestId('f376-source-selector-minimized').click();
    await expect(page.getByTestId('f376-source-selector-overlay')).toHaveAttribute('data-f376-source-pass-through', 'false');

    await page.getByTestId('f376-source-selector-expand').click();
    await expect(page.getByTestId('f376-source-selector-window')).toHaveAttribute('data-f376-source-maximized', 'true');

    await page.getByTestId('f376-source-selector-close').click();
    await expect(page.getByTestId('f376-source-selector-window')).toBeHidden();
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  });
});
