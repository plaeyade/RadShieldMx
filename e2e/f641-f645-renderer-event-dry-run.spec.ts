import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f641_f645_renderer_event_dry_run');

test('F641-F645 renderer event dry-run panel', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f641-f645-renderer-event-dry-run');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f641-f645-status')).toContainText(/event-dry-run/i);
  await expect(page.getByTestId('f641-f645-metrics')).toContainText(/Cand/i);
  await expect(page.getByTestId('f641-f645-intent')).toContainText(/select-candidate|draw-with-active-tool|pan-canvas|noop/i);
  await expect(page.getByTestId('f641-f645-comparison')).toContainText(/candidate/i);
  await expect(page.getByTestId('f641-f645-gates')).toContainText(/OK/i);

  await panel.screenshot({ path: join(outDir, '00_event_dry_run_panel.png') });
  await page.screenshot({ path: join(outDir, '01_event_dry_run_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F641-F645',
    screenshots: ['00_event_dry_run_panel.png', '01_event_dry_run_canvas.png'],
    metrics: await page.getByTestId('f641-f645-metrics').innerText(),
    intent: await page.getByTestId('f641-f645-intent').innerText(),
  }, null, 2));
});
