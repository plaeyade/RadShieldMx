/**
 * Fase 11 — I-131 por espectro completo con buildup GP (ANSI/ANS-6.4.3) y regla «el mayor entre haz estrecho a
 * 722.9 keV y haz ancho» (`lib/terapiaEspectroGP`), visible en el módulo de Medicina Nuclear.
 *
 * Valores por omisión del diálogo: 3.7 GBq, 2 m, 40 h/semana, objetivo 100 µSv/semana → K = 0.059·3.7·40/4 =
 * 2.183 mSv/semana, B = 0.0458. En plomo rige el haz estrecho a 722.9 keV (µ = 1.134 cm⁻¹, NIST): 27.2 mm
 * (antes 13.4 mm con la TVL de biblioteca de 10 mm).
 *
 * Local: npx playwright test e2e/fase11-terapia-gp.spec.ts --project=chromium (tras `npm run build`).
 */
import { test, expect, type Page } from '@playwright/test';

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

test.describe('Fase 11 — terapia I-131 con buildup GP', () => {
  test('Medicina Nuclear: I-131 en plomo da 27.2 mm por haz estrecho a 722.9 keV (regla ANS-6.4.3)', async ({ page }) => {
    test.setTimeout(2 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await page.evaluate(() => (window as unknown as { __radshieldE2E: { abrir: (n: string) => void } }).__radshieldE2E.abrir('nuclearMedicine'));
    await expect(page.getByText('Advanced Nuclear Medicine Shielding Module')).toBeVisible();

    const dialogo = page.locator('[role="dialog"]').filter({ hasText: 'Advanced Nuclear Medicine Shielding Module' });
    await dialogo.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /I-131 — Iodine-131 \(NaI\)/ }).click();

    await expect(page.getByTestId('nm-metodo')).toContainText('ANS-6.4.3');
    await expect(page.getByTestId('nm-metodo')).toContainText('rige: haz estrecho');
    await expect(dialogo.getByText('27.2 mm', { exact: true })).toBeVisible();
    expect(errores).toEqual([]);
  });
});
