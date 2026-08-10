import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f566_f570_post_beta_readiness');

test('F566-F570 post-beta production readiness is visible, reversible and screenshot-backed', async ({ page }) => {
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

  const readinessPanel = page.getByTestId('f566-f570-post-beta-readiness');
  await readinessPanel.scrollIntoViewIfNeeded();
  await expect(readinessPanel).toBeVisible();
  await expect(page.getByTestId('f566-f570-status')).toContainText(/production-readiness/i);
  await expect(page.getByTestId('f566-f570-track-visual-snapshot')).toContainText(/Snapshot/i);
  await expect(page.getByTestId('f566-f570-track-real-connection-readiness')).toContainText(/Conexiones/i);
  await expect(page.getByTestId('f566-f570-track-heavy-asset-intake')).toContainText(/Assets/i);
  await expect(page.getByTestId('f566-f570-track-reversible-activation')).toContainText(/Activacion/i);
  await expect(page.getByTestId('f566-f570-track-production-smoke')).toContainText(/Smoke/i);
  await expect(page.getByTestId('f566-f570-activation-matrix')).toContainText(/Renderer/);
  await expect(page.getByTestId('f566-f570-release-rules')).toContainText(/rollback obligatorio/i);

  await readinessPanel.evaluate((element) => {
    const existing = document.querySelector('[data-testid="f566-f570-readiness-capture-clone"]');
    existing?.remove();
    const clone = element.cloneNode(true) as HTMLElement;
    clone.dataset.testid = 'f566-f570-readiness-capture-clone';
    clone.style.position = 'fixed';
    clone.style.left = '24px';
    clone.style.top = '24px';
    clone.style.zIndex = '99999';
    clone.style.width = '420px';
    clone.style.maxHeight = '900px';
    clone.style.overflow = 'visible';
    clone.style.boxShadow = '0 24px 60px rgba(15, 23, 42, 0.35)';
    document.body.appendChild(clone);
  });
  const captureClone = page.getByTestId('f566-f570-readiness-capture-clone');
  await expect(captureClone).toBeVisible();

  const panelScreenshot = path.join(outputDir, '00_post_beta_readiness_panel.png');
  await captureClone.screenshot({ path: panelScreenshot });

  const canvasScreenshot = path.join(outputDir, '01_post_beta_readiness_canvas.png');
  await page.screenshot({ path: canvasScreenshot, fullPage: false });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box is missing');
  await page.mouse.click(box.x + box.width * 0.44, box.y + box.height * 0.46);
  await expect(page.getByTestId('f515b-canvas-event-action')).not.toHaveText('stable');
  await readinessPanel.scrollIntoViewIfNeeded();

  const eventScreenshot = path.join(outputDir, '02_post_beta_readiness_event_action.png');
  await page.screenshot({ path: eventScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f566_f570_post_beta_readiness.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f566-f570.post-beta-readiness-qa.v1',
        status: 'post-beta-readiness-visible-and-reversible',
        generatedAt: new Date().toISOString(),
        screenshots: [panelScreenshot, canvasScreenshot, eventScreenshot],
        checks: [
          'canvas visible',
          'F566-F570 panel visible',
          'five readiness tracks visible',
          'activation matrix visible',
          'release rules keep rollback mandatory',
          'real pointer event still reaches F561/F515 harness',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
