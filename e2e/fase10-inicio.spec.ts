/**
 * Fase 10 — no regresión del arranque sin proyecto y del asistente «Guíame».
 * Contra el build de Pages: PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_TEST_BASE_URL=http://host/RadShieldMx/
 */
import { test, expect, type Page } from '@playwright/test';

function registrarErrores(page: Page) {
  const errores: string[] = [];
  page.on('console', (m) => { if (m.type() === 'error') errores.push(m.text()); });
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  return errores;
}

async function entrar(page: Page, e2e = false) {
  await page.addInitScript((conGancho) => {
    try {
      localStorage.setItem('radshield-tour-completed', 'true');
      if (conGancho) localStorage.setItem('radshield-e2e-controls', 'true');
    } catch { /* sin almacenamiento */ }
  }, e2e);
  await page.goto('./', { waitUntil: 'networkidle' });
  const continuar = page.getByText('Continuar');
  if (await continuar.count()) await continuar.first().click();
}

test.describe('Fase 10 inicio vacío', () => {
  test('arranca sin plano de ejemplo, con estado vacío y sin errores', async ({ page }) => {
    const errores = registrarErrores(page);
    await entrar(page);
    await expect(page.getByTestId('f10-estado-vacio')).toBeVisible();
    await expect(page.getByText(/Demo - R&F|RadShield Fig/)).toHaveCount(0);
    await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);
    expect(errores).toEqual([]);
  });

  test('todos los diálogos del store abren en vacío sin errores ni caídas', async ({ page }) => {
    test.setTimeout(10 * 60_000);
    const errores = registrarErrores(page);
    await entrar(page, true);
    await page.waitForFunction(() => Boolean((window as unknown as { __radshieldE2E?: unknown }).__radshieldE2E));
    const nombres = await page.evaluate(() => (window as unknown as { __radshieldE2E: { dialogos: () => string[] } }).__radshieldE2E.dialogos());
    const fallos: string[] = [];
    for (const n of nombres) {
      const antes = errores.length;
      await page.evaluate((x) => (window as unknown as { __radshieldE2E: { abrir: (n: string) => void } }).__radshieldE2E.abrir(x), n);
      await page.waitForTimeout(400);
      if (await page.getByText('Error en la aplicación').count()) fallos.push(`${n}: caída`);
      if (errores.length > antes) fallos.push(`${n}: ${errores.slice(antes).join(' | ')}`);
      await page.evaluate(() => (window as unknown as { __radshieldE2E: { cerrarTodo: () => void } }).__radshieldE2E.cerrarTodo());
      await page.keyboard.press('Escape');
    }
    expect(fallos).toEqual([]);
  });

  test('Guíame: recorrido con el ejemplo PET/CT, pausa, reanudación y reinicio', async ({ page }) => {
    const errores = registrarErrores(page);
    await entrar(page);
    const titulo = page.getByTestId('guia-titulo');
    await page.getByTestId('f295-primary-file-dropdown').click();
    await page.getByTestId('f10-help-guiame').click();
    await expect(titulo).toHaveText('Crear el proyecto');
    await page.getByTestId('guia-crear-proyecto').click();
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-ejemplo-plano').click();
    await expect(page.getByTestId('f10-estado-vacio')).toHaveCount(0);
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-ejemplo-fuentes').click();
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-cerrar').click();
    await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);
    await page.getByTestId('f10-toolbar-guiame').click();
    await expect(titulo).toHaveText('Ocupación y uso de las áreas');
    await page.getByTestId('guia-ejemplo-ocupacion').click();
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-calcular').click();
    await expect(page.getByTestId('guia-estado-paso')).toContainText('hecho', { timeout: 10_000 });
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-validar').click();
    // El validador es modal (carga diferida): esperar a que abra antes de cerrarlo con Escape.
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await page.getByTestId('guia-siguiente').click();
    const [descarga] = await Promise.all([page.waitForEvent('download'), page.getByTestId('guia-exportar-pdf').click()]);
    // Chrome sin cabeza no siempre conserva el nombre de un ancla blob separada del DOM: se valida el contenido.
    const { readFileSync } = await import('node:fs');
    expect(readFileSync((await descarga.path())!).subarray(0, 5).toString()).toBe('%PDF-');
    await page.getByTestId('guia-siguiente').click();
    await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);
    await page.getByTestId('f295-primary-file-dropdown').click();
    await page.getByTestId('f10-help-guia-reiniciar').click();
    await expect(titulo).toHaveText('Crear el proyecto');
    expect(errores).toEqual([]);
  });
});
