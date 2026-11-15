/**
 * Fase 12, paso 4 — asistente de capas DWG/DXF, zoom del lienzo y desbordes.
 *
 * 1. Asistente: al importar un DXF SINTÉTICO (8 capas, bloque INSERT, en mm lejos del origen) lista las capas con conteo y
 *    miniatura, propone material/espesor por las reglas de #61, deja editar e ignorar capas y guarda el mapeo en el
 *    almacén único del proyecto (y en el plano); al volver a importar, el mapeo se reutiliza.
 * 2. Zoom: zoom a extensión al aplicar el plano, rueda (con y sin Ctrl) centrada en el cursor y límites de zoom.
 * 3. Desbordes a 1280×720, 1920×1080 y 1024×768: sin scroll horizontal de la página, sin contenido que se salga de la
 *    barra de menús, la cabecera del lienzo, los menús, el visor DXF y el panel de revisión (scrollWidth > clientWidth),
 *    y con los cinco menús accesibles (no tapados por otros controles).
 *
 * Local: npm run build && npx playwright test e2e/fase12-asistente-capas.spec.ts --project=chromium --workers=1
 */
import { test, expect, type Page } from '@playwright/test';
import { dxfCapasSinteticas } from '../src/test/dxfCapasSinteticas';

interface Barrera { id: string; name: string; x1: number; y1: number; x2: number; y2: number; materialCode: string; thickness_mm?: number }
interface Mapeo { archivo: string; capas: Record<string, { rol: string; material: string; espesor_mm: number | null; ignorada: boolean }> }
interface Gancho {
  plano: () => { name: string; barriers: Barrera[]; importMetadata?: { mapeoCapas?: Mapeo } };
  mapeosCapas: () => Mapeo[];
}

const ARCHIVO = { name: 'capas-sinteticas.dxf', mimeType: 'application/dxf', buffer: Buffer.from(dxfCapasSinteticas()) };
const MENUS = ['proyecto', 'fuentes', 'barreras', 'verificacion', 'reportes', 'ayuda'];

async function entrar(page: Page) {
  await page.addInitScript(() => {
    try {
      for (const [k, v] of [['radshield-tour-completed', 'true'], ['radshield_privacy_consent', 'true'], ['radshield_welcome_dismissed', 'true'], ['radshield_mosaic', '1'], ['radshield-e2e-controls', 'true']]) localStorage.setItem(k, v);
    } catch { /* sin almacenamiento */ }
  });
  await page.goto('./', { waitUntil: 'networkidle' });
  const continuar = page.getByRole('button', { name: /Continuar/i });
  if (await continuar.isVisible({ timeout: 4000 }).catch(() => false)) await continuar.click();
  await expect(page.getByTestId('f12-menu-proyecto')).toBeVisible({ timeout: 15_000 });
  await page.waitForFunction(() => Boolean((window as unknown as { __radshieldE2E?: unknown }).__radshieldE2E));
}

const plano = (page: Page) => page.evaluate(() => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.plano());
const mapeosCapas = (page: Page) => page.evaluate(() => (window as unknown as { __radshieldE2E: Gancho }).__radshieldE2E.mapeosCapas());

async function abrirVisorConDxf(page: Page) {
  await page.getByTestId('f12-menu-proyecto').click();
  await page.getByTestId('f404-file-import-dxf').click();
  await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeVisible({ timeout: 10_000 });
  await page.getByTestId('dxf-file-input').setInputFiles(ARCHIVO);
  await expect(page.getByTestId('asistente-capas')).toBeVisible({ timeout: 10_000 });
}

const fila = (page: Page, capa: string) => page.locator(`[data-testid="asistente-capa-fila"][data-capa="${capa}"]`);

/** Vista del lienzo principal (atributos del canvas) y su tamaño en px. */
async function vista(page: Page) {
  return page.getByTestId('f100-main-floorplan-canvas').evaluate((c: HTMLCanvasElement) => ({
    scale: Number(c.dataset.escala), offsetX: Number(c.dataset.offsetX), offsetY: Number(c.dataset.offsetY), w: c.width, h: c.height,
  }));
}

/**
 * Desbordes dentro de los contenedores: elementos cuyo contenido es más ancho que su caja y no se desplaza (overflow
 * visible/hidden/clip, sin puntos suspensivos), y contenedores que salen de la ventana.
 */
