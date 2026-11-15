/**
 * Fase 12, paso 1 — prueba E2E de «Guíame» sobre el almacén único del proyecto.
 *
 * Recorre «Guíame» por la interfaz (Ayuda → Guíame → crear proyecto → plano → fuentes → ocupación), calcula con
 * el único botón «Calcular» de la barra superior (Fase 12, paso 2) y comprueba el control obligatorio del muro norte de captación:
 * 17.96 mm Pb / 213.77 mm de concreto (TG-108, curva de banda ancha; src/__tests__/validacion/ejemploGuiado.test.ts).
 *
 * Además verifica que el plano, los resultados y el historial salen de un solo almacén: el lienzo, el gancho E2E
 * (`plano()` y `proyecto()`) y los diálogos ven el mismo estado, y deshacer/rehacer funciona tras el cálculo.
 * Paso 2: cada Ctrl+Z deshace UN paso y cada Ctrl+Y rehace UNO (antes dos oyentes de teclado movían dos).
 *
 * Local: npm run build && npx playwright test e2e/fase12-guiame-store.spec.ts --project=chromium
 */
import { test, expect, type Page } from '@playwright/test';

interface ResumenProyecto {
  nombre: string; barreras: number; fuentes: number; resultados: number;
  calculationStatus: string; activeTool: string; canUndo: boolean; pasado: number; futuro: number;
}
interface Gancho {
  plano: () => { name: string; barriers: { id: string; requiredThickness_mm?: Record<string, number>; calculationTrace?: unknown }[] };
  resultados: () => { barrierId: string }[];
  proyecto: () => ResumenProyecto;
}

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

const proyecto = (page: Page) =>
  page.evaluate(() => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.proyecto());

test.describe('Fase 12 — Guíame sobre el almacén único', () => {
  test('Guíame → Calcular da 17.96 mm Pb / 213.77 mm concreto en el muro norte', async ({ page }) => {
    test.setTimeout(2 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);

    const inicial = await proyecto(page);
    expect(inicial.barreras).toBe(0);
    expect(inicial.resultados).toBe(0);

    // «Guíame» paso a paso, por la interfaz.
    await page.getByTestId('f12-menu-ayuda').click();
    await page.getByTestId('f10-help-guiame').click();
    await expect(page.getByTestId('guia-paso-a-paso')).toBeVisible();
    await page.getByTestId('guia-crear-proyecto').click();
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-ejemplo-plano').click();
    await expect.poll(async () => (await proyecto(page)).barreras).toBe(7);
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-ejemplo-fuentes').click();
    await expect.poll(async () => (await proyecto(page)).fuentes).toBeGreaterThan(0);
    await page.getByTestId('guia-siguiente').click();
    await page.getByTestId('guia-ejemplo-ocupacion').click();
    await page.getByTestId('guia-cerrar').click();
    await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);

    // Un solo «Calcular» (barra superior).
    await expect(page.getByTestId('f12-calcular')).toHaveCount(1);
    await page.getByTestId('f12-calcular').click();
    await page.waitForFunction(() => {
      const g = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E;
      const bs = g.plano().barriers;
      return bs.length > 0 && bs.every((b) => b.calculationTrace) && g.resultados().length === bs.length;
    }, undefined, { timeout: 20_000 });

    const despues = await proyecto(page);
    expect(despues.resultados).toBe(despues.barreras);
    expect(despues.calculationStatus).not.toBe('running');
    expect(despues.canUndo).toBe(true);

    const norte = await page.evaluate((id) => {
      const b = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.plano().barriers.find((x) => x.id === id);
      return b ? { PB: b.requiredThickness_mm?.PB, CONCRETE235: b.requiredThickness_mm?.CONCRETE235 } : null;
    }, MURO_NORTE.id);
    console.log('[fase12] muro norte', JSON.stringify(norte));
    expect(norte, 'barrera eg-captacion-norte').toBeTruthy();
    expect(Math.abs(norte!.PB! - MURO_NORTE.PB)).toBeLessThanOrEqual(0.005);
    expect(Math.abs(norte!.CONCRETE235! - MURO_NORTE.CONCRETE235)).toBeLessThanOrEqual(0.005);

    // Deshacer/rehacer actúa sobre el mismo almacén que leen el lienzo y los diálogos, un paso por pulsación.
    await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
    const h0 = await proyecto(page);
    expect(h0.pasado).toBeGreaterThanOrEqual(2);
    expect(h0.futuro).toBe(0);
    await page.keyboard.press('Control+z');
    await expect.poll(async () => (await proyecto(page)).pasado).toBe(h0.pasado - 1);
    expect((await proyecto(page)).futuro).toBe(1);
    await expect.poll(async () => {
      const b = await page.evaluate((id) => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.plano().barriers.find((x) => x.id === id)?.calculationTrace, MURO_NORTE.id);
      return Boolean(b);
    }).toBe(false);
    await page.keyboard.press('Control+y');
    await expect.poll(async () => (await proyecto(page)).pasado).toBe(h0.pasado);
    expect((await proyecto(page)).futuro).toBe(0);
    await expect.poll(async () => page.evaluate((id) => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.plano().barriers.find((x) => x.id === id)?.requiredThickness_mm?.PB, MURO_NORTE.id)).toBeCloseTo(MURO_NORTE.PB, 2);

    expect(errores).toEqual([]);
  });
});
