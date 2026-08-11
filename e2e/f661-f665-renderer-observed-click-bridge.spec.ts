import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f661_f665_renderer_observed_click_bridge');

test('F661-F665 observed click bridge records a real legacy click', async ({ page }) => {
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
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f661-f665-renderer-observed-click-bridge');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f661-f665-receipt')).toContainText(/pendiente/i);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await canvas.click({ position: { x: 420, y: 310 } });
  await expect(page.getByTestId('f661-f665-receipt')).toContainText(/click/i);
  await expect(page.getByTestId('f661-f665-metrics')).toContainText(/pointerdown-legacy/i);
  await expect(page.getByTestId('f661-f665-decision')).toContainText(/keep-preview|eligible-for-controlled-owner-test|blocked/i);
  await expect(page.getByTestId('f661-f665-gates')).toContainText(/Click legacy capturado:OK/i);

  await panel.screenshot({ path: join(outDir, '00_observed_click_bridge_panel.png') });
  await page.screenshot({ path: join(outDir, '01_observed_click_bridge_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F661-F665',
    screenshots: ['00_observed_click_bridge_panel.png', '01_observed_click_bridge_canvas.png'],
    metrics: await page.getByTestId('f661-f665-metrics').innerText(),
    receipt: await page.getByTestId('f661-f665-receipt').innerText(),
    decision: await page.getByTestId('f661-f665-decision').innerText(),
    gates: await page.getByTestId('f661-f665-gates').innerText(),
  }, null, 2));
});
