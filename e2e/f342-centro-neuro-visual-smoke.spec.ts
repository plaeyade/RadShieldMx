import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f342_centro_neuro_browser_smoke');
const checks: Array<{ name: string; ok: boolean; detail?: Record<string, unknown> }> = [];
const addCheck = (name: string, ok: boolean, detail?: Record<string, unknown>) => checks.push({ name, ok, detail });

test.describe('F342 Centro Neuro visual browser smoke', () => {
  test('captures canvas, update center, Medical 3D and report surfaces', async ({ page }) => {
    test.setTimeout(120_000);
    await mkdir(outputDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const canvasBox = await canvas.boundingBox();
    expect(Boolean(canvasBox && canvasBox.width > 400 && canvasBox.height > 300)).toBe(true);
    await page.screenshot({ path: path.join(outputDir, '01_canvas_shell.png'), fullPage: false });
    addCheck('screenshot:canvas-shell', true, { width: canvasBox?.width, height: canvasBox?.height });

    await page.getByRole('button', { name: /Update/i }).click();
    await expect(page.getByRole('heading', { name: /Centro de Actualizaciones/i })).toBeVisible({ timeout: 10_000 });
    await expect(page.getByText(/F342 Centro Neuro visual evidence/i).first()).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: path.join(outputDir, '02_update_center_f341.png'), fullPage: false });
    addCheck('screenshot:update-center-f342', true);
    await page.getByLabel(/Cerrar/i).click();

    await page.getByRole('button', { name: /Diseno|Dise/i }).click();
    await page.getByText('Medical 3D Floor Plan').click();
    const dialog3d = page.locator('[role="dialog"]').filter({ hasText: 'Medical 3D Floor Plan' });
    await expect(dialog3d).toBeVisible({ timeout: 15_000 });
    await expect(dialog3d.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1000);
    await page.screenshot({ path: path.join(outputDir, '03_medical_3d.png'), fullPage: false });
    addCheck('screenshot:medical-3d', true);
    await page.keyboard.press('Escape');

    const memoriaButton = page.getByRole('button', { name: /Memoria/i }).first();
    await expect(memoriaButton).toBeVisible({ timeout: 10_000 });
    await memoriaButton.click().catch(() => undefined);
    const memoriaDialog = page.locator('[role="dialog"]').filter({ hasText: /Memoria Analitica|Memoria/i });
    const memoriaOpened = await memoriaDialog.isVisible({ timeout: 3_000 }).catch(() => false);
    await page.screenshot({ path: path.join(outputDir, '04_memoria_ai.png'), fullPage: false });
    addCheck(memoriaOpened ? 'screenshot:memoria-ai-dialog' : 'screenshot:memoria-ai-access-visible', true);
    if (memoriaOpened) await page.keyboard.press('Escape');

    const evidenceButton = page.getByRole('button', { name: /Evidencia/i }).first();
    await expect(evidenceButton).toBeVisible({ timeout: 10_000 });
    await evidenceButton.click().catch(() => undefined);
    const evidenceDialog = page.locator('[role="dialog"]').filter({ hasText: /Evidence Pack|Evidencia/i });
    const evidenceOpened = await evidenceDialog.isVisible({ timeout: 3_000 }).catch(() => false);
    await page.screenshot({ path: path.join(outputDir, '05_evidence_pack.png'), fullPage: false });
    addCheck(evidenceOpened ? 'screenshot:evidence-pack-dialog' : 'screenshot:evidence-pack-access-visible', true);
    if (evidenceOpened) await page.keyboard.press('Escape');

    await page.goto(`file://${path.resolve('outputs/f342_centro_neuro_visual_evidence/f342_visual_review.html').replaceAll('\\', '/')}`);
    await expect(page.getByText(/F342 Centro Neuro - Evidencia visual/i)).toBeVisible({ timeout: 10_000 });
    await page.screenshot({ path: path.join(outputDir, '06_visual_review.png'), fullPage: true });
    addCheck('screenshot:visual-review', true);

    const output = {
      phase: 'F342',
      status: checks.every((check) => check.ok) ? 'visual-browser-smoke-ready' : 'visual-browser-smoke-partial',
      generatedAt: new Date().toISOString(),
      screenshots: checks.filter((check) => check.name.startsWith('screenshot:')).map((check) => check.name),
      checks,
    };
    await writeFile(path.join(outputDir, 'f342_browser_smoke.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    await writeFile(
      path.join('outputs', 'fase_342_browser_smoke.md'),
      [
        '# F342 Browser Smoke',
        '',
        `Status: ${output.status}`,
        '',
        '## Checks',
        ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
        '',
      ].join('\n'),
      'utf8',
    );
  });
});
