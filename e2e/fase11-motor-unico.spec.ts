/**
 * Fase 11 — las rutas de cálculo del diseñador dan el mismo resultado sobre el mismo proyecto.
 *
 * Proyecto: el ejemplo PET/CT de «Guíame» (TG-108, F-18). Rutas (Fase 12, paso 2: un solo botón «Calcular»): el
 * botón «Calcular» de la barra superior, la tecla F5, la paleta de comandos (Ctrl+K) y el menú contextual del lienzo.
 * La barra lateral, la barra del lienzo, la barra «CAD» y la línea de estado ya no tienen «Calcular». Antes de cada ruta se borra el cálculo del plano y se
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
  await page.getByTestId('f12-menu-ayuda').click();
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
  test('botón «Calcular», F5, paleta de comandos y menú contextual dan los mismos espesores y estados', async ({ page }) => {
    test.setTimeout(3 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await cargarEjemplo(page);

    // Referencia: primer cálculo para conocer los requeridos y fijar el espesor instalado.
    await page.getByTestId('f12-calcular').click();
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
      'botón «Calcular»': async () => { await page.getByTestId('f12-calcular').click(); },
      'tecla F5': async () => {
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await page.keyboard.press('F5');
      },
      'paleta de comandos': async () => {
        await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
        await page.keyboard.press('Control+k');
        await page.getByPlaceholder('Escribe para buscar comandos...').fill('Calcular Blindaje');
        await page.getByRole('option', { name: /Calcular Blindaje/ }).first().click();
      },
      'menú contextual del lienzo': async () => {
        await page.getByTestId('f100-main-floorplan-canvas').click({ button: 'right' });
        await page.getByTestId('canvas-context-action-calc').click();
      },
    };
    // Un solo botón «Calcular» visible: los demás se retiraron.
    await expect(page.locator('button[title^="Ejecutar calculo analitico de blindaje"]')).toHaveCount(0);
    await expect(page.getByTestId('sidebar-action-calcular-blindaje-f5')).toHaveCount(0);
    await expect(page.getByTestId('f191d-action-calculate')).toHaveCount(0);

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
    // Revisión Fase 11: un muro calculado que no necesita blindaje no queda «sin cálculo» (no requiere blindaje adicional).
    expect(estados).not.toContain('SIN_CALCULO');
    for (const [nombre, foto] of resto) {
      expect.soft(foto, `${nombre} = ${primera[0]}`).toEqual(primera[1]);
    }
    expect(Object.keys(fotos)).toHaveLength(4);
    expect(errores).toEqual([]);
  });
});
