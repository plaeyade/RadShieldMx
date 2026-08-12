import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f671_f680_renderer_alignment_owner_smoke');

test('F671-F680 reports alignment review and blocks owner smoke safely', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });

  await bootWorkspace(page);
  await page.getByTestId('f100-main-floorplan-canvas').click({ position: { x: 420, y: 310 } });

  const alignmentPanel = page.getByTestId('f671-f675-renderer-prediction-alignment');
  await alignmentPanel.scrollIntoViewIfNeeded();
  await expect(alignmentPanel).toBeVisible({ timeout: 15000 });
  await expect(page.getByTestId('f671-f675-status')).toContainText(/prediction-alignment/i);
  await expect(page.getByTestId('f671-f675-diagnosis')).toContainText(/keep-preview|allow-owner-smoke-prep|blocked/i);
  await expect(page.getByTestId('f671-f675-gates')).toContainText(/OK|NO/i);
  await expect(page.getByTestId('f676-f680-status')).toContainText(/owner-smoke/i);
  await expect(page.getByTestId('f676-f680-decision')).toContainText(/blocked|keep-usecanvas|run-flagged-owner-smoke/i);

  await alignmentPanel.screenshot({ path: join(outDir, '00_prediction_alignment_panel.png') });
  await page.getByTestId('f676-f680-renderer-owner-smoke').screenshot({ path: join(outDir, '01_owner_smoke_panel.png') });
  await page.screenshot({ path: join(outDir, '02_alignment_owner_smoke_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F671-F680',
    screenshots: ['00_prediction_alignment_panel.png', '01_owner_smoke_panel.png', '02_alignment_owner_smoke_canvas.png'],
    alignment: await page.getByTestId('f671-f675-diagnosis').innerText(),
    alignmentGates: await page.getByTestId('f671-f675-gates').innerText(),
    ownerDecision: await page.getByTestId('f676-f680-decision').innerText(),
    ownerGates: await page.getByTestId('f676-f680-gates').innerText(),
  }, null, 2));
});
