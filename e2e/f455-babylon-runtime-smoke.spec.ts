import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f455_babylon_runtime_smoke');


// Vista 3D Babylon activa por omisión desde el 23-11-2026 (VISOR_3D_BABYLON). Contra un build con
// VITE_VISOR_3D_BABYLON=false, ejecutar con E2E_VISOR_3D_BABYLON=0 para omitir/invertir esta prueba.
const VISOR_3D_BABYLON = process.env.E2E_VISOR_3D_BABYLON !== '0';
test.skip(!VISOR_3D_BABYLON, 'Babylon desactivado (E2E_VISOR_3D_BABYLON=0); ver docs/plan-motores-calculo.md');

test('F455 opens Medical 3D and renders Babylon runtime smoke preview', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
  const erroresBabylon: string[] = [];
  page.on('pageerror', (error) => { if (/babylon|BJS|effect|shader/i.test(String(error?.stack || error))) erroresBabylon.push(String(error)); });
  page.on('console', (msg) => {
    if (msg.type() === 'error' && /BJS|babylon|effect|shader|glTF/i.test(msg.text())) erroresBabylon.push(msg.text());
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await page.getByTestId('e2e-open-medical-3d').click();

  await expect(page.getByTestId('f307-f309-render-engine-selector')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f455-babylon-runtime-smoke')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-canvas')).toBeVisible();
  await expect(page.getByTestId('f455-babylon-runtime-status')).toContainText(/ready|loading/, { timeout: 30_000 });
  // Fase 13: Babylon se importa por módulos individuales (src/lib/medical3D/babylonModulos.ts); si faltara un módulo
  // o un efecto secundario, la escena fallaría al crearse o Babylon registraría errores de efecto/shader en consola.
  const status = page.getByTestId('f455-babylon-runtime-status');
  await expect(status).toHaveText(/^(ready|failed|sin-webgl)$/, { timeout: 60_000 });
  const estadoFinal = (await status.textContent())?.trim();
  const mensajeFinal = await page.getByTestId('f455-babylon-runtime-mensaje').textContent();
  expect(estadoFinal, `vista Babylon: ${mensajeFinal}`).not.toBe('failed');
  if (estadoFinal === 'ready') {
    await page.waitForTimeout(1_500);
    expect(erroresBabylon, 'errores de Babylon en consola').toEqual([]);
  }

  const cardBox = await page.getByTestId('f455-babylon-runtime-smoke').evaluate((node) => {
    const box = (node as HTMLElement).getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  });
  expect(cardBox.width).toBeGreaterThan(180);
  expect(cardBox.height).toBeGreaterThan(120);

  const screenshot = path.join(outputDir, '01_babylon_runtime_smoke_dialog.png');
  const previewScreenshot = path.join(outputDir, '02_babylon_runtime_smoke_card.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.getByTestId('f455-babylon-runtime-smoke').screenshot({ path: previewScreenshot });
  await writeFile(
    path.join(outputDir, 'f455_babylon_runtime_smoke_e2e.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f455.babylon-runtime-smoke-ui.v1',
      status: 'babylon-runtime-smoke-visible',
      generatedAt: new Date().toISOString(),
      screenshot,
      previewScreenshot,
      checks: [
        'main canvas remains visible',
        'Medical 3D dialog opens',
        'Babylon smoke card visible',
        'Babylon runtime canvas visible',
        'visual screenshot captured',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
