import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const evidenceDir = path.resolve('outputs/f189_visual_smoke');

async function prepareDemo(page: import('@playwright/test').Page) {
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield_welcome_dismissed', '1');
    window.localStorage.removeItem('radshield_canvas_panels_f188');
    window.localStorage.removeItem('radshield_canvas_workflow_dock_f188');
    window.localStorage.removeItem('radshield_sidebar_width_f188');
  });
  await page.goto('/');
  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('canvas-workflow-panel')).toBeVisible({ timeout: 15_000 });
}

async function expectSidebarWidth(page: import('@playwright/test').Page, min = 244, max = 360) {
  const box = await page.getByTestId('f186-sidebar-stable-width').boundingBox();
  expect(box, 'sidebar box').not.toBeNull();
  expect(box!.width, 'sidebar width lower bound').toBeGreaterThanOrEqual(min);
  expect(box!.width, 'sidebar width upper bound').toBeLessThanOrEqual(max);
  return box!.width;
}

for (const viewport of [
  { name: 'desktop-1366', width: 1366, height: 768 },
  { name: 'wide-1920', width: 1920, height: 1080 },
]) {
  test(`F189 visual smoke panel layout controls ${viewport.name}`, async ({ page }) => {
    fs.mkdirSync(evidenceDir, { recursive: true });
    await page.setViewportSize({ width: viewport.width, height: viewport.height });
    await prepareDemo(page);

    await expect(page.getByTestId('f188-canvas-panel-controls')).toBeVisible();
    await expect(page.getByTestId('f85-canvas-tools-panel')).toBeVisible();
    await expect(page.getByTestId('f83-offline-continuity-panel')).toBeVisible();

    const initialSidebarWidth = await expectSidebarWidth(page);
    await page.screenshot({ path: path.join(evidenceDir, `${viewport.name}-initial.png`) });

    await page.getByLabel('Mostrar/ocultar herramientas QA del canvas').click();
    await expect(page.getByTestId('f85-canvas-tools-panel')).toHaveCount(0);
    await expect(page.getByTestId('f188-hidden-panel-restore')).toBeVisible();
    await page.screenshot({ path: path.join(evidenceDir, `${viewport.name}-qa-hidden.png`) });

    await page.getByLabel('Restaurar panel QA').click();
    await expect(page.getByTestId('f85-canvas-tools-panel')).toBeVisible();

    const workflowBefore = await page.getByTestId('canvas-workflow-panel').boundingBox();
    expect(workflowBefore, 'workflow panel before dock').not.toBeNull();
    await page.getByTestId('f188-workflow-dock-button').click();
    const workflowAfter = await page.getByTestId('canvas-workflow-panel').boundingBox();
    expect(workflowAfter, 'workflow panel after dock').not.toBeNull();
    expect(workflowAfter!.x, 'workflow panel moved right').toBeGreaterThan(workflowBefore!.x);

    await page.getByLabel('Aumentar ancho de sidebar').click();
    const expandedSidebarWidth = await expectSidebarWidth(page);
    expect(expandedSidebarWidth, 'sidebar width increased').toBeGreaterThan(initialSidebarWidth);
    await page.screenshot({ path: path.join(evidenceDir, `${viewport.name}-final.png`) });
  });
}
