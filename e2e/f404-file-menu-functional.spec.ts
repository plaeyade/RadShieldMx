import { expect, test, type Page } from '@playwright/test';
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

  const buttonBox = await page.getByTestId('f295-primary-file-dropdown').boundingBox();
  const menuBox = await page.getByTestId('f295-primary-file-menu').boundingBox();
  expect(buttonBox, 'Archivo primary button has a measurable box').toBeTruthy();
  expect(menuBox, 'Archivo primary menu has a measurable box').toBeTruthy();
  if (buttonBox && menuBox) {
    expect(Math.abs(menuBox.x - buttonBox.x), 'Archivo menu must align with the primary trigger, not float to the right').toBeLessThan(32);
    expect(menuBox.y, 'Archivo menu opens below the toolbar trigger').toBeGreaterThan(buttonBox.y + buttonBox.height - 2);
  }
}

async function closeRadixDialog(page: Page, name: RegExp) {
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog', { name })).toBeHidden({ timeout: 8000 });
}

test.describe('F404 Archivo menu functional QA - f404-file-menu-functional', () => {
  test('Archivo submenu items open their real frontend surfaces', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    await openFileMenu(page);
    await page.keyboard.press('Escape');

    const radixChecks: Array<[string, RegExp]> = [
      ['f404-file-open-projects', /Administrador de Proyectos/i],
      ['f404-file-import-csv', /Importar batch CSV\/Excel/i],
      ['f404-file-import-dxf', /Visor DXF/i],
      ['f404-file-import-step', /STEP \/ IGES Native Importer/i],
      ['f404-file-export-csv', /Exportar Resultados/i],
      ['f404-file-export-cnsns', /Generar Memoria Analitica CNSNS/i],
      ['f404-file-audit-trail', /Audit Trail/i],
      ['f404-file-log-analysis', /Requerido contra instalado/i],
    ];

    for (const [itemTestId, dialogName] of radixChecks) {
      await openFileMenu(page);
      await page.getByTestId(itemTestId).click();
      await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible({ timeout: 10_000 });
      await closeRadixDialog(page, dialogName);
      await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    }

    const shellChecks: Array<[string, RegExp, string]> = [
      ['f404-file-tech-specs', /Especificaciones Tecnicas/i, 'f404-tech-specs-dialog'],
      ['f404-file-glossary', /Glosario de Terminologia/i, 'draggable-dialog-shell'],
      ['f404-file-about', /Acerca de RadShield-MX/i, 'draggable-dialog-shell'],
    ];

    for (const [itemTestId, dialogName, bodyTestId] of shellChecks) {
      await openFileMenu(page);
      await page.getByTestId(itemTestId).click();
      await expect(page.getByRole('dialog', { name: dialogName })).toBeVisible({ timeout: 10_000 });
      await expect(page.getByTestId(bodyTestId).first()).toBeVisible();
      await page.getByTestId('f376-dialog-close').click();
      await expect(page.getByRole('dialog', { name: dialogName })).toBeHidden({ timeout: 8000 });
      await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
    }
  });
});
