import { expect, test, type Page } from '@playwright/test';
import fs from 'node:fs';
import { bootWorkspace } from './helpers';

const DWG_FIXTURE = process.env.RADSHIELD_DWG_FIXTURE_PATH || 'C:/Users/carlo/Downloads/0760030003b.dwg';

async function openFileMenu(page: Page) {
  const fileButton = page.getByRole('button', { name: /Archivo/i }).first();
  await fileButton.click();
  const menu = page.locator('[role="menu"]').first();
  if (!(await menu.isVisible({ timeout: 2500 }).catch(() => false))) {
    await fileButton.click({ force: true });
  }
  await expect(menu).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('f295-primary-file-menu')).toBeVisible({ timeout: 5000 });
  await expect(page.getByTestId('f114-deduped-legacy-menu-zone')).toBeHidden();
}

test.describe('DWG safe import boundary - dwg-safe-import', () => {
  test('Archivo > Importar DXF detects a real DWG fixture and keeps canvas geometry unchanged', async ({ page }) => {
    test.skip(!fs.existsSync(DWG_FIXTURE), `DWG fixture not found: ${DWG_FIXTURE}`);
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    const beforeBarriers = await page.getByTestId('statusbar-barrier-count').innerText();

    await openFileMenu(page);
    await page.getByTestId('f404-file-import-dxf').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible({ timeout: 10_000 });

    await page.getByTestId('dxf-file-input').setInputFiles(DWG_FIXTURE);
    await expect(page.getByTestId('dwg-conversion-notice')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('dwg-signature-status')).toContainText(/Firma DWG valida/i);
    await expect(page.getByTestId('dwg-conversion-route')).toContainText(/DWG -> APS\/ODA\/AutoCAD -> DXF/i);
    await expect(page.getByTestId('dxf-apply-to-canvas')).toBeDisabled();
    await expect(page.getByTestId('statusbar-barrier-count')).toHaveText(beforeBarriers);
  });
});
