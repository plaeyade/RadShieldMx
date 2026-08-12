import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f681_f685_renderer_targeted_legacy_click');

test('F681-F685 clicks predicted target center through useCanvas and rechecks alignment', async ({ page }) => {
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
  const targetedPanel = page.getByTestId('f681-f685-renderer-targeted-legacy-click');
  await targetedPanel.scrollIntoViewIfNeeded();
  await expect(targetedPanel).toBeVisible({ timeout: 15000 });
  const x = Number(await targetedPanel.getAttribute('data-click-x'));
  const y = Number(await targetedPanel.getAttribute('data-click-y'));
  expect(Number.isFinite(x)).toBeTruthy();
  expect(Number.isFinite(y)).toBeTruthy();

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await canvas.click({ position: { x, y } });
  await expect(page.getByTestId('f671-f675-diagnosis')).toContainText(/alias|match|keep-preview|blocked/i, { timeout: 15000 });

  await targetedPanel.screenshot({ path: join(outDir, '00_targeted_click_panel.png') });
  await page.getByTestId('f671-f675-renderer-prediction-alignment').screenshot({ path: join(outDir, '01_alignment_after_targeted_click.png') });
  await page.screenshot({ path: join(outDir, '02_targeted_legacy_click_canvas.png'), fullPage: false });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F681-F685',
    click: { x, y },
    targeted: await page.getByTestId('f681-f685-decision').innerText(),
    targetedGates: await page.getByTestId('f681-f685-gates').innerText(),
    alignment: await page.getByTestId('f671-f675-diagnosis').innerText(),
    ownerDecision: await page.getByTestId('f676-f680-decision').innerText(),
    screenshots: ['00_targeted_click_panel.png', '01_alignment_after_targeted_click.png', '02_targeted_legacy_click_canvas.png'],
  }, null, 2));
});
