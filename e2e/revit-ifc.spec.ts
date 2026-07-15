import { expect, test } from '@playwright/test';
import { readFile } from 'node:fs/promises';
import { bootWorkspace } from './helpers';

const minimalIfc = `
ISO-10303-21;
HEADER;
FILE_DESCRIPTION(('ViewDefinition [CoordinationView]'),'2;1');
FILE_NAME('radshield-revit-demo.ifc','2026-07-11T00:00:00',(),(),'Revit','RadShield-MX','');
ENDSEC;
DATA;
#11=IFCWALLSTANDARDCASE('Primary Concrete Wall',$,'Primary Concrete Wall 300mm',$,$,#1,#2,0,0,6,0);
#22=IFCSPACE('Control Room',$,'Control Room',$,$,#3,#4,1,1,5,4);
ENDSEC;
END-ISO-10303-21;
`;

test.describe('Revit IFC import readiness', () => {
  test('opens IFC dialog, parses model, and exports BIM compatibility manifest', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    await page.getByTitle(/Revit IFC Import/i).first().click();
    await expect(page.getByText('Revit IFC Import (v102)')).toBeVisible();

    await page.locator('input[data-testid="revit-ifc-input"]').setInputFiles({
      name: 'radshield-revit-demo.ifc',
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(minimalIfc),
    });

    await expect(page.getByText(/1 muros/)).toBeVisible();
    await expect(page.getByText(/1 espacios/)).toBeVisible();
    await expect(page.getByText('Fase 44 - Revit/BIM Readiness')).toBeVisible();
    await expect(page.getByText(/RVT nativo queda externo/)).toBeVisible();

    const downloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: /Exportar JSON para RadShield-MX/i }).click();
    const download = await downloadPromise;
    const path = await download.path();
    expect(path).toBeTruthy();

    const exported = JSON.parse(await readFile(path!, 'utf8'));
    expect(exported.source).toBe('Revit IFC Import');
    expect(exported.barriers).toHaveLength(1);
    expect(exported.occupiedRegions).toHaveLength(1);
    expect(exported.compatibility.schemaVersion).toBe('radshield-revit-bim-readiness-v1');
    expect(exported.compatibility.integrationMode).toBe('ifc-export');
    expect(exported.compatibility.directRvtSupport).toBe('external-only');
    expect(exported.compatibility.sharedParameters.map((parameter: { name: string }) => parameter.name)).toContain('RS_EvidencePackId');
  });
});
