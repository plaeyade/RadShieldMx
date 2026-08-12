import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f666_f670_renderer_selection_stabilizer');

test('F666-F670 selection stabilizer samples selection after legacy click', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
    localStorage.removeItem('radshield_canvas_f661_last_click');
    localStorage.removeItem('radshield_canvas_f666_selection_sample');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f666-f670-renderer-selection-stabilizer');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f666-f670-metrics')).toContainText(/S NO/i);

  await page.getByTestId('f100-main-floorplan-canvas').click({ position: { x: 420, y: 310 } });
  await expect(page.getByTestId('f666-f670-metrics')).toContainText(/S SI/i, { timeout: 5000 });
  await expect(page.getByTestId('f666-f670-decision')).toContainText(/keep-preview|eligible-for-owner-smoke|blocked/i);
  await expect(page.getByTestId('f666-f670-gates')).toContainText(/Muestra diferida:OK/i);

  await panel.screenshot({ path: join(outDir, '00_selection_stabilizer_panel.png') });
  await page.screenshot({ path: join(outDir, '01_selection_stabilizer_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F666-F670',
    screenshots: ['00_selection_stabilizer_panel.png', '01_selection_stabilizer_canvas.png'],
    metrics: await page.getByTestId('f666-f670-metrics').innerText(),
    sample: await page.getByTestId('f666-f670-sample').innerText(),
    decision: await page.getByTestId('f666-f670-decision').innerText(),
    gates: await page.getByTestId('f666-f670-gates').innerText(),
  }, null, 2));
});
