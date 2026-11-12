/**
 * Fase 11, etapa 8 — el diálogo «Layout de búnker» (vista Factibilidad → «Enviar a calculo») muestra los espesores del
 * motor validado.
 *
 * Con el perfil por omisión del diálogo la mejor opción es Gamma Knife (Co-60). Valores esperados, calculados a mano:
 * K = 15 Gy/fracción × 120 fracciones/semana / d² (sin autoblindaje), B = P/(T·K), t = log₁₀(1/B) × 210 mm
 * (TVL de Co-60 en concreto, NCRP 151 Tabla B.2). Con `uaqProtocol` (sin T) Este/Oeste daban 1242.4 mm.
 * Contra el build de Pages: PLAYWRIGHT_NO_WEBSERVER=1 PLAYWRIGHT_TEST_BASE_URL=http://host/RadShieldMx/
 */
import { test, expect } from '@playwright/test';

const esperado: [barrera: string, d_m: number, T: number, P_mSv: number][] = [
  ['Norte', 8, 0.5, 0.1],
  ['Sur', 16 / 2.4, 1, 0.02],
  ['Este', 6, 0.25, 0.1],
  ['Oeste', 6, 0.25, 0.1],
  ['Techo', 3, 1, 0.02],
];
const espesorGK = (d: number, T: number, P: number) => Math.round(Math.log10((T * (15 * 120 * 1000)) / (d * d) / P) * 210 * 10) / 10;

test('Layout de búnker: «Enviar a calculo» muestra los espesores del motor (Gamma Knife con T)', async ({ page }) => {
  test.setTimeout(2 * 60_000);
  const errores: string[] = [];
  page.on('pageerror', (e) => errores.push(e.message));
  await page.addInitScript(() => {
    try {
      localStorage.setItem('radshield-tour-completed', 'true');
      localStorage.setItem('radshield-e2e-controls', 'true');
    } catch { /* sin almacenamiento */ }
  });
  await page.goto('./', { waitUntil: 'networkidle' });
  const continuar = page.getByText('Continuar');
  if (await continuar.count()) await continuar.first().click();

  await page.getByTestId('e2e-open-layout-bunker').click();
  const shell = page.getByTestId('f395-layout-bunker-fullscreen-shell');
  await expect(shell).toBeVisible({ timeout: 15_000 });

  // Selector de vista (Select de Radix): el primero del encabezado.
  await shell.getByRole('combobox').first().click();
  await page.getByRole('option', { name: 'Factibilidad' }).click();
  const panel = page.getByTestId('layout-feasibility-panel');
  await expect(panel).toBeVisible();

  await panel.getByRole('button', { name: /Enviar a calculo/ }).click();
  // Tabla del plan preliminar (el panel tiene además una tabla de semillas por opción).
  const filas = panel.getByTestId('zona-plan-calculos').locator('tbody tr');
  await expect(filas).toHaveCount(esperado.length);

  for (const [i, [barrera, d, T, P]] of esperado.entries()) {
    const celdas = filas.nth(i).locator('td');
    await expect(celdas.nth(0)).toHaveText(barrera);
    await expect(celdas.nth(1)).toHaveText('GammaKnife');
    await expect(celdas.nth(4)).toHaveText(`${espesorGK(d, T, P)} mm`);
  }
  expect(errores).toEqual([]);
});
