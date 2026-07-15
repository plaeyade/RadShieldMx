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
    await expect(page.getByRole('button', { name: /Nuevo Proyecto/i }).first()).toBeVisible();
  });

  test('Welcome muestra opciones de inicio', async ({ page }) => {
    await page.goto(BASE);
    await closeSplashIfVisible(page);
    await expect(page.getByRole('button', { name: /Nuevo Proyecto/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Importar Plano/i }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /R&F Room/i })).toBeVisible();
  });

  test('Cargar demo data y verificar fuentes', async ({ page }) => {
    await bootWorkspace(page);
    await expect(page.getByRole('textbox').first()).toHaveValue(/Demo - R&F Room/);
    await expect(page.getByText('Fuentes:')).toBeVisible();
    await expect(page.getByText('Barreras:')).toBeVisible();
    await expect(page.locator('strong').filter({ hasText: '3' }).first()).toBeVisible();
    await expect(page.locator('strong').filter({ hasText: '5' }).first()).toBeVisible();
  });

  test('Toolbar muestra todos los menus principales', async ({ page }) => {
    await bootWorkspace(page);
    await expect(page.getByRole('button', { name: /Archivo/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Diseno|Diseño/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /^Calcular$/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /Fisica|Física/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Med\. Nuclear/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Normativa/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Reportes/i })).toBeVisible();
    await expect(page.getByRole('button', { name: /Herramientas/i })).toBeVisible();
  });

  test('Abrir Update Center desde menu', async ({ page }) => {
    await bootWorkspace(page);
    await page.getByRole('button', { name: /Update/i }).click();
    await expect(page.getByText('RadShield-MX Update Center')).toBeVisible();
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
    await page.getByRole('button', { name: /Herramientas/i }).click();
    await page.getByText('AI Shielding Assistant').click();
    await expect(page.getByRole('heading', { name: /RadShield AI Assistant RAG/i })).toBeVisible();
    await page.getByPlaceholder(/Pregunta con RAG|Pregunta directa/i).fill('TVL concreto 6 MV');
    await page.getByRole('button', { name: /Enviar pregunta AI/i }).click();
    await expect(page.getByText(/Modo estatico\/offline activo/i)).toBeVisible({ timeout: 10000 });
  });

  test('Cloud Sync abre en modo offline sin backend remoto', async ({ page }) => {
    await bootWorkspace(page);
    await page.getByRole('button', { name: /Herramientas/i }).click();
    await page.getByText('Cloud Sync').click();
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
