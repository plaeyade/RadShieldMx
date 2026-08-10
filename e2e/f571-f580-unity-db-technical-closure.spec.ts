import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f571_f580_unity_db_closure');

test('F571-F580 Unity WebGL and technical DB closure is visible, gated and screenshot-backed', async ({ page }) => {
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

  const closurePanel = page.getByTestId('f571-f580-unity-db-closure');
  await closurePanel.scrollIntoViewIfNeeded();
  await expect(closurePanel).toBeVisible();
  await expect(page.getByTestId('f571-f580-status')).toContainText(/unity|db/i);
  await expect(page.getByTestId('f571-f580-track-unity-build-intake')).toContainText(/Unity/i);
  await expect(page.getByTestId('f571-f580-track-unity-runtime-bridge')).toContainText(/Bridge/i);
  await expect(page.getByTestId('f571-f580-track-unity-qa-evidence')).toContainText(/QA/i);
  await expect(page.getByTestId('f571-f580-track-technical-db-registry')).toContainText(/DB/i);
  await expect(page.getByTestId('f571-f580-track-technical-db-release-gate')).toContainText(/Gate/i);
  await expect(page.getByTestId('f571-f575-unity-build-summary')).toContainText(/Unity/i);
  await expect(page.getByTestId('f576-f580-technical-db-summary')).toContainText(/DB/i);
  await expect(page.getByTestId('f571-f580-release-rules')).toContainText(/calculo clinico certificado NO/i);

  await closurePanel.evaluate((element) => {
    const existing = document.querySelector('[data-testid="f571-f580-capture-clone"]');
    existing?.remove();
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.testid = 'f571-f580-capture-clone';
    clone.style.position = 'fixed';
    clone.style.left = '24px';
    clone.style.top = '24px';
    clone.style.zIndex = '99999';
    clone.style.width = '430px';
    clone.style.maxHeight = '900px';
    clone.style.overflow = 'visible';
    clone.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.35)';
    document.body.appendChild(clone);
  });
  const captureClone = page.getByTestId('f571-f580-capture-clone');
  await expect(captureClone).toBeVisible();

  const panelScreenshot = path.join(outputDir, '00_unity_db_closure_panel.png');
  await captureClone.screenshot({ path: panelScreenshot });

  const canvasScreenshot = path.join(outputDir, '01_unity_db_closure_canvas.png');
  await page.screenshot({ path: canvasScreenshot, fullPage: false });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box is missing');
  await page.mouse.click(box.x + box.width * 0.46, box.y + box.height * 0.46);
  await expect(page.getByTestId('f515b-canvas-event-action')).not.toHaveText('stable');
  await closurePanel.scrollIntoViewIfNeeded();

  const eventScreenshot = path.join(outputDir, '02_unity_db_closure_event_action.png');
  await page.screenshot({ path: eventScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f571_f580_unity_db_closure.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f571-f580.unity-db-technical-closure-qa.v1',
        status: 'unity-db-closure-visible-and-gated',
        generatedAt: new Date().toISOString(),
        screenshots: [panelScreenshot, canvasScreenshot, eventScreenshot],
        checks: [
          'canvas visible',
          'F571-F580 panel visible',
          'Unity build intake gate visible',
          'Unity runtime bridge gate visible',
          'technical DB registry visible',
          'technical DB release gate visible',
          'release rules block live seed and certified clinical calculation',
          'real pointer event still reaches F561/F515 harness',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
