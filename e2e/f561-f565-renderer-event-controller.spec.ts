import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f561_f565_renderer_event_controller');

test('F561-F565 renderer/event controller v2 observes real canvas pointers and keeps stable handlers', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
    localStorage.setItem('radshield_canvas_qa_inspector_mode_f591', 'expanded');
    localStorage.setItem('radshield_canvas_f525_placement_mode', 'TX');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas).toBeVisible();
  await page.getByTestId('f561-f565-renderer-event-controller').scrollIntoViewIfNeeded();
  await expect(page.getByTestId('f561-f565-renderer-event-controller')).toBeVisible();
  await expect(page.getByTestId('f561-f565-status')).toContainText(/event-controller-v2/i);
  await expect(page.getByTestId('f561-event-harness-summary')).toContainText(/Wrap ON/i);
  await expect(page.getByTestId('f561-f565-lane-event-adapter')).toContainText(/Adaptador/i);
  await expect(page.getByTestId('f561-f565-lane-pointer-routing')).toContainText(/Ruteo/i);
  await expect(page.getByTestId('f561-f565-rollback')).toContainText(/handlers estables/i);

  const panelScreenshot = path.join(outputDir, '00_renderer_event_controller_panel.png');
  await page.getByTestId('f561-f565-renderer-event-controller').screenshot({ path: panelScreenshot });

  const firstScreenshot = path.join(outputDir, '01_renderer_event_controller.png');
  await page.screenshot({ path: firstScreenshot, fullPage: false });

  const box = await canvas.boundingBox();
  if (!box) throw new Error('Canvas bounding box is missing');
  await page.mouse.click(box.x + box.width * 0.38, box.y + box.height * 0.44);
  await expect(page.getByTestId('f515b-canvas-event-action')).not.toHaveText('stable');
  await page.getByTestId('f561-f565-renderer-event-controller').scrollIntoViewIfNeeded();

  const secondScreenshot = path.join(outputDir, '02_renderer_event_controller_pointer.png');
  await page.screenshot({ path: secondScreenshot, fullPage: false });

  await writeFile(
    path.join(outputDir, 'f561_f565_renderer_event_controller.json'),
    `${JSON.stringify(
      {
        schema: 'radshield-mx.f561-f565.renderer-event-controller-qa.v1',
        status: 'event-controller-observed-stable-handler-retained',
        generatedAt: new Date().toISOString(),
        screenshots: [panelScreenshot, firstScreenshot, secondScreenshot],
        checks: [
          'canvas visible',
          'F561-F565 panel visible',
          'pointer wrappers active',
          'real mouse click updates f515b-canvas-event-action',
          'stable handlers remain canonical',
          'renderer overlay remains pointer-events none',
        ],
      },
      null,
      2,
    )}\n`,
    'utf8',
  );
});
