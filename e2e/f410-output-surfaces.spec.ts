import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f410_output_surface_qa');

async function capture(page: Page, name: string) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
  });
});

test('F409 output surfaces are visible in Memoria, Evidence Pack and Medical 3D', async ({ page }) => {
  test.setTimeout(180_000);
  await mkdir(outputDir, { recursive: true });
  await page.setViewportSize({ width: 1440, height: 900 });
  await bootWorkspace(page);
  await expect(page.getByTestId('e2e-dialog-controls')).toBeVisible({ timeout: 15_000 });

  const screenshots: string[] = [];
  const checks: Array<{ id: string; status: 'ready'; evidence: string }> = [];

  // Fase 12, paso 3: «Memoria IA» se unificó en el flujo de memoria radshield/memoria@1 (menú 5).
  await page.getByTestId('e2e-open-memoria').click();
  const memoriaSurface = page.getByTestId('memoria-unificada');
  await expect(memoriaSurface).toBeVisible({ timeout: 20_000 });
  await expect(memoriaSurface).toContainText(/radshield\/memoria@1/);
  screenshots.push(await capture(page, '01_memoria_unificada'));
  checks.push({ id: 'memoria-unificada', status: 'ready', evidence: 'memoria-unificada' });
  await page.keyboard.press('Escape');
  await expect(memoriaSurface).toBeHidden({ timeout: 10_000 });

  await page.getByTestId('e2e-open-evidence-pack').click();
  const evidenceSurface = page.getByTestId('f409-output-surface-integration-evidence');
  await expect(evidenceSurface).toBeVisible({ timeout: 20_000 });
  await expect(evidenceSurface).toContainText(/F409 salidas reales/i);
  await expect(evidenceSurface.getByRole('button', { name: /Exportar F409 JSON/i })).toBeVisible();
  screenshots.push(await capture(page, '02_evidence_pack_f409_surface'));
  checks.push({ id: 'evidence-pack-f409-surface', status: 'ready', evidence: 'f409-output-surface-integration-evidence' });
  await page.getByTestId('f392-evidence-pack-fullscreen-shell-close').click();
  await expect(evidenceSurface).toBeHidden({ timeout: 10_000 });

  await page.getByTestId('e2e-open-medical-3d').click();
  const medicalSurface = page.getByTestId('f409-f408-unity-scene-surface');
  await expect(medicalSurface).toBeVisible({ timeout: 25_000 });
  await expect(medicalSurface).toContainText(/F409 \/ F408 salida 3D/i);
  await expect(medicalSurface).toContainText(/Muros/i);
  screenshots.push(await capture(page, '03_medical_3d_f409_f408_surface'));
  checks.push({ id: 'medical-3d-f409-f408-surface', status: 'ready', evidence: 'f409-f408-unity-scene-surface' });

  const output = {
    schema: 'radshield-mx.f410.output-surface-qa.v1',
    phase: 'F410',
    status: 'output-surface-qa-ready',
    generatedAt: new Date().toISOString(),
    checks,
    screenshots,
  };
  await writeFile(path.join(outputDir, 'f410_output_surface_qa.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await writeFile(
    path.join(outputDir, 'f410_output_surface_qa.md'),
    [
      '# F410 Output Surface QA',
      '',
      `Status: ${output.status}`,
      '',
      '## Checks',
      ...checks.map((check) => `- OK ${check.id}: ${check.evidence}`),
      '',
      '## Screenshots',
      ...screenshots.map((file) => `- ${file}`),
      '',
    ].join('\n'),
    'utf8',
  );
});
