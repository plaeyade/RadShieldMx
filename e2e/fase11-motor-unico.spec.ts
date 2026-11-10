/**
 * Fase 11 — las rutas de cálculo del diseñador dan el mismo resultado sobre el mismo proyecto.
 *
 * Proyecto: el ejemplo PET/CT de «Guíame» (TG-108, F-18). Rutas: barra superior (Blindaje → Calcular Blindaje),
 * barra lateral «Calc», tecla F5 y botón «Calcular» del lienzo. Antes de cada ruta se borra el cálculo del plano y se
 * fija el espesor instalado (una barrera corta y el resto sobradas) para comparar también el estado de cumplimiento.
 * Contra el build de Pages: PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_TEST_BASE_URL=http://host/RadShieldMx/
 */
import { test, expect, type Page } from '@playwright/test';

interface Gancho {
  plano: () => { barriers: { id: string; maxKerma?: number; requiredThickness_mm?: Record<string, number>; calculationTrace?: { standard?: string }; thickness_mm?: number; materialCode: string }[] };
  resultados: () => { barrierId: string; maxBarrierThickness_mm: number; thicknessLead_mm: number; thicknessConcrete_mm: number; estado?: string; pass?: boolean; motor?: string }[];
  limpiarCalculo: (instalado?: Record<string, number>) => void;
}

const gancho = <T,>(page: Page, f: (g: Gancho, arg: unknown) => T, arg?: unknown) =>
  page.evaluate(({ src, a }) => {
    const g = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E;
    return (new Function('g', 'a', `return (${src})(g, a);`))(g, a);
  }, { src: f.toString(), a: arg }) as Promise<T>;

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

async function cargarEjemplo(page: Page) {
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

/** Resumen comparable: espesores, kerma, norma y estado por barrera, más los resultados del lienzo/reportes. */
const instantanea = (page: Page) => gancho(page, (g) => ({
  barreras: g.plano().barriers.map((b) => ({
    id: b.id, kerma: b.maxKerma, req: b.requiredThickness_mm, norma: b.calculationTrace?.standard ?? null,
  })),
  resultados: g.resultados().map((r) => ({
    id: r.barrierId, t: r.maxBarrierThickness_mm, pb: r.thicknessLead_mm, conc: r.thicknessConcrete_mm, estado: r.estado, pass: r.pass, motor: r.motor,
  })),
}));

async function esperarCalculo(page: Page) {
  await page.waitForFunction(() => {
    const g = (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E;
    const bs = g.plano().barriers;
    return bs.length > 0 && bs.every((b) => b.calculationTrace) && g.resultados().length === bs.length;
  }, undefined, { timeout: 20_000 });
}

test.describe('Fase 11 motor único', () => {
  test('barra superior, barra lateral, F5 y lienzo dan los mismos espesores y estados', async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await cargarEjemplo(page);

    // Referencia: primer cálculo para conocer los requeridos y fijar el espesor instalado.
    await page.getByTestId('f107-migrated-shielding-dropdown').click();
    await page.getByTestId('f107-migrated-shielding-menu').getByText('Calcular Blindaje', { exact: true }).click();
    await esperarCalculo(page);
    const instalado = await gancho(page, (g) => {
      const out: Record<string, number> = {};
      let corta = false;
      g.plano().barriers.forEach((b) => {
        const req = b.requiredThickness_mm?.[b.materialCode] ?? 0;
        // La primera barrera que necesita blindaje queda corta (mitad del requerido); las demás, sobradas.
        out[b.id] = req > 0 ? (corta ? req * 2 : req / 2) : 5;
        if (req > 0) corta = true;
      });
      return out;
    });

    const rutas: Record<string, () => Promise<void>> = {
      'barra superior': async () => {
        await page.getByTestId('f107-migrated-shielding-dropdown').click();
        await page.getByTestId('f107-migrated-shielding-menu').getByText('Calcular Blindaje', { exact: true }).click();
      },
      'barra lateral «Calc»': async () => { await page.getByTestId('sidebar-action-calcular-blindaje-f5').click(); },
      'tecla F5': async () => {
        await page.locator('body').click({ position: { x: 5, y: 5 }, force: true }).catch(() => undefined);
        await page.keyboard.press('F5');
      },
    };
    // Botón «Calcular» de la barra de herramientas del lienzo (Sel, Muro, Fuente… Calcular).
    const lienzo = page.locator('button[title^="Ejecutar calculo analitico de blindaje"]');
    await expect(lienzo.first()).toBeVisible();
    rutas['lienzo «Calcular»'] = async () => { await lienzo.first().click(); };

    const fotos: Record<string, Awaited<ReturnType<typeof instantanea>>> = {};
    for (const [nombre, pulsar] of Object.entries(rutas)) {
      await gancho(page, (g, a) => g.limpiarCalculo(a as Record<string, number>), instalado);
      await page.waitForFunction(() => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.plano().barriers.every((b) => !b.calculationTrace));
      await pulsar();
      await esperarCalculo(page);
      // Los resultados del lienzo se publican después del plano: esperar a que traigan el estado.
      await page.waitForFunction(() => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.resultados().every((r) => r.estado));
      fotos[nombre] = await instantanea(page);
    }

    const [primera, ...resto] = Object.entries(fotos);
    expect(primera[1].barreras.length).toBe(7);
    expect(primera[1].resultados.every((r) => r.motor === 'motorProyecto/normativo-v1')).toBe(true);
    // Estados reales: la barrera con la mitad del espesor requerido no cumple; las sobradas cumplen.
    const estados = primera[1].resultados.map((r) => r.estado);
    expect(estados).toContain('NO_CUMPLE');
    expect(estados).toContain('CUMPLE');
    for (const [nombre, foto] of resto) {
      expect.soft(foto, `${nombre} = ${primera[0]}`).toEqual(primera[1]);
    }
    expect(Object.keys(fotos)).toHaveLength(4);
    expect(errores).toEqual([]);
  });
});