async function desbordes(page: Page) {
  return page.evaluate(() => {
    const vw = window.innerWidth, vh = window.innerHeight;
    const d = document.documentElement;
    const problemas: string[] = [];
    if (d.scrollWidth > d.clientWidth + 1) problemas.push(`página: scrollWidth ${d.scrollWidth} > clientWidth ${d.clientWidth}`);
    const sel = '[role=dialog],[role=menu],[data-testid=f12-menus-etapa],[data-testid=f12-lienzo-cabecera],[data-testid=dxf-import-review-panel],[data-testid=dxf-panel-capas]';
    const nombre = (el: Element) => `${el.tagName.toLowerCase()}${(el as HTMLElement).dataset?.testid ? `[${(el as HTMLElement).dataset.testid}]` : ''}`;
    for (const c of Array.from(document.querySelectorAll(sel))) {
      const b = c.getBoundingClientRect();
      if (b.width === 0 || b.height === 0) continue;
      if (b.left < -1 || b.top < -1 || b.right > vw + 1 || b.bottom > vh + 1) problemas.push(`${nombre(c)} fuera de la ventana (${Math.round(b.left)},${Math.round(b.top)})–(${Math.round(b.right)},${Math.round(b.bottom)})`);
      for (const el of [c, ...Array.from(c.querySelectorAll('*'))] as HTMLElement[]) {
        if (!(el instanceof HTMLElement) || el.clientWidth <= 1) continue;
        const cs = getComputedStyle(el);
        if (el.scrollWidth > el.clientWidth + 1 && ['visible', 'hidden', 'clip'].includes(cs.overflowX) && cs.textOverflow !== 'ellipsis') {
          problemas.push(`${nombre(c)} › ${nombre(el)}.${String(el.className).slice(0, 50)}: scrollWidth ${el.scrollWidth} > clientWidth ${el.clientWidth}`);
        }
      }
    }
    return problemas;
  });
}

/** Menús de etapa tapados por otro control (elementFromPoint en su centro). */
async function menusTapados(page: Page) {
  return page.evaluate((ids) => ids.filter((id) => {
    const b = document.querySelector(`[data-testid="f12-menu-${id}"]`);
    if (!b) return false;
    const r = b.getBoundingClientRect();
    if (r.width === 0) return false;
    const top = document.elementFromPoint(r.left + r.width / 2, r.top + r.height / 2);
    return !(top && (top === b || b.contains(top)));
  }), MENUS);
}

