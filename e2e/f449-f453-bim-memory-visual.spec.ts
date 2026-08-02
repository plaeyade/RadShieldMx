import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f449_f453_bim_memory_visual');

test('F449-F453 shows BIM graphic board connected to memory, citations and canvas QA', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible();
  await expect(page.getByTestId('f446-f448-canvas-strong-qa')).toBeVisible();
  await expect(page.getByTestId('f449-f453-bim-memory-visual')).toBeVisible();
  await expect(page.getByTestId('f451-bim-visual-board')).toBeVisible();
  await expect(page.getByTestId('f449-trace-bindings')).toBeVisible();
  await expect(page.getByTestId('f450-citation-bindings')).toBeVisible();
  await expect(page.getByTestId('f451-visual-adaptations')).toBeVisible();
  await expect(page.getByTestId('f452-graphic-panels')).toBeVisible();
  await expect(page.getByTestId('f453-release-handoff')).toBeVisible();
  const statusRow = page.getByTestId('f449-f453-bim-memory-visual-row');
  if (await statusRow.count()) {
    await expect(statusRow).toBeVisible();
  }

  const svgBox = await page.getByTestId('f451-bim-visual-board').evaluate((node) => {
    const box = (node as SVGSVGElement).getBoundingClientRect();
    return { width: Math.round(box.width), height: Math.round(box.height) };
  });
  expect(svgBox.width).toBeGreaterThan(260);
  expect(svgBox.height).toBeGreaterThan(100);

  const traceText = await page.getByTestId('f449-trace-bindings').innerText();
  expect(traceText).toMatch(/Primary barrier|Secondary barrier/);
  const adaptationText = await page.getByTestId('f451-visual-adaptations').innerText();
  expect(adaptationText).toMatch(/shielding-shell|bim-ui-chrome|mep-penetrations/);

  const screenshot = path.join(outputDir, '01_bim_memory_visual.png');
  const boardScreenshot = path.join(outputDir, '02_bim_memory_board_card.png');
  await page.screenshot({ path: screenshot, fullPage: false });
  await page.getByTestId('f449-f453-bim-memory-visual').screenshot({ path: boardScreenshot });
  await writeFile(
    path.join(outputDir, 'f449_f453_bim_memory_visual.json'),
    `${JSON.stringify({
      schema: 'radshield-mx.f449-f453.bim-memory-visual-ui.v1',
      status: 'bim-memory-visual-ui-ready',
      generatedAt: new Date().toISOString(),
      screenshot,
      boardScreenshot,
      checks: [
        'sidebar stable',
        'canvas visible',
        'F446-F448 QA still visible',
        'BIM graphic board visible',
        'calculation trace bindings visible',
        'citation bindings visible',
        'visual adaptations from images and video frames visible',
        'release handoff visible',
      ],
      visualAdaptations: [
        'visible room vs real shielded bunker',
        'every wall has a different job',
        'standards-backed design',
        'BIM/CAD ribbon and project manager from video frames',
        'MEP penetration coordination',
      ],
    }, null, 2)}\n`,
    'utf8',
  );
});
