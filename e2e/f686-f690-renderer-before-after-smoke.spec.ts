import { test, expect, type Page } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f686_f690_renderer_before_after_smoke');

async function bootScenario(page: Page, flagEnabled: boolean) {
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript((enabled) => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
    localStorage.setItem('radshield_canvas_f686_before_after_observed', enabled ? 'true' : 'false');
    localStorage.setItem('radshield_feature_flags', JSON.stringify({
      canvasHighRiskCad: enabled,
      canvasEventControllerV2: false,
    }));
  }, flagEnabled);
  await bootWorkspace(page);
  const targetedPanel = page.getByTestId('f681-f685-renderer-targeted-legacy-click');
  await targetedPanel.scrollIntoViewIfNeeded();
  const x = Number(await targetedPanel.getAttribute('data-click-x'));
  const y = Number(await targetedPanel.getAttribute('data-click-y'));
  expect(Number.isFinite(x)).toBeTruthy();
  expect(Number.isFinite(y)).toBeTruthy();
  await page.getByTestId('f100-main-floorplan-canvas').click({ position: { x, y } });
  await expect(page.getByTestId('f671-f675-diagnosis')).toContainText(/allow-owner-smoke-prep|alias|match/i, { timeout: 15000 });
  await expect(page.getByTestId('f686-f690-renderer-before-after-smoke')).toBeVisible();
  return {
    click: { x, y },
    alignment: await page.getByTestId('f671-f675-diagnosis').innerText(),
    owner: await page.getByTestId('f676-f680-decision').innerText(),
    beforeAfter: await page.getByTestId('f686-f690-decision').innerText(),
    gates: await page.getByTestId('f686-f690-gates').innerText(),
  };
}

test('F686-F690 compares baseline and flagged before/after smoke safely', async ({ browser }) => {
  mkdirSync(outDir, { recursive: true });
  const baselinePage = await browser.newPage();
  const baseline = await bootScenario(baselinePage, false);
  await baselinePage.screenshot({ path: join(outDir, '00_baseline_usecanvas.png'), fullPage: false });
  await baselinePage.close();

  const flaggedPage = await browser.newPage();
  const flagged = await bootScenario(flaggedPage, true);
  await flaggedPage.screenshot({ path: join(outDir, '01_flagged_highrisk_dryrun.png'), fullPage: false });
  await flaggedPage.getByTestId('f686-f690-renderer-before-after-smoke').screenshot({ path: join(outDir, '02_before_after_panel.png') });
  await flaggedPage.close();

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F686-F690',
    baseline,
    flagged,
    sameClick: baseline.click.x === flagged.click.x && baseline.click.y === flagged.click.y,
    screenshots: ['00_baseline_usecanvas.png', '01_flagged_highrisk_dryrun.png', '02_before_after_panel.png'],
  }, null, 2));
});
