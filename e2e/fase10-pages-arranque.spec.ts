/**
 * Fase 10 — arranque en GitHub Pages con datos de una versión anterior.
 *
 * Simula el navegador de alguien que usó la app antes de la Fase 10: el autoguardado de sesión
 * (`radshield_mx_current`) tiene el plano demo R&F (DeLorenzo 2016, Fig. 6) que la versión vieja cargaba sola,
 * hay un service worker registrado en el alcance de la app y cachés `radshield-…` antiguas.
 * La app debe arrancar en el estado vacío, con «Guíame» visible, sin SW ni cachés propias.
 *
 * Contra el build de Pages: PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_TEST_BASE_URL=http://host/RadShieldMx/
 */
import { test, expect, type Page } from '@playwright/test';

/** Plano demo que la versión anterior a la Fase 10 cargaba al cerrar la bienvenida (y autoguardaba cada 30 s). */
const DEMO_ANTIGUO = {
  id: 'plan-1',
  name: 'Demo - R&F Room (RadShield Fig.6)',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 1000,
  height_pixels: 800,
  sources: [
    { id: 'source-chest', x: 300, y: 200, name: 'Chest X-ray', workloadValue: 150, workloadUnit: 'exams/week', useFactor: 0.25 },
    { id: 'source-table', x: 350, y: 350, name: 'Table Top X-ray', workloadValue: 80, workloadUnit: 'exams/week', useFactor: 1 },
    { id: 'source-fluoro', x: 400, y: 300, name: 'Fluoroscopy', workloadValue: 20, workloadUnit: 'hours/week', useFactor: 0.083 },
  ],
  barriers: [
    { id: 'wall-north', x1: 100, y1: 100, x2: 600, y2: 100, name: 'Wall 1 (North)', barrierType: 'primary', useFactor: 1, occupancyFactor: 1, designGoal_mSv_per_wk: 0.1, materialCode: 'CONCRETE235' },
    { id: 'wall-east', x1: 600, y1: 100, x2: 600, y2: 500, name: 'Wall 2 (East)', barrierType: 'secondary', useFactor: 0.25, occupancyFactor: 0.2, designGoal_mSv_per_wk: 0.02, materialCode: 'CONCRETE235' },
  ],
  occupiedRegions: [],
};

function registrarErrores(page: Page) {
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(`pageerror: ${e.message}`));
  return errores;
}

async function cerrarBienvenida(page: Page) {
  const continuar = page.getByText('Continuar');
  if (await continuar.count()) await continuar.first().click();
}

async function guiameVisible(page: Page) {
  const boton = page.getByTestId('f10-toolbar-guiame');
  await expect(boton).toBeVisible();
  const caja = await boton.boundingBox();
  const vista = page.viewportSize()!;
  expect(caja, 'caja de «Guíame»').toBeTruthy();
  // Dentro de la ventana (no cortado por la barra de menús que desborda) y no tapado por otro elemento.
  expect(caja!.x).toBeGreaterThanOrEqual(0);
  expect(caja!.x + caja!.width).toBeLessThanOrEqual(vista.width);
  expect(caja!.y + caja!.height).toBeLessThanOrEqual(vista.height);
  const encima = await page.evaluate(({ x, y }) => {
    const el = document.elementFromPoint(x, y);
    return Boolean(el?.closest('[data-testid="f10-toolbar-guiame"]'));
  }, { x: caja!.x + caja!.width / 2, y: caja!.y + caja!.height / 2 });
  expect(encima, '«Guíame» no está tapado').toBe(true);
}

