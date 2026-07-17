import fs from 'node:fs';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const evidenceDir = path.resolve('outputs/f191g_duplicate_delete_smoke');

test('F191G duplicates and deletes selected object with confirmation without hiding canvas/sidebar', async ({ page }) => {
  fs.mkdirSync(evidenceDir, { recursive: true });
  await page.setViewportSize({ width: 1920, height: 900 });
  await bootWorkspace(page);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas).toBeVisible();
  await expect(page.getByText('Herramientas de Dibujo')).toBeVisible();

  await page.getByTestId('f191-tool-select').click();
  await page.getByRole('button', { name: /Agregar punto critico de evaluacion/i }).click();
  await expect(page.getByTestId('f191c-inspector-type')).toContainText('Punto');

  await expect(page.getByTestId('f191g-action-duplicate')).toBeEnabled();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Duplicar');
    await dialog.accept();
  });
  await page.getByTestId('f191g-action-duplicate').click();
  await expect(page.getByTestId('f191c-inspector-name')).toContainText('copia');

  await expect(page.getByTestId('f191g-action-delete')).toBeEnabled();
  page.once('dialog', async (dialog) => {
    expect(dialog.message()).toContain('Borrar');
    await dialog.accept();
  });
  await page.getByTestId('f191g-action-delete').click();
  await expect(page.getByTestId('f191c-inspector-type')).toContainText('Sin seleccion');

  await expect(canvas).toBeVisible();
  await expect(page.getByText('Herramientas de Dibujo')).toBeVisible();
  await page.screenshot({ path: path.join(evidenceDir, 'f191g-duplicate-delete-confirm.png') });
});
