import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f631_f635_renderer_tile_invalidation');

test('F631-F635 renderer tile invalidation panel and overlay', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 960 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f631-f635-renderer-tile-invalidation');
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f631-f635-status')).toContainText(/tile-invalidation/i);
  await expect(page.getByTestId('f631-f635-metrics')).toContainText(/Tiles/i);
  await expect(page.getByTestId('f631-f635-gates')).toContainText(/OK/i);

  await panel.screenshot({ path: join(outDir, '00_tile_invalidation_panel.png') });
  await page.screenshot({ path: join(outDir, '01_tile_invalidation_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F631-F635',
    screenshots: ['00_tile_invalidation_panel.png', '01_tile_invalidation_canvas.png'],
    metrics: await page.getByTestId('f631-f635-metrics').innerText(),
  }, null, 2));
});
