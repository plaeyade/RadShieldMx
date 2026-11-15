/**
 * Fase 12, paso 3 — flujo único de memoria analítica y CNSNS sobre `radshield/memoria@1`.
 *
 * Recorre «Guíame», calcula con el único «Calcular», abre «5. Memoria analítica y CNSNS → Memoria analítica y CNSNS»
 * (única entrada de memoria del menú), genera la memoria del ejemplo y valida el JSON descargado contra el esquema
 * `radshield/memoria@1` (src/lib/memoriaEsquema.ts). DOCX y PDF salen del mismo objeto (mismo sello sha256), el JSON
 * importado vuelve a validar y las claves antiguas (Memoria IA, CNSNS, PDF…) abren el mismo diálogo.
 *
 * Local: npm run build && npx playwright test e2e/fase12-memoria-unificada.spec.ts --project=chromium
 */
import { readFileSync } from 'node:fs';
import { test, expect, type Download, type Page } from '@playwright/test';
import JSZip from 'jszip';
import { erroresEsquemaMemoria, type MemoriaSegunEsquema } from '../src/lib/memoriaEsquema';
import { cargarEjemploGuiame } from './helpers';

/** Control obligatorio del plan aprobado (redondeo a 0.01 mm). */
const MURO_NORTE = { id: 'eg-captacion-norte', PB: 17.96, CONCRETE235: 213.77 };

async function entrar(page: Page) {
  await page.addInitScript(() => {
    try {
      localStorage.setItem('radshield-tour-completed', 'true');
      localStorage.setItem('radshield-e2e-controls', 'true');
    } catch { /* sin almacenamiento */ }
  });
  await page.goto('./', { waitUntil: 'networkidle' });
  const continuar = page.getByText('Continuar');
  if (await continuar.count()) await continuar.first().click();
  await page.waitForFunction(() => Boolean((window as unknown as { __radshieldE2E?: unknown }).__radshieldE2E));
}

async function descargar(page: Page, testId: string): Promise<Buffer> {
  const [d]: [Download, void] = await Promise.all([page.waitForEvent('download'), page.getByTestId(testId).click()]);
  return readFileSync((await d.path())!);
}

test.describe('Fase 12, paso 3 — memoria unificada', () => {
  test('Guíame → Calcular → Memoria: JSON válido contra radshield/memoria@1; DOCX y PDF del mismo objeto', async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await cargarEjemploGuiame(page);
    await page.getByTestId('f12-calcular').click();
    await page.waitForFunction(() => {
      const g = (window as unknown as { __radshieldE2E: { plano: () => { barriers: { calculationTrace?: unknown }[] }; resultados: () => unknown[] } }).__radshieldE2E;
      const bs = g.plano().barriers;
      return bs.length > 0 && bs.every((b) => b.calculationTrace) && g.resultados().length === bs.length;
    }, undefined, { timeout: 30_000 });

    // Una sola entrada de memoria en el menú 5 (antes: Memoria IA, Exportar PDF y Reporte CNSNS).
    await page.getByTestId('f12-menu-reportes').click();
    const menu = page.getByTestId('f12-menu-reportes-contenido');
    await expect(menu).toBeVisible();
    await expect(menu.getByText(/Exportar PDF|Reporte CNSNS/)).toHaveCount(0);
    await expect(page.getByTestId('f12-reportes-memoria')).toHaveCount(1);
    await page.getByTestId('f12-reportes-memoria').click();
    const dialogo = page.getByTestId('memoria-unificada');
    await expect(dialogo).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('memoria-vacio')).toHaveCount(0);

    // Revisión: el muro norte del ejemplo con 17.96 mm Pb / 213.77 mm concreto.
    await page.getByTestId('memoria-paso-revision').click();
    await expect(page.getByTestId('memoria-tabla-barreras').locator(`[data-barrera="${MURO_NORTE.id}"]`)).toContainText(/17\.96[\s\S]*213\.77/);
    const sello = await page.getByTestId('memoria-sello').getAttribute('data-sha256');
    expect(sello).toMatch(/^[0-9a-f]{64}$/);

    // Exportar: JSON, DOCX y PDF del mismo objeto.
    await page.getByTestId('memoria-paso-exportar').click();
    const json = await descargar(page, 'memoria-json');
    const memoria = JSON.parse(json.toString('utf-8')) as MemoriaSegunEsquema;
    expect(erroresEsquemaMemoria(memoria)).toEqual([]);
    expect(memoria.contrato).toBe('radshield/memoria@1');
    expect(memoria.sha256).toBe(sello);
    expect(memoria.barreras).toHaveLength(7);
    const norte = memoria.barreras.find((b) => b.id === MURO_NORTE.id)!;
    expect(Math.abs(norte.requeridoPb_mm! - MURO_NORTE.PB)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(norte.requeridoConcreto_mm! - MURO_NORTE.CONCRETE235)).toBeLessThanOrEqual(0.005);

    const docx = await descargar(page, 'memoria-docx');
    expect(docx.subarray(0, 2).toString()).toBe('PK');
    const xml = await (await JSZip.loadAsync(docx)).file('word/document.xml')!.async('string');
    expect(xml).toContain(memoria.sha256.slice(0, 16));
    const pdf = await descargar(page, 'memoria-pdf');
    expect(pdf.subarray(0, 5).toString()).toBe('%PDF-');

    // Consumir: el JSON descargado se importa, valida contra el esquema y conserva el sello.
    await page.getByTestId('memoria-importar-archivo').setInputFiles({ name: 'memoria.json', mimeType: 'application/json', buffer: json });
    await expect(page.getByTestId('memoria-importada')).toHaveAttribute('data-sello-valido', 'true');
    await expect(page.getByTestId('memoria-sello')).toHaveAttribute('data-sha256', memoria.sha256);
    await page.keyboard.press('Escape');
    await expect(dialogo).toBeHidden();

    // Las claves antiguas abren el mismo flujo.
    for (const clave of ['memoriaAI', 'cnsns', 'pdfReport', 'cnsnsAutoReport']) {
      await page.evaluate((c) => (window as unknown as { __radshieldE2E: { abrir: (n: string) => void } }).__radshieldE2E.abrir(c), clave);
      await expect(page.getByTestId('memoria-unificada'), clave).toBeVisible({ timeout: 10_000 });
      await page.keyboard.press('Escape');
      await expect(page.getByTestId('memoria-unificada')).toBeHidden();
    }
    expect(errores).toEqual([]);
  });
});
