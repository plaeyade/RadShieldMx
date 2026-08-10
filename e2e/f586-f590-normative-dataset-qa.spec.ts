import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f586_f590_normative_dataset_qa');

test('F586-F590 normative dataset QA is visible, source-backed and screenshot-backed', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas).toBeVisible();

  const datasetPanel = page.getByTestId('f586-f590-normative-dataset-qa');
  await datasetPanel.scrollIntoViewIfNeeded();
  await expect(datasetPanel).toBeVisible();
  await expect(page.getByTestId('f586-f590-status')).toContainText(/dataset-qa/i);
  await expect(page.getByTestId('f586-f590-summary')).toContainText(/Casos/i);
  await expect(page.getByTestId('f586-f590-gates')).toContainText(/certificacion clinica NO/i);
  await expect(page.getByTestId('f586-f590-case-f586-f590-f581-linac-6mv-primary-public-ncrp151')).toContainText(/NCRP151/i);
  await expect(page.getByTestId('f586-f590-case-f586-f590-f582-ct-lead-door-ncrp147')).toContainText(/NCRP147/i);

  await datasetPanel.evaluate((element) => {
    const existing = document.querySelector('[data-testid="f586-f590-capture-clone"]');
    existing?.remove();
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.testid = 'f586-f590-capture-clone';
    clone.style.position = 'fixed';
    clone.style.left = '24px';
    clone.style.top = '24px';
    clone.style.zIndex = '99999';
    clone.style.width = '480px';
    clone.style.maxHeight = '900px';
    clone.style.overflow = 'visible';
    clone.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.35)';
    document.body.appendChild(clone);
  });

  const captureClone = page.getByTestId('f586-f590-capture-clone');
  await expect(captureClone).toBeVisible();
  const panelScreenshot = path.join(outputDir, '00_normative_dataset_panel.png');
  await captureClone.screenshot({ path: panelScreenshot });

  const canvasScreenshot = path.join(outputDir, '01_normative_dataset_canvas.png');
  await page.screenshot({ path: canvasScreenshot, fullPage: false });

  await page.getByRole('button', { name: /Update/i }).click();
  await expect(page.getByText(/F586-F590 Dataset normativo QA/i)).toBeVisible({ timeout: 10_000 });
  await expect(page.getByText(/source\/page\/hash\/tolerance/i)).toBeVisible({ timeout: 10_000 });
  const updateScreenshot = path.join(outputDir, '02_normative_dataset_update_center.png');
  await page.screenshot({ path: updateScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f586_f590_normative_dataset_qa.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.calc.normative-dataset-qa.f586-f590.e2e.v1',
        status: 'normative-dataset-qa-visible-and-gated',
        generatedAt: new Date().toISOString(),
        screenshots: [panelScreenshot, canvasScreenshot, updateScreenshot],
        checks: [
          'canvas visible',
          'F586-F590 dataset panel visible',
          'source/page/hash cases visible',
          'release gate blocks clinical certification',
          'Update Center documents F586-F590',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
