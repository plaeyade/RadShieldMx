import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';
import { bootWorkspace } from './helpers';

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

test.describe('DXF import to canvas - dxf-import-to-canvas', () => {
  test('Archivo > Importar DXF loads a fixture and applies mapped barriers to the canvas', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();

    await openFileMenu(page);
    await page.getByTestId('f404-file-import-dxf').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible({ timeout: 10_000 });

    const fixturePath = path.resolve('e2e/fixtures/sample-floorplan.dxf');
    await page.getByTestId('dxf-file-input').setInputFiles(fixturePath);

    await expect(page.getByTestId('f213-dxf-layer-mapping-qa')).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('f213-dxf-barrier-layer-count')).toContainText(/Muros [1-9]/);
    await expect(page.getByText(/Barreras mapeadas al canvas: 4/i)).toBeVisible();

    await page.getByTestId('dxf-apply-to-canvas').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 10_000 });
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByRole('textbox').first()).toHaveValue('CAD sample-floorplan.dxf');
    await expect(page.getByTestId('statusbar-barrier-count')).toHaveText('4');
    await expect(page.getByText(/DXF 1 \(WALL_PRIMARY_CONCRETE_300MM\)/i)).toBeVisible();
  });

  test('Archivo > Importar DXF can apply a lightweight preview to the canvas', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await openFileMenu(page);
    await page.getByTestId('f404-file-import-dxf').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible({ timeout: 10_000 });

    const fixturePath = path.resolve('e2e/fixtures/sample-floorplan.dxf');
    await page.getByTestId('dxf-file-input').setInputFiles(fixturePath);

    await expect(page.getByTestId('dxf-import-impact-preview')).toBeVisible({ timeout: 10_000 });
    await page.getByTestId('dxf-apply-light-preview').click();

    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 10_000 });
    await expect(page.getByRole('textbox').first()).toHaveValue('CAD sample-floorplan.dxf');
    await expect(page.getByTestId('statusbar-barrier-count')).toHaveText('4');
    await expect(page.getByText(/DXF preliminar/i)).toBeVisible();
    await expect(page.getByTestId('dxf-import-review-panel')).toBeVisible();
    await expect(page.getByTestId('dxf-review-evidence-source')).toContainText(/ev-dxf-import-review/);
    await expect(page.getByTestId('dxf-review-evidence-source')).toContainText(/draft/);
    await page.getByTestId('dxf-review-confirm').click();
    await expect(page.getByText(/DXF confirmado/i)).toBeVisible();
    await expect(page.getByText(/DXF preliminar/i)).toBeHidden();
    await page.getByTestId('statusbar-open-dxf-review').click();
    await expect(page.getByTestId('dxf-import-review-panel')).toBeVisible();
    await expect(page.getByTestId('dxf-review-evidence-source')).toContainText(/reviewed/);
    await page.getByTestId('dxf-review-evidence').click();
    await expect(page.getByTestId('evidence-pack-dxf-import-source')).toContainText(/reviewed/);
    await expect(page.getByTestId('evidence-pack-dxf-source-card')).toContainText(/CAD\/DXF/);
  });
});
