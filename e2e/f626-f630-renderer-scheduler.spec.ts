import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f626_f630_renderer_scheduler');

test('F626-F630 renderer scheduler panel and cache signature', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f626-f630-renderer-scheduler');
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f626-f630-status')).toContainText(/renderer-scheduler/i);
  await expect(page.getByTestId('f626-f630-metrics')).toContainText(/Q/i);
  await expect(page.getByTestId('f626-f630-invalidation')).toContainText(/f626-/i);
  await expect(page.locator('canvas.pointer-events-none').first()).toBeVisible();

  await panel.screenshot({ path: join(outDir, '00_renderer_scheduler_panel.png') });
  await page.screenshot({ path: join(outDir, '01_renderer_scheduler_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F626-F630',
    screenshots: ['00_renderer_scheduler_panel.png', '01_renderer_scheduler_canvas.png'],
    cache: await page.getByTestId('f626-f630-invalidation').innerText(),
  }, null, 2));
});
