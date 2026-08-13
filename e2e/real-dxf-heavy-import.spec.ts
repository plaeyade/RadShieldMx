import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';

const realDxfPath = process.env.RADSHIELD_REAL_DXF_PATH || 'C:/Users/carlo/Desktop/ZUMAYA/plano.dxf';

async function openFileMenu(page: Page) {
  const fileButton = page.getByRole('button', { name: /Archivo/i }).first();
  await fileButton.click();
  const menu = page.locator('[role="menu"]').first();
  if (!(await menu.isVisible({ timeout: 2500 }).catch(() => false))) {
    await fileButton.click({ force: true });
  }
  await expect(menu).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('f295-primary-file-menu')).toBeVisible({ timeout: 5000 });
}

test.describe('Real DXF heavy import QA - real-dxf-heavy-import', () => {
  test('loads the ZUMAYA DXF and protects the canvas from accidental heavy apply', async ({ page }) => {
    test.skip(!fs.existsSync(realDxfPath), `Real DXF fixture not found: ${realDxfPath}`);
    test.setTimeout(180_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto('/');
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 30_000 });

    await openFileMenu(page);
    await page.getByTestId('f404-file-import-dxf').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('dxf-file-input').setInputFiles(realDxfPath);

    await expect(page.getByTestId('f213-dxf-layer-mapping-qa')).toBeVisible({ timeout: 60_000 });
    await expect(page.getByTestId('f213-dxf-barrier-layer-count')).toContainText(/Muros [1-9]/, { timeout: 30_000 });
    await expect(page.getByText(/Barreras mapeadas al canvas: 2111/i)).toBeVisible({ timeout: 30_000 });

    let confirmMessage = '';
    page.once('dialog', async (dialog) => {
      confirmMessage = dialog.message();
      await dialog.dismiss();
    });
    await page.getByTestId('dxf-apply-to-canvas').click({ force: true, timeout: 15_000 });
    expect(confirmMessage).toContain('2111 segmentos de barrera');

    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible();
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  });
});