test.describe('Fase 10 arranque en Pages', () => {
  for (const vista of [{ width: 1366, height: 768 }, { width: 1280, height: 720 }]) {
    test(`navegador limpio ${vista.width}×${vista.height}: estado vacío y «Guíame» visible`, async ({ page }) => {
      const errores = registrarErrores(page);
      await page.setViewportSize(vista);
      await page.addInitScript(() => { try { localStorage.setItem('radshield-tour-completed', 'true'); } catch { /* */ } });
      await page.goto('./', { waitUntil: 'networkidle' });
      await cerrarBienvenida(page);
      await expect(page.getByTestId('f10-estado-vacio')).toBeVisible();
      await guiameVisible(page);
      expect(errores).toEqual([]);
    });
  }

  test('navegador con autoguardado, service worker y cachés de la versión anterior arranca vacío', async ({ page, context }) => {
    test.setTimeout(90_000);
    const errores = registrarErrores(page);
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.addInitScript(() => { try { localStorage.setItem('radshield-tour-completed', 'true'); } catch { /* */ } });

    // 1) Primera visita: deja el estado de «la versión anterior» en este origen y pestaña.
    await page.goto('./', { waitUntil: 'networkidle' });
    const alcance = await page.evaluate(async (demo) => {
      sessionStorage.setItem('radshield_mx_current', JSON.stringify(demo));
      const base = new URL('./', location.href).pathname;
      await caches.open(`radshield-${base}:v49`).then((c) => c.put(`${base}viejo.js`, new Response('// bundle viejo')));
      await caches.open('radshield-v48').then((c) => c.put('/viejo.js', new Response('// bundle viejo')));
      // Caché de OTRO sitio del mismo origen (p. ej. otro repo en <usuario>.github.io): no se toca.
      await caches.open('otro-sitio-v1').then((c) => c.put('/otro/x.js', new Response('// ajeno')));
      const reg = await navigator.serviceWorker.register(`${base}sw-v50.js`, { scope: base });
      await navigator.serviceWorker.ready;
      return reg.scope;
    }, DEMO_ANTIGUO);
    expect(alcance).toMatch(/\/$/);

    // 2) Recarga (misma pestaña: sessionStorage y SW siguen ahí).
    await page.reload({ waitUntil: 'networkidle' });
    await cerrarBienvenida(page);
    await expect(page.getByTestId('f10-estado-vacio')).toBeVisible();
    await expect(page.getByText('Demo - R&F Room')).toHaveCount(0);
    await guiameVisible(page);

    // El autoguardado del demo se descarta (no reaparece en la siguiente recarga) y no queda SW ni cachés propias.
    await expect.poll(() => page.evaluate(() => sessionStorage.getItem('radshield_mx_current'))).toBeNull();
    await expect.poll(() => page.evaluate(async () => {
      const base = new URL('./', location.href).pathname;
      const regs = await navigator.serviceWorker.getRegistrations();
      return regs.filter((r) => new URL(r.scope).pathname.startsWith(base)).length;
    })).toBe(0);
    await expect.poll(() => page.evaluate(async () => (await caches.keys()).sort())).toEqual(['otro-sitio-v1']);

    await page.reload({ waitUntil: 'networkidle' });
    await cerrarBienvenida(page);
    await expect(page.getByTestId('f10-estado-vacio')).toBeVisible();
    expect(errores).toEqual([]);
    void context;
  });

  test('un proyecto propio autoguardado (no demo) se sigue restaurando', async ({ page }) => {
    await page.addInitScript(() => { try { localStorage.setItem('radshield-tour-completed', 'true'); } catch { /* */ } });
    await page.goto('./', { waitUntil: 'networkidle' });
    await page.evaluate((demo) => {
      sessionStorage.setItem('radshield_mx_current', JSON.stringify({ ...demo, id: 'plan-propio', name: 'Sala 3 — Hospital', sources: demo.sources.map((s) => ({ ...s, id: `mi-${s.id}` })), barriers: demo.barriers.map((b) => ({ ...b, id: `mi-${b.id}` })) }));
    }, DEMO_ANTIGUO);
    await page.reload({ waitUntil: 'networkidle' });
    await cerrarBienvenida(page);
    await expect(page.getByTestId('f10-estado-vacio')).toHaveCount(0);
  });
});