test.describe('Fase 12, paso 4 — asistente de capas, zoom y desbordes', () => {
  test('asistente de capas: propuesta por reglas, edición, ignorar y mapeo reutilizable', async ({ page }) => {
    test.setTimeout(120_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrar(page);
    await abrirVisorConDxf(page);

    // Lista de capas con conteo y vista previa.
    await expect(page.getByTestId('asistente-capa-fila')).toHaveCount(9); // 8 capas + «0» del bloque
    await expect(page.getByTestId('asistente-capa-miniatura')).toHaveCount(9);
    await expect(fila(page, 'MURO_PLOMO_2MM').getByTestId('asistente-capa-conteo')).toContainText('2 ent.');
    await expect(fila(page, 'MOBILIARIO').getByTestId('asistente-capa-conteo')).toContainText('9 ent.');

    // Propuestas por las reglas de #61.
    await expect(fila(page, 'MURO_CONCRETO_200MM')).toHaveAttribute('data-material', 'concreto');
    await expect(fila(page, 'MURO_CONCRETO_200MM').getByTestId('asistente-capa-espesor')).toHaveValue('200');
    await expect(fila(page, 'MURO_PLOMO_2MM')).toHaveAttribute('data-material', 'plomo');
    await expect(fila(page, 'PUERTA_PB1.5MM').getByTestId('asistente-capa-espesor')).toHaveValue('1.5');
    await expect(fila(page, 'VENTANA_VIDRIO_PLOMADO')).toHaveAttribute('data-material', 'vidrio_plomo');
    await expect(fila(page, 'XREF PB HOSPITAL$0$TABIQUE')).toHaveAttribute('data-material', 'concreto'); // «PB» = planta baja
    await expect(fila(page, 'COTAS')).toHaveAttribute('data-rol', 'dimension');
    await expect(fila(page, 'MOBILIARIO')).toHaveAttribute('data-origen', 'omision');
    await expect(page.getByTestId('asistente-capas-resumen')).toContainText('5 muros');

    // Vista previa: la rueda acerca centrado en el cursor y «Extensión» vuelve al encuadre completo.
    const previa = page.getByTestId('dxf-vista-previa');
    const caja = (await previa.boundingBox())!;
    await page.mouse.move(caja.x + caja.width * 0.3, caja.y + caja.height * 0.4);
    await page.mouse.wheel(0, -300);
    await expect.poll(async () => Number(await previa.getAttribute('data-zoom'))).toBeGreaterThan(1.2);
    await page.getByTestId('dxf-zoom-extension').click();
    await expect(previa).toHaveAttribute('data-zoom', '1.0000');

    // Edición: material y espesor del muro de concreto, ignorar el tabique del XREF.
    await fila(page, 'MURO_CONCRETO_200MM').getByTestId('asistente-capa-material').selectOption('concreto_baritado');
    const espesor = fila(page, 'MURO_CONCRETO_200MM').getByTestId('asistente-capa-espesor');
    await espesor.fill('250');
    await espesor.press('Enter');
    await fila(page, 'XREF PB HOSPITAL$0$TABIQUE').getByTestId('asistente-capa-ignorar').check();
    await expect(fila(page, 'MURO_CONCRETO_200MM')).toHaveAttribute('data-origen', 'usuario');
    await expect(fila(page, 'XREF PB HOSPITAL$0$TABIQUE')).toHaveAttribute('data-rol', 'unmapped');
    await expect(page.getByTestId('asistente-capas-resumen')).toContainText('1 ignoradas');

    await page.getByTestId('dxf-apply-to-canvas').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 10_000 });
    // 4 (concreto) + 2 (plomo) + 1 (puerta) + 1 (ventana); el tabique ignorado no entra.
    await expect(page.getByTestId('statusbar-barrier-count')).toHaveText('8');

    const p = await plano(page);
    const concreto = p.barriers.filter((b) => b.name.includes('(MURO_CONCRETO_200MM)'));
    expect(concreto).toHaveLength(4);
    for (const b of concreto) expect(b).toMatchObject({ materialCode: 'concreto_baritado', thickness_mm: 250 });
    expect(p.barriers.some((b) => b.name.includes('TABIQUE'))).toBe(false);
    // El mapeo viaja con el plano (proyecto) y queda en el almacén único.
    expect(p.importMetadata?.mapeoCapas?.capas['MURO_CONCRETO_200MM']).toMatchObject({ material: 'concreto_baritado', espesor_mm: 250 });
    expect(p.importMetadata?.mapeoCapas?.capas['XREF PB HOSPITAL$0$TABIQUE']?.ignorada).toBe(true);
    const mapeos = await mapeosCapas(page);
    expect(mapeos.map((m) => m.archivo)).toContain('capas-sinteticas.dxf');

    // Reutilización: al importar de nuevo, las capas toman el mapeo guardado.
    await abrirVisorConDxf(page);
    await expect(fila(page, 'MURO_CONCRETO_200MM')).toHaveAttribute('data-origen', 'guardado');
    await expect(fila(page, 'MURO_CONCRETO_200MM')).toHaveAttribute('data-material', 'concreto_baritado');
    await expect(fila(page, 'MURO_CONCRETO_200MM').getByTestId('asistente-capa-espesor')).toHaveValue('250');
    await expect(fila(page, 'XREF PB HOSPITAL$0$TABIQUE').getByTestId('asistente-capa-ignorar')).toBeChecked();
    expect(errores).toEqual([]);
  });

  test('zoom a extensión al importar, rueda centrada en el cursor y límites de zoom', async ({ page }) => {
    test.setTimeout(120_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await entrar(page);
    await abrirVisorConDxf(page);
    await page.getByTestId('dxf-apply-to-canvas').click();
    await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 10_000 });

    // Zoom a extensión: el DXF (mm, ~250 000 unidades del origen) cabe completo; la escala queda < 0.1 (antes el mínimo).
    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect.poll(async () => (await vista(page)).scale).toBeLessThan(0.1);
    const v0 = await vista(page);
    const barreras = (await plano(page)).barriers;
    for (const b of barreras) {
      for (const [x, y] of [[b.x1, b.y1], [b.x2, b.y2]]) {
        const sx = x * v0.scale + v0.offsetX, sy = y * v0.scale + v0.offsetY;
        expect(sx).toBeGreaterThanOrEqual(0); expect(sx).toBeLessThanOrEqual(v0.w);
        expect(sy).toBeGreaterThanOrEqual(0); expect(sy).toBeLessThanOrEqual(v0.h);
      }
    }

    // Rueda (y Ctrl+rueda) centrada en el cursor: el punto del plano bajo el cursor no se mueve.
    const caja = (await canvas.boundingBox())!;
    const px = Math.round(v0.w * 0.35), py = Math.round(v0.h * 0.45);
    for (const ctrl of [false, true]) {
      const a = await vista(page);
      const mundo = { x: (px - a.offsetX) / a.scale, y: (py - a.offsetY) / a.scale };
      await page.mouse.move(caja.x + px, caja.y + py);
      if (ctrl) await page.keyboard.down('Control');
      await page.mouse.wheel(0, -200);
      if (ctrl) await page.keyboard.up('Control');
      await expect.poll(async () => (await vista(page)).scale).toBeGreaterThan(a.scale * 1.05);
      const b = await vista(page);
      expect(Math.abs(mundo.x * b.scale + b.offsetX - px)).toBeLessThan(1.5);
      expect(Math.abs(mundo.y * b.scale + b.offsetY - py)).toBeLessThan(1.5);
    }

    // Límites: acercar sin fin se detiene en el máximo; alejar se detiene en el mínimo (el plano no desaparece).
    for (let i = 0; i < 40; i++) await page.mouse.wheel(0, -1500);
    await page.waitForTimeout(200);
    const max = (await vista(page)).scale;
    await page.mouse.wheel(0, -1500);
    await page.waitForTimeout(150);
    expect((await vista(page)).scale).toBeCloseTo(max, 9);
    expect(max).toBeLessThanOrEqual(v0.scale * 400 + 1e-9);
    for (let i = 0; i < 60; i++) await page.mouse.wheel(0, 1500);
    await page.waitForTimeout(200);
    const min = (await vista(page)).scale;
    expect(min).toBeGreaterThan(0);
    // Mínimo = el menor de 10 px/m de pantalla (plano en mm: 0.001 m/unidad → 0.01) y ¼ del encuadre.
    expect(min).toBeCloseTo(Math.min(10 * 0.001, v0.scale / 4), 9);

    // El botón de ajustar vista vuelve al encuadre de extensión.
    // (el panel de revisión DXF puede quedar encima de los controles flotantes: se despacha el clic al botón)
    await page.getByTitle(/Ajustar vista: centra todo el plano/).dispatchEvent('click');
    await expect.poll(async () => (await vista(page)).scale).toBeCloseTo(v0.scale, 6);
  });

  for (const [w, h] of [[1280, 720], [1920, 1080], [1024, 768]] as const) {
    test(`sin desbordes en ${w}×${h}: barra, menús, visor DXF y panel de revisión`, async ({ page }, info) => {
      test.setTimeout(150_000);
      await page.setViewportSize({ width: w, height: h });
      await entrar(page);
      expect(await desbordes(page), 'inicio').toEqual([]);
      expect(await menusTapados(page), 'menús tapados').toEqual([]);
      for (const id of MENUS) {
        await page.getByTestId(`f12-menu-${id}`).click();
        await expect(page.getByTestId(`f12-menu-${id}-contenido`)).toBeVisible();
        expect(await desbordes(page), `menú ${id}`).toEqual([]);
        await page.keyboard.press('Escape');
        await expect(page.getByTestId(`f12-menu-${id}-contenido`)).toBeHidden();
      }
      await abrirVisorConDxf(page);
      await page.screenshot({ path: info.outputPath(`visor-dxf-${w}x${h}.png`) });
      expect(await desbordes(page), 'visor DXF').toEqual([]);
      await page.getByTestId('dxf-apply-to-canvas').click();
      await expect(page.getByRole('dialog', { name: /Visor DXF/i })).toBeHidden({ timeout: 10_000 });
      await expect(page.getByTestId('dxf-import-review-panel')).toBeVisible();
      await page.screenshot({ path: info.outputPath(`lienzo-${w}x${h}.png`) });
      expect(await desbordes(page), 'lienzo con panel de revisión').toEqual([]);
    });
  }
});
