import { test, expect } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { bootWorkspace } from './helpers';

const importedEvidencePack = {
  schemaVersion: 'radshield-evidence-pack-v1',
  packId: 'pack-imported',
  projectName: 'Memoria LINAC Demo',
  createdAt: '2026-07-11T00:00:00.000Z',
  updatedAt: '2026-07-11T00:00:00.000Z',
  objective: 'Sustentar memoria analitica de bunker LINAC.',
  sources: [
    {
      id: 'ev-imported-1',
      title: 'NCRP Report No. 151',
      url: 'https://ncrponline.org/publications/reports/ncrp-report-151/',
      sourceType: 'standard',
      capturedAt: '2026-07-11T00:00:00.000Z',
      claim: 'Referencia base para blindaje de instalaciones de radioterapia.',
      excerpt: 'Resumen tecnico verificable.',
      notes: 'Fuente primaria para memoria analitica.',
      confidence: 'high',
      tags: ['NCRP', 'LINAC'],
    },
  ],
  integrationNotes: {
    fsb: 'Integracion externa futura.',
    browserbase: 'Integracion externa futura.',
    revit: 'Integracion externa futura.',
    cadx: 'Integracion externa futura.',
    cadCodeVerify: 'Integracion inspirada en paper.',
    idacDose: 'Integracion por fases.',
  },
};

test.describe('Evidence Pack', () => {
  test('opens, exports, and imports portable evidence JSON', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await page.getByRole('button', { name: /Reportes/i }).click();
    await page.getByText('Evidence Pack', { exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Evidence Pack' })).toBeVisible();
    await expect(page.getByText('FSB queda como navegador supervisado externo')).toBeVisible();
    await expect(page.getByText('Browserbase queda como motor externo')).toBeVisible();
    await expect(page.getByText('Revit/Autodesk queda como integracion BIM externa')).toBeVisible();
    await expect(page.getByText('CADx Studio queda como referencia/integracion externa')).toBeVisible();
    await expect(page.getByText('CADCodeVerify se integra como protocolo')).toBeVisible();
    await expect(page.getByText('IDAC-Dose 2.2 queda como referencia externa')).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar JSON/i }).click();
    const download = await downloadPromise;
    const downloadPath = await download.path();
    expect(downloadPath).toBeTruthy();
    const exported = JSON.parse(await readFile(downloadPath!, 'utf8'));
    expect(exported.schemaVersion).toBe('radshield-evidence-pack-v1');
    expect(exported.integrationNotes.fsb).toContain('Integracion externa futura');
    expect(exported.integrationNotes.revit).toContain('Revit/Autodesk');
    expect(exported.integrationNotes.cadx).toContain('CADx Studio');
    expect(exported.integrationNotes.cadCodeVerify).toContain('CADCodeVerify');
    expect(exported.integrationNotes.idacDose).toContain('IDAC-Dose 2.2');

    await page.locator('input[data-testid="evidence-pack-input"]').setInputFiles({
      name: 'evidence-pack.json',
      mimeType: 'application/json',
      buffer: Buffer.from(JSON.stringify(importedEvidencePack)),
    });

    await expect(page.locator('input[value="Memoria LINAC Demo"]')).toBeVisible();
    await expect(page.locator('input[value="NCRP Report No. 151"]')).toBeVisible();
    await expect(page.getByText('Alta confianza: 1')).toBeVisible();
  });
});
