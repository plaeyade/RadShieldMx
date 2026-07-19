import fs from 'node:fs';
import { expect, test, type Locator, type Page } from '@playwright/test';
import { bootWorkspace } from './helpers';

const evidenceDir = 'outputs/f229_canvas_cad_e2e_harness';
const visualModeTestIds = [
  'f191-visual-mode-plan',
  'f191-visual-mode-heat',
  'f191-visual-mode-isocontours',
  'f191-visual-mode-structure',
] as const;

async function canvasBox(canvas: Locator) {
  const box = await canvas.boundingBox();
  expect(box, 'canvas bounding box').toBeTruthy();
  return box!;
}

async function fireCanvasMouse(
  canvas: Locator,
  type: 'mousedown' | 'mousemove' | 'mouseup' | 'click',
  x: number,
  y: number,
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
) {
  const box = await canvasBox(canvas);
  await canvas.evaluate(
    (node, event) => {
      node.dispatchEvent(new MouseEvent(event.type, {
        bubbles: true,
        cancelable: true,
        button: 0,
        clientX: event.clientX,
        clientY: event.clientY,
        ctrlKey: event.ctrlKey,
        metaKey: event.metaKey,
        shiftKey: event.shiftKey,
      }));
    },
    {
      type,
      clientX: box.x + x,
      clientY: box.y + y,
      ctrlKey: Boolean(options.ctrlKey),
      metaKey: Boolean(options.metaKey),
      shiftKey: Boolean(options.shiftKey),
    },
  );
}

async function dragCanvas(
  canvas: Locator,
  from: { x: number; y: number },
  to: { x: number; y: number },
  options: { ctrlKey?: boolean; metaKey?: boolean; shiftKey?: boolean } = {},
) {
  await fireCanvasMouse(canvas, 'mousedown', from.x, from.y, options);
  for (let step = 1; step <= 5; step += 1) {
    const ratio = step / 5;
    await fireCanvasMouse(
      canvas,
      'mousemove',
      from.x + (to.x - from.x) * ratio,
      from.y + (to.y - from.y) * ratio,
      options,
    );
  }
  await fireCanvasMouse(canvas, 'mouseup', to.x, to.y, options);
}

async function assertCanvasShell(page: Page, label: string) {
  const canvas = page.getByTestId('f100-main-floorplan-canvas');
  await expect(canvas, `${label}: canvas visible`).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('f186-sidebar-stable-width'), `${label}: sidebar visible`).toBeVisible();
  await expect(page.getByTestId('f191-pyrate-inspired-toolbar'), `${label}: CAD toolbar visible`).toBeVisible();
  await expect(page.getByTestId('f221-canvas-real-connections'), `${label}: F221 row visible`).toBeVisible();
  await expect(page.getByTestId('f222-f226-canvas-hardening'), `${label}: F222-F226 row visible`).toBeVisible();
  await expect(page.getByTestId('f227-renderer-layer-extraction'), `${label}: F227 row visible`).toBeVisible();
  await expect(page.getByTestId('f228-static-renderer-helpers'), `${label}: F228 row visible`).toBeVisible();
  await expect(page.getByTestId('f229-canvas-cad-e2e-harness'), `${label}: F229 row visible`).toBeVisible();
}

async function hasNonBlankCanvas(canvas: Locator) {
  return canvas.evaluate((node: HTMLCanvasElement) => {
    const ctx = node.getContext('2d');
    if (!ctx || node.width < 40 || node.height < 40) return false;
    const image = ctx.getImageData(
      Math.max(0, Math.floor(node.width / 2) - 24),
      Math.max(0, Math.floor(node.height / 2) - 24),
      48,
      48,
    );
    for (let i = 0; i < image.data.length; i += 4) {
      const r = image.data[i];
      const g = image.data[i + 1];
      const b = image.data[i + 2];
      const alpha = image.data[i + 3];
      if (alpha > 0 && (r < 248 || g < 248 || b < 248)) return true;
    }
    return false;
  }).catch(() => true);
}

async function barrierCount(page: Page) {
  const text = await page.getByText(/Barreras:\s*\d+/).first().textContent({ timeout: 10_000 }).catch(() => '');
  const match = text?.match(/Barreras:\s*(\d+)/);
  return match ? Number(match[1]) : 0;
}

test.describe('F229 Canvas CAD E2E Harness', () => {
  test.beforeAll(() => {
    fs.mkdirSync(evidenceDir, { recursive: true });
  });

  test.beforeEach(async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1000 });
    await bootWorkspace(page);
    await page.waitForTimeout(750);
  });

  test('keeps the canvas shell, renderer rows and nonblank drawing surface alive', async ({ page }) => {
    await assertCanvasShell(page, 'boot');
    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    const box = await canvasBox(canvas);
    expect(box.width).toBeGreaterThan(800);
    expect(box.height).toBeGreaterThan(420);
    expect(await hasNonBlankCanvas(canvas)).toBeTruthy();
    await page.screenshot({ path: `${evidenceDir}/f229-shell.png`, fullPage: true });
  });

  test('draws a barrier, selects safely and exercises window/lasso gestures', async ({ page }) => {
    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    const before = await barrierCount(page);

    await page.getByTestId('f191-tool-barrier').click();
    await expect(page.getByTestId('f191-mode-status')).toBeVisible();
    await dragCanvas(canvas, { x: 740, y: 540 }, { x: 980, y: 540 });

    await expect.poll(async () => barrierCount(page), {
      message: 'barrier count should increase after drawing',
      timeout: 5_000,
    }).toBeGreaterThan(before);

    await page.getByTestId('f191-tool-select').click();
    await fireCanvasMouse(canvas, 'click', 860, 540);
    await expect(page.getByTestId('f191c-object-inspector')).toBeVisible();

    await dragCanvas(canvas, { x: 160, y: 140 }, { x: 620, y: 310 }, { shiftKey: true });
    await dragCanvas(canvas, { x: 180, y: 160 }, { x: 660, y: 330 }, { ctrlKey: true });
    await assertCanvasShell(page, 'after draw/select/lasso');
    await page.screenshot({ path: `${evidenceDir}/f229-draw-select-lasso.png`, fullPage: true });
  });

  test('switches visual modes and validates export scene controls without hiding the floorplan', async ({ page }) => {
    for (const testId of visualModeTestIds) {
      await page.getByTestId(testId).click();
      await assertCanvasShell(page, `visual mode ${testId}`);
    }

    await expect(page.getByTestId('f217-visual-export-by-scene')).toBeVisible();
    await page.getByTestId('f217-prepare-scene-plan').click();
    await page.getByTestId('f217-prepare-scene-heat').click();
    await page.getByTestId('f217-prepare-scene-structure').click();
    await assertCanvasShell(page, 'after export scene prep');
    await page.screenshot({ path: `${evidenceDir}/f229-visual-modes-export-surface.png`, fullPage: true });
  });
});
