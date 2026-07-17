import { expect, test } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { bootWorkspace } from './helpers';

const evidenceDir = path.resolve('outputs/f191f_inline_editor_smoke');

test('F191F validates real selected-object inline editing without hiding canvas/sidebar', async ({ page }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 900 });
  await bootWorkspace(page);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas).toBeVisible({ timeout: 15_000 });
  await expect(page.getByText('Herramientas de Dibujo')).toBeVisible();
  await expect(page.getByTestId('f191c-object-inspector')).toBeVisible();

  await page.getByTestId('f191-tool-select').click();
  await expect(page.getByTestId('f98-active-canvas-tool-indicator')).toContainText(/Seleccionar|Sel/);

  await page.getByRole('button', { name: /Agregar punto critico de evaluacion/i }).click();
  await expect(page.getByTestId('f191c-inspector-type')).toContainText('Punto');

  await expect(page.getByTestId('f191e-action-edit')).toBeEnabled();
  await page.getByTestId('f191e-action-edit').click();
  await expect(page.getByTestId('f191e-inline-editor')).toBeVisible();

  const editedName = `F191F QA ${Date.now()}`;
  const nameInput = page.getByTestId('f191e-editor-name');
  await nameInput.fill(editedName);
  await nameInput.blur();
  await expect(page.getByTestId('f191c-inspector-name')).toContainText(editedName);
  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  await expect(page.getByText('Herramientas de Dibujo')).toBeVisible();

  await page.getByTestId('f191e-editor-close').click();
  await expect(page.getByTestId('f191e-inline-editor')).toBeHidden();
  await page.screenshot({ path: path.join(evidenceDir, 'f191f-inline-editor-real-selection.png') });
});
