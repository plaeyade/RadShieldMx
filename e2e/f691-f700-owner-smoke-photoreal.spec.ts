import { test, expect } from '@playwright/test';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { bootWorkspace } from './helpers';

const outDir = join(process.cwd(), 'outputs', 'f691_f700_owner_smoke_photoreal');

test('F691-F700 exposes controlled owner smoke and photoreal asset readiness', async ({ page }) => {
  mkdirSync(outDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 1220 });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'compact');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
    localStorage.setItem('radshield_canvas_f686_before_after_observed', 'true');
    localStorage.setItem('radshield_feature_flags', JSON.stringify({
      canvasHighRiskCad: true,
      canvasEventControllerV2: true,
    }));
  });
  await bootWorkspace(page);

  const targetedPanel = page.getByTestId('f681-f685-renderer-targeted-legacy-click');
  await targetedPanel.scrollIntoViewIfNeeded();
  const x = Number(await targetedPanel.getAttribute('data-click-x'));
  const y = Number(await targetedPanel.getAttribute('data-click-y'));
  expect(Number.isFinite(x)).toBeTruthy();
  expect(Number.isFinite(y)).toBeTruthy();
  await page.getByTestId('f100-main-floorplan-canvas').click({ position: { x, y } });

  await expect(page.getByTestId('f691-f695-renderer-controlled-owner-smoke')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f691-f695-decision')).toContainText(/run-selection-owner-smoke|keep-usecanvas|blocked/i);
  await expect(page.getByTestId('f691-f695-gates')).toContainText(/Sin escrituras modelo|Rollback useCanvas/);
  await expect(page.getByTestId('f696-f700-photoreal-asset-readiness')).toBeVisible();
  await expect(page.getByTestId('f696-f700-decision')).toContainText(/ship-procedural-beta|enable-local-assets|blocked/i);
  await expect(page.getByTestId('f696-f700-gates')).toContainText(/Fallback procedural|Assets locales opcionales/);

  await page.screenshot({ path: join(outDir, '00_owner_smoke_photoreal_canvas.png'), fullPage: false });
  await page.getByTestId('f691-f695-renderer-controlled-owner-smoke').screenshot({ path: join(outDir, '01_controlled_owner_smoke_panel.png') });
  await page.getByTestId('f696-f700-photoreal-asset-readiness').screenshot({ path: join(outDir, '02_photoreal_asset_readiness_panel.png') });

  writeFileSync(join(outDir, 'manifest.json'), JSON.stringify({
    phase: 'F691-F700',
    click: { x, y },
    ownerSmoke: {
      status: await page.getByTestId('f691-f695-status').innerText(),
      decision: await page.getByTestId('f691-f695-decision').innerText(),
      gates: await page.getByTestId('f691-f695-gates').innerText(),
    },
    photorealAssets: {
      status: await page.getByTestId('f696-f700-status').innerText(),
      decision: await page.getByTestId('f696-f700-decision').innerText(),
      gates: await page.getByTestId('f696-f700-gates').innerText(),
    },
    screenshots: [
      '00_owner_smoke_photoreal_canvas.png',
      '01_controlled_owner_smoke_panel.png',
      '02_photoreal_asset_readiness_panel.png',
    ],
  }, null, 2));
});
