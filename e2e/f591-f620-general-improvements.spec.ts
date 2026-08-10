import { test, expect } from '@playwright/test';
import fs from 'node:fs';
import path from 'node:path';
import { bootWorkspace } from './helpers';

const outputDir = path.join(process.cwd(), 'outputs', 'f591_f620_general_improvements');

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.removeItem('radshield_canvas_qa_inspector_mode_f591');
  });
});

test('F591-F620 general improvements compact canvas, expandable QA and Memoria IA workflow', async ({ page }) => {
  fs.mkdirSync(outputDir, { recursive: true });
  await bootWorkspace(page);

  await expect(page.getByTestId('f591-f620-general-improvements')).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('f591-f620-status')).toContainText(/general-improvements/i);
  await expect(page.getByTestId('f591-f620-summary')).toContainText(/Modo compact/i);
  await expect(page.getByTestId('f591-f620-gates')).toContainText(/certificacion clinica NO/i);
  await expect(page.getByTestId('f586-f590-normative-dataset-qa')).toHaveCount(0);

  await page.getByTestId('f591-f620-general-improvements').screenshot({
    path: path.join(outputDir, '00_general_improvements_panel.png'),
  });
  await page.screenshot({
    path: path.join(outputDir, '01_general_improvements_compact_canvas.png'),
    fullPage: true,
  });

  await page.getByTestId('f591-toggle-qa-inspector').click();
  await expect(page.getByTestId('f591-f620-summary')).toContainText(/Modo expanded/i);
  await expect(page.getByTestId('f586-f590-normative-dataset-qa')).toBeVisible();
  await page.screenshot({
    path: path.join(outputDir, '02_general_improvements_expanded_canvas.png'),
    fullPage: true,
  });

  const memoriaButton = page.getByRole('button', { name: /Memoria|MA Wizard/i }).first();
  await expect(memoriaButton).toBeVisible({ timeout: 10_000 });
  await memoriaButton.click();
  await expect(page.getByTestId('f611-f615-memoria-productive-workflow')).toBeVisible({ timeout: 10_000 });
  await page.screenshot({
    path: path.join(outputDir, '03_general_improvements_memoria_ia.png'),
    fullPage: true,
  });

  fs.writeFileSync(
    path.join(outputDir, 'manifest.json'),
    JSON.stringify(
      {
        schema: 'radshield-mx.general-improvements.f591-f620.e2e.v1',
        screenshots: [
          '00_general_improvements_panel.png',
          '01_general_improvements_compact_canvas.png',
          '02_general_improvements_expanded_canvas.png',
          '03_general_improvements_memoria_ia.png',
        ],
        assertions: [
          'F591-F620 panel visible',
          'F550-F590 hidden by default in compact mode',
          'QA inspector expands F586-F590',
          'Memoria IA shows F611-F615 productive workflow',
        ],
      },
      null,
      2,
    ),
  );
});
