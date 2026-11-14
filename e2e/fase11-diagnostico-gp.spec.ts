/**
 * Fase 11, seguimiento de #57 (N3) — Tc-99m en concreto por espectro ENSDF con buildup GP (ANSI/ANS-6.4.3), visible en el
 * módulo de Medicina Nuclear (`lib/terapiaEspectroGP`).
 *
 * Valores por omisión del diálogo: 3.7 GBq, 2 m, 40 h/semana, objetivo 100 µSv/semana → K = 0.030·3.7·40/4 =
 * 1.11 mSv/semana, B = 0.0901. Concreto: GP del espectro 152.2 mm (Python, `scripts/fase11_diagnostico_gp.py`); antes,
 * n·TVL de biblioteca de 76 mm sin buildup: 79.4 mm (no conservador). Rige el GP (haz estrecho a 140.5 keV: 69 mm).
 *
 * Local: npx playwright test e2e/fase11-diagnostico-gp.spec.ts --project=chromium (tras `npm run build`).
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

test.describe('Fase 11 — diagnóstico por espectro GP', () => {
  test('Medicina Nuclear: Tc-99m en concreto da 152.2 mm por el GP del espectro (antes 79.4 mm con n·TVL)', async ({ page }) => {
    test.setTimeout(2 * 60_000);
    const errores: string[] = [];
    page.on('pageerror', (e) => errores.push(e.message));
    await entrar(page);
    await page.evaluate(() => (window as unknown as { __radshieldE2E: { abrir: (n: string) => void } }).__radshieldE2E.abrir('nuclearMedicine'));
    await expect(page.getByText('Advanced Nuclear Medicine Shielding Module')).toBeVisible();

    const dialogo = page.locator('[role="dialog"]').filter({ hasText: 'Advanced Nuclear Medicine Shielding Module' });
    await dialogo.getByRole('combobox').first().click();
    await page.getByRole('option', { name: /Tc-99m — Technetium-99m/ }).click();
    await dialogo.getByRole('button', { name: 'Concrete', exact: true }).click();

    await expect(page.getByTestId('nm-metodo')).toContainText('ANS-6.4.3 GP');
    await expect(page.getByTestId('nm-metodo')).toContainText('vs haz estrecho a 140.5 keV');
    await expect(page.getByTestId('nm-metodo')).toContainText('rige: GP espectro');
    await expect(dialogo.getByText('152.2 mm', { exact: true })).toBeVisible();
    expect(errores).toEqual([]);
  });
});
