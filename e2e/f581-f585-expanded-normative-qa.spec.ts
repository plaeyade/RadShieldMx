import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f581_f585_expanded_normative_qa');

test('F581-F585 expanded normative numeric QA is visible, gated and screenshot-backed', async ({ page }) => {
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

  const qaPanel = page.getByTestId('f581-f585-expanded-normative-qa');
  await qaPanel.scrollIntoViewIfNeeded();
  await expect(qaPanel).toBeVisible();
  await expect(page.getByTestId('f581-f585-status')).toContainText(/qa-expanded/i);
  await expect(page.getByTestId('f581-f585-summary')).toContainText(/Pass/i);
  await expect(page.getByTestId('f581-f585-gates')).toContainText(/certificacion clinica NO/i);
  await expect(page.getByTestId('f581-f585-case-f581-linac-6mv-primary-public-ncrp151')).toContainText(/NCRP151/i);
  await expect(page.getByTestId('f581-f585-case-f582-ct-lead-door-ncrp147')).toContainText(/NCRP147/i);
  await expect(page.getByTestId('f581-f585-case-f583-gammaknife-cobalt-secondary')).toContainText(/IAEA/i);

  await qaPanel.evaluate((element) => {
    const existing = document.querySelector('[data-testid="f581-f585-capture-clone"]');
    existing?.remove();
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.testid = 'f581-f585-capture-clone';
    clone.style.position = 'fixed';
    clone.style.left = '24px';
    clone.style.top = '24px';
    clone.style.zIndex = '99999';
    clone.style.width = '460px';
    clone.style.maxHeight = '900px';
    clone.style.overflow = 'visible';
    clone.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.35)';
    document.body.appendChild(clone);
  });

  const captureClone = page.getByTestId('f581-f585-capture-clone');
  await expect(captureClone).toBeVisible();

  const panelScreenshot = path.join(outputDir, '00_normative_numeric_qa_panel.png');
  await captureClone.screenshot({ path: panelScreenshot });

  const canvasScreenshot = path.join(outputDir, '01_normative_numeric_qa_canvas.png');
  await page.screenshot({ path: canvasScreenshot, fullPage: false });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box is missing');
  await page.mouse.click(box.x + box.width * 0.52, box.y + box.height * 0.44);
  await expect(page.getByTestId('f515b-canvas-event-action')).not.toHaveText('stable');

  const eventScreenshot = path.join(outputDir, '02_normative_numeric_qa_event.png');
  await page.screenshot({ path: eventScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f581_f585_expanded_normative_qa.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.calc.normative-qa.f581-f585.e2e.v1',
        status: 'expanded-normative-qa-visible-and-gated',
        generatedAt: new Date().toISOString(),
        screenshots: [panelScreenshot, canvasScreenshot, eventScreenshot],
        checks: [
          'canvas visible',
          'F581-F585 panel visible',
          'NCRP151/NCRP147/IAEA cases visible',
          'release gate blocks clinical certification',
          'canvas event harness still receives real pointer events',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
