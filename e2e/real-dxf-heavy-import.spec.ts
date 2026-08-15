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
  test('loads the ZUMAYA DXF and routes it through the lightweight review gate', async ({ page }) => {
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
    await expect(page.getByTestId('dxf-visible-barrier-layer-summary')).toContainText(/Importables: [1-9]\d*\/[1-9]\d*/);
    await expect(page.getByTestId('dxf-visible-barrier-layer-summary')).toContainText(/Entidades lineales aprox\.: [1-9]\d*/);

    await page.getByRole('button', { name: 'Nada' }).click();
    await expect(page.getByTestId('dxf-visible-barrier-layer-summary')).toContainText(/Importables: 0\/[1-9]\d*/);
    await expect(page.getByTestId('dxf-visible-barrier-layer-summary')).toContainText(/Entidades lineales aprox\.: 0/);
    await page.getByRole('button', { name: 'Muros' }).click();
    await expect(page.getByTestId('dxf-visible-barrier-layer-summary')).toContainText(/Importables: [1-9]\d*\/[1-9]\d*/);

    await page.getByTestId('dxf-apply-light-preview').click({ force: true, timeout: 15_000 });
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 30_000 });
    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await expect(page.getByRole('textbox').first()).toHaveValue('CAD plano.dxf');
    await expect(page.getByText(/DXF preliminar/i)).toBeVisible();
    await expect(page.getByTestId('statusbar-barrier-count')).toHaveText('500');
    await expect(page.getByTestId('dxf-import-review-panel')).toBeVisible();
    await expect(page.getByTestId('dxf-review-workflow-steps')).toContainText(/Calcular/);
    await expect(page.getByTestId('dxf-review-next-action')).toContainText(/Coloque o confirme fuentes/i);
    await expect(page.getByTestId('dxf-review-calculate')).toBeDisabled();
    await expect(page.getByTestId('dxf-review-evidence-source')).toContainText(/ev-dxf-import-review/);

    await page.getByTestId('dxf-review-place-clinical-sources').click();
    await expect(page.getByTestId('statusbar-source-count')).toHaveText('4');
    await expect(page.getByTestId('dxf-review-workflow-steps')).toContainText(/Fuentes/);
    await expect(page.getByTestId('dxf-review-next-action')).toContainText(/Confirme geometria/i);

    await page.getByTestId('dxf-review-confirm').click();
    await expect(page.getByText(/DXF confirmado/i)).toBeVisible({ timeout: 10_000 });
    await expect(page.getByTestId('dxf-review-calculation-status')).toContainText(/Calculado|Calculando/, { timeout: 10_000 });
    await expect(page.getByTestId('dxf-review-calculation-status')).toContainText(/Calculado/, { timeout: 90_000 });

    await page.getByTestId('dxf-review-memoria').click();
    await expect(page.getByTestId('memoria-evidence-snapshot')).toContainText(/Fuentes/);
    await expect(page.getByTestId('memoria-dxf-evidence-source')).toContainText(/reviewed|revis/i);
    await page.keyboard.press('Escape');

    await page.getByTestId('dxf-review-evidence').click();
    await expect(page.getByTestId('evidence-pack-dxf-import-source')).toContainText(/reviewed|revis/i);
    await expect(page.getByTestId('evidence-pack-calculation-snapshot')).toContainText(/Fuentes: 4/);
  });
});
