/**
 * C.8: E2E Tests con Playwright
 * Tests de flujo completo para RadShield-MX
 */
import { test, expect } from '@playwright/test';
import { BASE, bootWorkspace, closeSplashIfVisible, disableBlockingOnboarding } from './helpers';

test.describe('RadShield-MX - Flujos Criticos', () => {
  test.describe.configure({ mode: 'parallel' });

  test('SplashScreen se muestra al cargar', async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole('heading', { name: /RadShield-MX/i })).toBeVisible();
    await expect(page.getByText('Professional Radiation Shielding Design')).toBeVisible();
    await expect(page.getByText(/v127.*2022-2026/)).toBeVisible();
  });

  test('SplashScreen se cierra al hacer clic en Continuar', async ({ page }) => {
    await page.goto(BASE);
    await closeSplashIfVisible(page);
    await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible({ timeout: 15000 });
  });

  // Fase 10: la pantalla de bienvenida y el demo R&F se retiraron; el lienzo vacío ofrece estas acciones
  // (el arranque vacío completo lo cubren fase10-inicio.spec.ts y fase10-pages-arranque.spec.ts).
  test('Estado vacío muestra opciones de inicio', async ({ page }) => {
    await bootWorkspace(page);
    await expect(page.getByRole('button', { name: /Guíame paso a paso/i })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Importar DXF', exact: true })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Abrir proyecto', exact: true })).toBeVisible();
  });

  test('Toolbar muestra todos los menus principales', async ({ page }) => {
    await bootWorkspace(page);
    await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible();
    // Menús canónicos desde F97–F110 (Física, Med. Nuclear, Normativa y Herramientas quedaron como respaldo oculto).
    for (const menu of ['Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones']) {
      await expect(page.getByRole('button', { name: menu, exact: true }).first()).toBeVisible();
    }
  });

  test('Abrir Update Center desde menu', async ({ page }) => {
    await bootWorkspace(page);
    await page.getByRole('button', { name: 'Update Center', exact: true }).click();
    await expect(page.getByText('Centro de Actualizaciones').first()).toBeVisible();
  });

  test('Dark mode toggle funciona', async ({ page }) => {
    await bootWorkspace(page);
    const darkToggle = page.getByRole('button', { name: /dark|light/i }).first();
    await darkToggle.click();
    await expect(page.locator('html')).toHaveClass(/dark/);
  });

  test('Keyboard shortcuts dialog se abre', async ({ page }) => {
    await bootWorkspace(page);
    await page.getByRole('button', { name: 'Keys' }).click();
    await expect(page.getByText(/Atajos de Teclado|Keyboard/i)).toBeVisible();
  });

  test('AI Assistant responde en modo estatico/offline', async ({ page }) => {
    await bootWorkspace(page);
    await page.getByTestId('f110-migrated-evidence-dropdown').click();
    await page.getByText('AI source review', { exact: true }).click();
    await expect(page.getByRole('heading', { name: /RadShield AI Assistant RAG/i })).toBeVisible();
    await page.getByPlaceholder(/Pregunta con RAG|Pregunta directa/i).fill('TVL concreto 6 MV');
    await page.getByRole('button', { name: /Enviar pregunta AI/i }).click();
    await expect(page.getByText(/Modo estatico\/offline activo/i)).toBeVisible({ timeout: 10000 });
  });

  test('Cloud Sync abre en modo offline sin backend remoto', async ({ page }) => {
    // Cloud Sync ya no tiene entrada visible en la barra (sólo el respaldo oculto); se abre con el gancho E2E del store.
    await page.addInitScript(() => localStorage.setItem('radshield-e2e-controls', 'true'));
    await bootWorkspace(page);
    await page.waitForFunction(() => Boolean((window as unknown as { __radshieldE2E?: unknown }).__radshieldE2E));
    await page.evaluate(() => (window as unknown as { __radshieldE2E: { abrir: (n: string) => void } }).__radshieldE2E.abrir('cloudSync'));
    await expect(page.getByRole('heading', { name: /Cloud Sync & Backup/i })).toBeVisible();
    await expect(page.getByText('Server Offline')).toBeVisible();
    await expect(page.getByText('Not Connected')).toBeVisible();
  });

  test('Login Kimi queda deshabilitado sin OAuth configurado', async ({ page }) => {
    await page.goto(new URL('#/login', BASE).toString());
    await expect(page.getByRole('button', { name: /Kimi OAuth no configurado/i })).toBeDisabled();
    await page.getByRole('button', { name: /Continuar sin sesion/i }).click();
    await expect(page).toHaveURL(BASE);
  });

  test('Toolbar login no navega a endpoint OAuth inexistente en modo estatico', async ({ page }) => {
    const oauth404s: string[] = [];
    page.on('response', response => {
      if (response.status() === 404 && response.url().includes('/api/oauth')) oauth404s.push(response.url());
    });
    await bootWorkspace(page);
    await page.getByRole('button', { name: /Entrar/i }).click();
    await expect(page).toHaveURL(BASE);
    expect(page.url()).not.toContain('/api/oauth');
    expect(oauth404s).toHaveLength(0);
  });

  test('No hay errores de consola al cargar', async ({ page }) => {
    await disableBlockingOnboarding(page);
    const errors: string[] = [];
    const missingResponses: string[] = [];
    page.on('response', response => {
      if (response.status() === 404) missingResponses.push(response.url());
    });
    page.on('console', msg => {
      if (msg.type() !== 'error') return;
      const text = msg.text();
      if (text.includes("frame-ancestors") && text.includes("<meta>")) return;
      if (text === 'Failed to load resource: the server responded with a status of 404 (File not found)') return;
      errors.push(text);
    });
    await page.goto(BASE);
    await closeSplashIfVisible(page);
    await page.waitForTimeout(3000);
    expect(missingResponses).toHaveLength(0);
    expect(errors).toHaveLength(0);
  });

  test('Responsive: canvas se adapta al viewport', async ({ page }) => {
    await bootWorkspace(page);
    await page.setViewportSize({ width: 1280, height: 720 });
    const canvas = page.locator('canvas').first();
    await expect(canvas).toBeVisible();
    const box = await canvas.boundingBox();
    expect(box).toBeTruthy();
    expect(box!.width).toBeGreaterThan(400);
    expect(box!.height).toBeGreaterThan(300);
  });
});
