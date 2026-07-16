import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';

const evidenceDir = path.resolve('outputs/f191_toolbar_smoke');

test('F191 pyrateShield-inspired toolbar is visible and changes canvas modes', async ({ page }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 900 });
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield_welcome_dismissed', '1');
    window.localStorage.removeItem('radshield_canvas_visual_mode_f191');
  });
  await page.goto('/');

  await expect(page.getByTestId('f191-pyrate-inspired-toolbar')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('f191-cad-tool-group')).toBeVisible();
  await expect(page.getByTestId('f191-clinical-action-group')).toBeVisible();
  await expect(page.getByTestId('f191-visual-mode-switcher')).toBeVisible();
  await expect(page.getByTestId('f191c-object-inspector')).toBeVisible();
  await expect(page.getByTestId('f191c-inspector-type')).toContainText('Sin seleccion');
  await expect(page.getByTestId('f191d-context-actions')).toBeVisible();
  await expect(page.getByTestId('f191d-action-calculate')).toBeVisible();
  await expect(page.getByTestId('f191d-action-focus')).toBeDisabled();

  await page.getByTestId('f191-tool-barrier').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText('Dibujar barrera');
  await expect(page.getByTestId('f191c-object-inspector')).toContainText('Herr');
  await expect(page.getByTestId('f191d-action-clear')).toBeDisabled();

  await page.getByTestId('f191-visual-mode-heat').click();
  await expect(page.getByTestId('f191-mode-status')).toContainText('heat');

  await page.getByTestId('f191-visual-mode-structure').click();
  await expect(page.getByTestId('f191-mode-status')).toContainText('structure');
  await expect(page.getByTestId('canvas-workflow-panel')).toBeVisible();

  await page.screenshot({ path: path.join(evidenceDir, 'f191-toolbar-structure.png') });
});
