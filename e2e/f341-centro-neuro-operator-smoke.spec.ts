import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f341_centro_neuro_browser_smoke');
const screenshotPath = path.join(outputDir, 'f341_app_canvas_update_center.png');
const jsonPath = path.join(outputDir, 'f341_browser_smoke.json');
const mdPath = path.join('outputs', 'fase_341_browser_smoke.md');

test.describe('F341 Centro Neuro browser smoke', () => {
  test('shows shell, canvas and F341 Update Center evidence', async ({ page }) => {
    test.setTimeout(90_000);
    await mkdir(outputDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    const checks: Array<{ name: string; ok: boolean; detail?: Record<string, unknown> }> = [];
    const addCheck = (name: string, ok: boolean, detail?: Record<string, unknown>) => checks.push({ name, ok, detail });

    for (const menu of ['Archivo', 'Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones']) {
      await expect(page.getByRole('button', { name: new RegExp(menu, 'i') }).first()).toBeVisible({ timeout: 15_000 });
      addCheck(`topbar:${menu}`, true);
    }

    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const canvasBox = await canvas.boundingBox();
    const canvasReady = Boolean(canvasBox && canvasBox.width > 400 && canvasBox.height > 300);
    expect(canvasReady).toBe(true);
    addCheck('canvas:visible-sized', canvasReady, { width: canvasBox?.width, height: canvasBox?.height });

    for (const testId of ['f186-sidebar-stable-width', 'f191-pyrate-inspired-toolbar']) {
      await expect(page.getByTestId(testId)).toBeVisible({ timeout: 10_000 });
      addCheck(`canvas-surface:${testId}`, true);
    }
    await expect(page.getByText(/F214 Studio/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/F217 Export/i).first()).toBeVisible({ timeout: 10_000 });
    addCheck('canvas-surface:studio-export-panels', true);

    await page.getByRole('button', { name: /Update/i }).click();
    await expect(page.getByRole('heading', { name: /Centro de Actualizaciones/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/F341 Centro Neuro calibrated trial/i).first()).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/escala 1:100/i).first()).toBeVisible({ timeout: 10_000 });
    addCheck('update-center:f341-visible', true);

    await page.screenshot({ path: screenshotPath, fullPage: true });
    addCheck('evidence:screenshot-created', true, { path: screenshotPath });

    const output = {
      phase: 'F341',
      status: checks.every((check) => check.ok) ? 'browser-smoke-ready' : 'browser-smoke-partial',
      generatedAt: new Date().toISOString(),
      screenshot: 'outputs/f341_centro_neuro_browser_smoke/f341_app_canvas_update_center.png',
      checks,
    };
    await writeFile(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    await writeFile(
      mdPath,
      [
        '# F341 Browser Smoke',
        '',
        `Status: ${output.status}`,
        `Screenshot: ${output.screenshot}`,
        '',
        '## Checks',
        ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
        '',
      ].join('\n'),
      'utf8',
    );
  });
});
