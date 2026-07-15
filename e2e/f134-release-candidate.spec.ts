import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs');
const screenshotPath = path.join(outputDir, 'f134_release_candidate_browser_smoke.png');
const jsonPath = path.join(outputDir, 'f134_release_candidate_browser_smoke.json');
const mdPath = path.join(outputDir, 'fase_134_release_candidate_browser_smoke.md');

const checks: Array<{ name: string; ok: boolean; detail?: Record<string, unknown> }> = [];

function addCheck(name: string, ok: boolean, detail?: Record<string, unknown>) {
  checks.push({ name, ok, detail });
}

test.describe('F134 release-candidate browser smoke', () => {
  test('loads release shell, canvas and Update Center evidence cards', async ({ page }) => {
    test.setTimeout(90_000);
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    const canonicalMenus = ['Archivo', 'Diseno', 'Equipos', 'Blindaje', 'Verificacion', 'Reportes', 'Evidencia', 'Integraciones'];
    for (const menu of canonicalMenus) {
      await expect(page.getByRole('button', { name: new RegExp(menu, 'i') }).first()).toBeVisible({ timeout: 15000 });
      addCheck(`topbar:${menu}`, true);
    }

    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect(canvas).toBeVisible({ timeout: 15000 });
    const canvasBox = await canvas.boundingBox();
    const canvasSized = Boolean(canvasBox && canvasBox.width > 400 && canvasBox.height > 300);
    addCheck('canvas:f100-main-floorplan-canvas-visible-and-sized', canvasSized, {
      width: canvasBox?.width,
      height: canvasBox?.height,
    });
    expect(canvasSized).toBe(true);

    for (const testId of [
      'canvas-workflow-panel',
      'f99-cad-like-readiness-panel',
      'f122-structural-overlay-panel',
    ]) {
      const locator = page.getByTestId(testId);
      await locator.scrollIntoViewIfNeeded().catch(() => undefined);
      await expect(locator).toBeVisible({ timeout: 10000 });
      addCheck(`canvas-panel:${testId}`, true);
    }

    for (const text of ['Acceso Rapido', 'Herramientas de Dibujo', 'F90 67%', 'F91 55%', 'F99 69%', 'F122 5/5']) {
      await expect(page.getByText(text).first()).toBeVisible({ timeout: 10000 });
      addCheck(`visible-text:${text}`, true);
    }

    await page.getByRole('button', { name: /Update/i }).click();
    await expect(page.getByRole('heading', { name: /Centro de Actualizaciones/i })).toBeVisible({ timeout: 10000 });
    addCheck('update-center:opened', true);

    for (const testId of [
      'f131-fullstack-live-smoke',
      'f132-rc-persistence-smoke',
      'f133-api-authenticated-smoke',
      'f134-browser-rc-smoke',
    ]) {
      const card = page.getByTestId(testId);
      await card.scrollIntoViewIfNeeded();
      await expect(card).toBeVisible({ timeout: 10000 });
      await expect(card).toContainText(/Estado: ready|Status: ready/i);
      addCheck(`update-card:${testId}`, true);
    }

    await mkdir(outputDir, { recursive: true });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    addCheck('evidence:screenshot-created', true, { path: screenshotPath });

    const output = {
      phase: 'F134',
      status: checks.every((check) => check.ok) ? 'ready' : 'partial',
      generatedAt: new Date().toISOString(),
      browser: 'playwright-chromium',
      screenshot: 'outputs/f134_release_candidate_browser_smoke.png',
      checks,
      decision: 'Release-candidate browser smoke passed: shell, canvas panels and Update Center DB/API evidence are visible.',
    };

    await writeFile(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    await writeFile(
      mdPath,
      [
        '# F134 Release Candidate Browser Smoke',
        '',
        `Status: ${output.status}`,
        `Generated: ${output.generatedAt}`,
        `Screenshot: ${output.screenshot}`,
        '',
        '## Checks',
        ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
        '',
        output.decision,
        '',
      ].join('\n'),
      'utf8',
    );
  });
});
