/**
 * Cierre con Escape de las ventanas propias (DialogShell, FullscreenShell y CapaModal).
 *
 * QA de la Fase 12 (`noCierraConEsc` en medidas_dialogos.json): estas ventanas `role="dialog" aria-modal` sólo cerraban
 * con la X. Abre cada una desde su menú, comprueba que el foco entró en la ventana, pulsa Escape y verifica que se cierra y
 * que el foco vuelve al botón del menú que la abrió. Además: un menú desplegable de Radix abierto dentro de una ventana se
 * cierra primero (la ventana sigue abierta) y el paquete de evidencia pide confirmación si hay cambios sin exportar.
 *
 * Local: npm run build && npx playwright test e2e/escape-dialogos.spec.ts --project=chromium --workers=1
 */
import { test, expect, type Page } from '@playwright/test';
import { abrirMenu, bootWorkspace } from './helpers';

const VENTANAS: Array<{ menu: string; item: string }> = [
  { menu: 'proyecto', item: 'Historial de versiones' },
  { menu: 'fuentes', item: 'Control Points' },
  { menu: 'fuentes', item: 'CBCT/IGRT' },
  { menu: 'fuentes', item: 'Cyclone KIUBE' },
  { menu: 'barreras', item: 'Skyshine' },
  { menu: 'barreras', item: 'AAPM TG-108 (PET)' },
  { menu: 'barreras', item: 'IPEM 109 (SPECT)' },
  { menu: 'barreras', item: 'Terapia con radionúclidos' },
  { menu: 'barreras', item: 'Blindaje Equipos' },
  { menu: 'verificacion', item: 'Validación NCRP' },
  { menu: 'verificacion', item: 'Verificación del blindaje' },
  { menu: 'reportes', item: 'Dashboard de Calculos' },
  { menu: 'reportes', item: 'Paquete de evidencia' },
  { menu: 'reportes', item: 'Biblioteca de referencias' },
  { menu: 'reportes', item: 'Bibliografía' },
  { menu: 'reportes', item: 'Especificaciones Tecnicas' },
  { menu: 'ayuda', item: 'Manual' },
  { menu: 'ayuda', item: 'Glosario' },
  { menu: 'ayuda', item: 'Acerca de' },
];

const escaparRegex = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

async function abrirVentana(page: Page, menu: string, item: string) {
  await abrirMenu(page, menu);
  await page
    .getByTestId(`f12-menu-${menu}-contenido`)
    .getByRole('menuitem')
    .filter({ hasText: new RegExp(`^${escaparRegex(item)}`) })
    .first()
    .click();
  // El menú de Radix se cierra con animación; mientras sigue montado, Escape es suyo.
  await expect(page.getByTestId(`f12-menu-${menu}-contenido`)).toHaveCount(0);
  const ventana = page.locator('[data-cierre-escape="true"]');
  await expect(ventana).toHaveCount(1, { timeout: 15_000 });
  await expect(ventana).toBeVisible();
  await expect(ventana).toHaveAttribute('aria-modal', 'true');
  return ventana;
}

test.describe('Escape cierra las ventanas propias', () => {
  test.beforeEach(async ({ page }) => {
    await bootWorkspace(page);
  });

  for (const { menu, item } of VENTANAS) {
    test(`${menu} › ${item}`, async ({ page }) => {
      const errores: string[] = [];
      page.on('pageerror', (e) => errores.push(e.message));
      const ventana = await abrirVentana(page, menu, item);
      // El foco entró en la ventana (Escape llega a su oyente sin hacer clic).
      await expect.poll(() => ventana.evaluate((el) => el.contains(document.activeElement))).toBe(true);
      await page.keyboard.press('Escape');
      await expect(page.locator('[data-cierre-escape="true"]')).toHaveCount(0);
      await expect(page.locator('[role="dialog"][aria-modal="true"]')).toHaveCount(0);
      // El foco vuelve al botón del menú que abrió la ventana.
      await expect(page.getByTestId(`f12-menu-${menu}`)).toBeFocused();
      expect(errores).toEqual([]);
    });
  }

  test('un menú abierto dentro de la ventana se cierra primero; la ventana, con el segundo Escape', async ({ page }) => {
    const ventana = await abrirVentana(page, 'fuentes', 'CBCT/IGRT');
    const selector = ventana.getByRole('combobox').first();
    await selector.click();
    await expect(page.getByRole('listbox')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('listbox')).toHaveCount(0);
    await expect(ventana).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-cierre-escape="true"]')).toHaveCount(0);
  });

  test('paquete de evidencia: con cambios sin exportar Escape pide confirmación', async ({ page }) => {
    const ventana = await abrirVentana(page, 'reportes', 'Paquete de evidencia');
    await ventana.getByRole('textbox').first().fill('Proyecto editado');
    const mensajes: string[] = [];
    page.once('dialog', (d) => { mensajes.push(d.message()); void d.dismiss(); });
    await page.keyboard.press('Escape');
    await expect.poll(() => mensajes.length).toBe(1);
    expect(mensajes[0]).toMatch(/cambios sin exportar/);
    await expect(ventana).toBeVisible();
    page.once('dialog', (d) => { void d.accept(); });
    await page.keyboard.press('Escape');
    await expect(page.locator('[data-cierre-escape="true"]')).toHaveCount(0);
  });
});
