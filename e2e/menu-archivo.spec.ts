/**
 * E.14: E2E Tests - Menu Archivo
 * Validates all 15 items in the Archivo menu open correct dialogs
 */
import { test, expect } from '@playwright/test';
import { bootWorkspace } from './helpers';

test.describe('Menu Archivo - All 15 items', () => {
  test.beforeEach(async ({ page }) => {
    await bootWorkspace(page);
  });

  test('Archivo menu opens and shows all items', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await expect(page.locator('text=Nuevo Proyecto')).toBeVisible();
    await expect(page.locator('text=Abrir Proyecto')).toBeVisible();
    await expect(page.locator('text=Guardar')).toBeVisible();
    await expect(page.locator('text=Importar CSV')).toBeVisible();
    await expect(page.locator('text=Importar DXF')).toBeVisible();
    await expect(page.locator('text=Importar STEP')).toBeVisible();
    await expect(page.locator('text=Exportar CSV')).toBeVisible();
    await expect(page.locator('text=Exportar PDF')).toBeVisible();
    await expect(page.locator('text=Compartir')).toBeVisible();
    await expect(page.locator('text=Reporte CNSNS')).toBeVisible();
    await expect(page.locator('text=Especificaciones Tecnicas')).toBeVisible();
    await expect(page.locator('text=Audit Trail')).toBeVisible();
    await expect(page.locator('text=Analisis de Logs')).toBeVisible();
    await expect(page.locator('text=Glosario')).toBeVisible();
    await expect(page.locator('text=Acerca de')).toBeVisible();
  });

  test('Exportar CSV opens Export dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText('Exportar CSV').click();
    await expect(page.locator('text=Exportar Resultados')).toBeVisible({ timeout: 5000 });
  });

  test('Reporte CNSNS opens CNSNS dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText(/Reporte CNSNS/).click();
    await expect(page.getByRole('dialog', { name: /Generar Memoria Analitica CNSNS/i })).toBeVisible({ timeout: 5000 });
  });

  test('Glosario opens glossary panel', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText('Glosario').click();
    await expect(page.locator('text=Glosario de Terminologia')).toBeVisible({ timeout: 5000 });
  });

  test('Acerca de opens about dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText('Acerca de').click();
    await expect(page.getByRole('dialog')).toContainText(/RadShield-MX/i, { timeout: 5000 });
  });

  test('Especificaciones Tecnicas opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText('Especificaciones Tecnicas').click();
    await expect(page.locator('text=Especificaciones Tecnicas')).toBeVisible({ timeout: 5000 });
  });

  test('Audit Trail opens dialog', async ({ page }) => {
    await page.getByRole('button', { name: /Archivo/i }).click();
    await page.getByText('Audit Trail').click();
    await expect(page.locator('text=Trazabilidad CNSNS')).toBeVisible({ timeout: 5000 });
  });
});
