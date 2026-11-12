import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { bootWorkspace } from './helpers';

test.describe('Nuclear Medicine IDAC-Dose readiness', () => {
  test('exports an IDAC-Dose 2.2 comparison pack from the MIRD tab', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    // Desde F97 el módulo vive en el menú «Equipos» (ya no hay botón «Med. Nuclear» en la barra superior).
    await page.getByTestId('f97-migrated-equipment-dropdown').click();
    await page.getByTestId('f97-migrated-equipment-menu').getByText('Medicina Nuclear', { exact: true }).click();

    await expect(page.getByText('Advanced Nuclear Medicine Shielding Module')).toBeVisible();
    const dicomDialog = page.locator('[role="dialog"]').filter({ hasText: 'Importar DICOM / PACS' });
    if (await dicomDialog.isVisible().catch(() => false)) {
      await dicomDialog.locator('button').last().click({ force: true });
    }
    await page.getByText('MIRD', { exact: true }).click({ force: true });

    await expect(page.getByText('IDAC-Dose 2.2 readiness')).toBeVisible();
    await expect(page.getByText('0.017 mSv/MBq')).toBeVisible();
    await expect(page.getByText('Procedimientos', { exact: true })).toBeVisible();
    await expect(page.getByText('Coeficientes', { exact: true })).toBeVisible();
    await expect(page.getByText('Fantomas', { exact: true })).toBeVisible();
    await expect(page.getByText('Persistencia local preparada')).toBeVisible();
    await expect(page.getByTestId('dosimetry-server-status')).toContainText(/DB\/API:/);
    await expect(page.getByTestId('dosimetry-sync-queue-status')).toContainText(/Cola:/);

    await page.getByText('Guardar Local').click();
    await expect(page.getByText(/Guardado local: 23 coeficientes/i)).toBeVisible();
    const storedWorkspace = await page.evaluate(() => {
      const raw = localStorage.getItem('radshield_internal_dosimetry_workspace_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(storedWorkspace.schemaVersion).toBe('radshield-dosimetry-workspace-v1');
    expect(storedWorkspace.dataset.effectiveDoseCoefficients).toHaveLength(23);

    await page.getByText('Sync DB').click();
    await expect(page.getByTestId('dosimetry-server-status')).toContainText(
      /Servidor desactivado|Servidor pendiente|Sincronizado con DB|DB pendiente|En cola/i,
    );
    await expect(page.getByTestId('dosimetry-sync-queue-status')).toContainText(/Pendientes|sin pendientes|sincronizada/i);
    const syncedWorkspace = await page.evaluate(() => {
      const raw = localStorage.getItem('radshield_internal_dosimetry_workspace_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(syncedWorkspace.dataset.effectiveDoseCoefficients).toHaveLength(23);
    const syncQueue = await page.evaluate(() => {
      const raw = localStorage.getItem('radshield_internal_dosimetry_sync_queue_v1');
      return raw ? JSON.parse(raw) : null;
    });
    expect(syncQueue?.schemaVersion).toBe('radshield-dosimetry-sync-queue-v1');
    expect(syncQueue?.items?.[0]?.workspace.dataset.effectiveDoseCoefficients).toHaveLength(23);

    const datasetButton = page.getByText('Exportar Dataset');
    await datasetButton.scrollIntoViewIfNeeded();
    const datasetDownloadPromise = page.waitForEvent('download');
    await datasetButton.click();
    const datasetDownload = await datasetDownloadPromise;
    const datasetDownloadPath = await datasetDownload.path();
    expect(datasetDownloadPath).toBeTruthy();
    const dataset = JSON.parse(await readFile(datasetDownloadPath!, 'utf8'));
    expect(dataset.schemaVersion).toBe('radshield-internal-dosimetry-dataset-v1');
    expect(dataset.references[0].doi).toBe('10.1186/s40658-025-00774-z');
    expect(dataset.procedures).toHaveLength(3);
    expect(dataset.effectiveDoseCoefficients).toHaveLength(23);

    const exportButton = page.getByText('Exportar IDAC Pack');
    await exportButton.scrollIntoViewIfNeeded();
    const downloadPromise = page.waitForEvent('download');
    await exportButton.click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const exported = JSON.parse(await readFile(downloadPath!, 'utf8'));

    expect(exported.schemaVersion).toBe('radshield-idac-dose-readiness-v1');
    expect(exported.source.doi).toBe('10.1186/s40658-025-00774-z');
    expect(exported.selectedProcedure.radionuclide).toBe('F-18');
    expect(exported.selectedPhantom.id).toBe('adult-reference-person');
    expect(exported.paperCoefficient.coefficient_mSv_per_MBq).toBeCloseTo(0.017);
    expect(exported.integrationStatus.validation).toBe('external-validation-required');
  });
});
