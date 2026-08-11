import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f656_f660_renderer_legacy_click_probe');

test('F656-F660 renderer legacy click probe panel', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f656-f660-renderer-legacy-click-probe');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f656-f660-status')).toContainText(/legacy-click-probe/i);
  await expect(page.getByTestId('f656-f660-metrics')).toContainText(/G/i);
  await expect(page.getByTestId('f656-f660-decision')).toContainText(/keep-preview|eligible-for-owner-flag|blocked/i);
  await expect(page.getByTestId('f656-f660-safety')).toContainText(/Owner|useCanvas|preview/i);
  await expect(page.getByTestId('f656-f660-gates')).toContainText(/OK|NO/i);

  await panel.screenshot({ path: join(outDir, '00_legacy_click_probe_panel.png') });
  await page.screenshot({ path: join(outDir, '01_legacy_click_probe_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F656-F660',
    screenshots: ['00_legacy_click_probe_panel.png', '01_legacy_click_probe_canvas.png'],
    metrics: await page.getByTestId('f656-f660-metrics').innerText(),
    decision: await page.getByTestId('f656-f660-decision').innerText(),
    gates: await page.getByTestId('f656-f660-gates').innerText(),
  }, null, 2));
});
