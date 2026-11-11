/**
 * Humo de depuración — la app carga y el cálculo de referencia no cambia entre etapas de depuración.
 *
 * Proyecto: el ejemplo PET/CT de «Guíame» (TG-108, F-18). Se calcula con «Blindaje → Calcular Blindaje» y se
 * comparan los espesores requeridos de las 7 barreras contra los valores fijados antes de la etapa 1 de
 * depuración (docs/DEPURACION.md). Referencia a mano: muro norte de captación 18.9 mm Pb / 200 mm de concreto
 * (src/__tests__/validacion/ejemploGuiado.test.ts, Ec. 2–3 y 9–10 de TG-108).
 *
 * Local: npx playwright test e2e/humo-calculo-referencia.spec.ts --project=chromium (tras `npm run build`).
 * Contra el build de Pages: PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_TEST_BASE_URL=http://host/RadShieldMx/
 */
import { test, expect, type Page } from '@playwright/test';

interface BarreraE2E { id: string; materialCode: string; requiredThickness_mm?: Record<string, number>; calculationTrace?: unknown }
interface Gancho {
  plano: () => { barriers: BarreraE2E[] };
  resultados: () => { barrierId: string; estado?: string; motor?: string }[];
}

/** Espesores requeridos (mm) del ejemplo «Guíame», medidos en main antes de la depuración (redondeo a 0.01 mm; tolerancia 0.01 mm). */
const REFERENCIA: Record<string, { PB: number; CONCRETE235: number }> = {
  'eg-captacion-oeste': { PB: 0, CONCRETE235: 0 },
  'eg-captacion-norte': { PB: 18.85, CONCRETE235: 199.88 },
  'eg-captacion-sur': { PB: 7.32, CONCRETE235: 77.64 },
  'eg-captacion-pet': { PB: 13.12, CONCRETE235: 139.07 },
  'eg-pet-norte': { PB: 15.73, CONCRETE235: 166.82 },
  'eg-pet-sur': { PB: 0.5, CONCRETE235: 5.27 },
  'eg-pet-control': { PB: 0, CONCRETE235: 0 },
};

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

async function cargarEjemploGuiame(page: Page) {
  await page.getByTestId('f295-primary-file-dropdown').click();
  await page.getByTestId('f10-help-guiame').click();
  await page.getByTestId('guia-crear-proyecto').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-plano').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-fuentes').click();
  await page.getByTestId('guia-siguiente').click();
  await page.getByTestId('guia-ejemplo-ocupacion').click();
  await page.getByTestId('guia-cerrar').click();
  await expect(page.getByTestId('guia-paso-a-paso')).toHaveCount(0);
}

test.describe('Humo de depuración', () => {
  test('carga la app y el ejemplo «Guíame» da los espesores de referencia (18.9 mm Pb en el muro norte)', async ({ page }) => {
    test.setTimeout(2 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await cargarEjemploGuiame(page);

    await page.getByTestId('f107-migrated-shielding-dropdown').click();
    await page.getByTestId('f107-migrated-shielding-menu').getByText('Calcular Blindaje', { exact: true }).click();
    await page.waitForFunction(() => {
      const g = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E;
      const bs = g.plano().barriers;
      return bs.length > 0 && bs.every((b) => b.calculationTrace) && g.resultados().length === bs.length;
    }, undefined, { timeout: 20_000 });

    const medidos = await page.evaluate(() => {
      const g = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E;
      return {
        barreras: g.plano().barriers.map((b) => ({ id: b.id, PB: b.requiredThickness_mm?.PB ?? 0, CONCRETE235: b.requiredThickness_mm?.CONCRETE235 ?? 0 })),
        motores: [...new Set(g.resultados().map((r) => r.motor))],
      };
    });
    console.log('[humo] espesores requeridos', JSON.stringify(medidos));

    expect(medidos.motores).toEqual(['motorProyecto/normativo-v1']);
    const norte = medidos.barreras.find((b) => b.id === 'eg-captacion-norte');
    expect(norte, 'barrera eg-captacion-norte').toBeTruthy();
    expect(norte!.PB).toBeCloseTo(18.9, 1);
    expect(norte!.CONCRETE235).toBeCloseTo(200, -1);
    expect(medidos.barreras.map((b) => b.id).sort()).toEqual(Object.keys(REFERENCIA).sort());
    for (const b of medidos.barreras) {
      expect.soft(Math.abs(b.PB - REFERENCIA[b.id].PB), `${b.id} Pb`).toBeLessThanOrEqual(0.01);
      expect.soft(Math.abs(b.CONCRETE235 - REFERENCIA[b.id].CONCRETE235), `${b.id} concreto`).toBeLessThanOrEqual(0.01);
    }
    expect(errores).toEqual([]);
  });
});
