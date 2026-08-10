import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f646_f650_renderer_selection_transaction');

test('F646-F650 renderer selection transaction panel', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);

  const panel = page.getByTestId('f646-f650-renderer-selection-transaction');
  await panel.scrollIntoViewIfNeeded();
  await expect(panel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f646-f650-status')).toContainText(/selection-transaction/i);
  await expect(page.getByTestId('f646-f650-metrics')).toContainText(/Chg/i);
  await expect(page.getByTestId('f646-f650-draft')).toContainText(/f646-op/i);
  await expect(page.getByTestId('f646-f650-snapshot')).toContainText(/changed/i);
  await expect(page.getByTestId('f646-f650-rollback-token')).toContainText(/f648-rollback/i);
  await expect(page.getByTestId('f646-f650-gates')).toContainText(/OK/i);

  await panel.screenshot({ path: join(outDir, '00_selection_transaction_panel.png') });
  await page.screenshot({ path: join(outDir, '01_selection_transaction_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F646-F650',
    screenshots: ['00_selection_transaction_panel.png', '01_selection_transaction_canvas.png'],
    metrics: await page.getByTestId('f646-f650-metrics').innerText(),
    draft: await page.getByTestId('f646-f650-draft').innerText(),
  }, null, 2));
});
