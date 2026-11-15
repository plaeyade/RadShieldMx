/**
 * E.14 → Fase 12, paso 2: menús por etapa del flujo de diseño.
 * Lo que era el menú «Archivo» se repartió en «1. Proyecto y plano», «5. Memoria analítica y CNSNS» y «Ayuda».
 */
import { test, expect, type Page } from '@playwright/test';
import { abrirMenu, bootWorkspace } from './helpers';

const contenido = (page: Page, id: string) => page.getByTestId(`f12-menu-${id}-contenido`);

test.describe('Menús por etapa (antes Menu Archivo)', () => {
  test.beforeEach(async ({ page }) => {
    await bootWorkspace(page);
  });

  test('la barra superior muestra las 5 etapas, «Calcular» y Ayuda', async ({ page }) => {
    for (const nombre of ['1. Proyecto y plano', '2. Fuentes y cargas de trabajo', '3. Barreras y materiales', '4. Verificación y cumplimiento', '5. Memoria analítica y CNSNS', 'Ayuda']) {
      await expect(page.getByRole('button', { name: nombre, exact: true })).toBeVisible();
    }
    await expect(page.getByTestId('f12-calcular')).toBeVisible();
    await expect(page.getByTestId('f12-menu-avanzado')).toHaveCount(0);
  });

  test('1. Proyecto y plano: proyecto, importación y plano', async ({ page }) => {
    await abrirMenu(page, 'proyecto');
    const menu = contenido(page, 'proyecto');
    for (const texto of ['Nuevo Proyecto', 'Abrir Proyecto', 'Guardar', 'Importar CSV', 'Importar DXF', 'Importar STEP', 'Herramientas del plano']) {
      await expect(menu.getByText(texto, { exact: false }).first()).toBeVisible();
    }
  });

  test('5. Memoria y CNSNS: exportación, CNSNS y trazabilidad', async ({ page }) => {
    await abrirMenu(page, 'reportes');
    const menu = contenido(page, 'reportes');
    for (const texto of ['Exportar CSV', 'Exportar PDF', 'Compartir', 'Reporte CNSNS', 'Audit Trail', 'Analisis de Logs', 'Paquete de evidencia']) {
      await expect(menu.getByText(texto, { exact: false }).first()).toBeVisible();
    }
    await expect(menu.getByText('Especificaciones Tecnicas', { exact: true })).toBeVisible();
  });

  test('Exportar CSV abre el diálogo de exportación', async ({ page }) => {
    await abrirMenu(page, 'reportes');
    await contenido(page, 'reportes').getByText('Exportar CSV').click();
    await expect(page.locator('text=Exportar Resultados')).toBeVisible({ timeout: 5000 });
  });

  test('Reporte CNSNS abre el diálogo CNSNS', async ({ page }) => {
    await abrirMenu(page, 'reportes');
    await contenido(page, 'reportes').getByText('Reporte CNSNS', { exact: true }).click();
    await expect(page.getByRole('dialog', { name: /Generar Memoria Analitica CNSNS/i })).toBeVisible({ timeout: 5000 });
  });

  test('Glosario abre el panel del glosario', async ({ page }) => {
    await abrirMenu(page, 'ayuda');
    await contenido(page, 'ayuda').getByText('Glosario').click();
    await expect(page.locator('text=Glosario de Terminologia')).toBeVisible({ timeout: 5000 });
  });

  test('Acerca de abre el diálogo', async ({ page }) => {
    await abrirMenu(page, 'ayuda');
    await contenido(page, 'ayuda').getByText('Acerca de').click();
    await expect(page.getByRole('dialog')).toContainText(/RadShield-MX/i, { timeout: 5000 });
  });

  test('Especificaciones Tecnicas abre el diálogo', async ({ page }) => {
    await abrirMenu(page, 'reportes');
    await contenido(page, 'reportes').getByText('Especificaciones Tecnicas', { exact: true }).click();
    await expect(page.getByRole('dialog')).toContainText(/Especificaciones T[eé]cnicas/i, { timeout: 5000 });
  });

  test('Audit Trail abre el diálogo', async ({ page }) => {
    await abrirMenu(page, 'reportes');
    await contenido(page, 'reportes').getByText('Audit Trail').click();
    await expect(page.locator('text=Trazabilidad CNSNS')).toBeVisible({ timeout: 5000 });
  });
});
