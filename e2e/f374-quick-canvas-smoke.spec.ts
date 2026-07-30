import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.describe('F374 quick actions and canvas command dock', () => {
  test('executes visible quick actions and canvas dock commands', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByTestId('f374-canvas-command-dock')).toBeVisible();

    const quickStatus = page.getByTestId('f374-quick-action-status');
    await expect(quickStatus).toBeVisible();
    await page.getByRole('button', { name: /Calc: Calcular blindaje/i }).click();
    await expect(quickStatus).toContainText(/Calcular blindaje/i);

    await page.getByTestId('f374-command-barrier').click();
    await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/barrera/i);

    await page.getByTestId('f374-command-region').click();
    await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/zona|region/i);

    await page.getByTestId('f374-command-source').click();
    await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/fuente/i);
    await expect(page.getByTestId('f374-canvas-command-status')).toContainText(/Colocar equipo\/fuente/i);
  });
});
