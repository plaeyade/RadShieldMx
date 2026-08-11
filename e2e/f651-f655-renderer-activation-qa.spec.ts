import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f651_f655_renderer_activation_qa');

test('F651-F655 renderer activation QA panel', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f651-f655-renderer-activation-qa');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f651-f655-status')).toContainText(/activation-qa/i);
  await expect(page.getByTestId('f651-f655-metrics')).toContainText(/G/i);
  await expect(page.getByTestId('f651-f655-decision')).toContainText(/keep-preview|eligible-for-flagged-e2e|blocked/i);
  await expect(page.getByTestId('f651-f655-risk')).toContainText(/E2E|Ruta|Flag/i);
  await expect(page.getByTestId('f651-f655-gates')).toContainText(/OK|NO/i);

  await panel.screenshot({ path: join(outDir, '00_activation_qa_panel.png') });
  await page.screenshot({ path: join(outDir, '01_activation_qa_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F651-F655',
    screenshots: ['00_activation_qa_panel.png', '01_activation_qa_canvas.png'],
    metrics: await page.getByTestId('f651-f655-metrics').innerText(),
    decision: await page.getByTestId('f651-f655-decision').innerText(),
  }, null, 2));
});
