import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f621_f625_renderer_base_deep');

test('F621-F625 renderer base profundo panel and pointer-safe overlay', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f621-f625-renderer-base-deep');
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f621-f625-status')).toContainText(/renderer-base-deep/i);
  await expect(page.getByTestId('f621-f625-metrics')).toContainText(/Cmd/i);
  await expect(page.getByTestId('f621-f625-gates')).toContainText(/OK/i);

  const overlayPointerEvents = await page.locator('canvas.pointer-events-none').first().evaluate((element) => getComputedStyle(element).pointerEvents);
  expect(overlayPointerEvents).toBe('none');

  await panel.screenshot({ path: join(outDir, '00_renderer_base_deep_panel.png') });
  await page.screenshot({ path: join(outDir, '01_renderer_base_deep_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F621-F625',
    screenshots: ['00_renderer_base_deep_panel.png', '01_renderer_base_deep_canvas.png'],
    pointerEvents: overlayPointerEvents,
  }, null, 2));
});
