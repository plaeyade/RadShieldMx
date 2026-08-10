import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f636_f640_renderer_hit_test_shadow');

test('F636-F640 renderer hit-test shadow panel and overlay', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f636-f640-renderer-hit-test-shadow');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f636-f640-status')).toContainText(/hit-test-shadow/i);
  await expect(page.getByTestId('f636-f640-metrics')).toContainText(/T/i);
  await expect(page.getByTestId('f636-f640-probe')).toContainText(/preview-only|candidate-select-ready/i);
  await expect(page.getByTestId('f636-f640-gates')).toContainText(/OK/i);

  await panel.screenshot({ path: join(outDir, '00_hit_test_shadow_panel.png') });
  await page.screenshot({ path: join(outDir, '01_hit_test_shadow_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F636-F640',
    screenshots: ['00_hit_test_shadow_panel.png', '01_hit_test_shadow_canvas.png'],
    metrics: await page.getByTestId('f636-f640-metrics').innerText(),
    probe: await page.getByTestId('f636-f640-probe').innerText(),
  }, null, 2));
});
