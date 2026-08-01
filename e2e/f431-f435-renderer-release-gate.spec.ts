import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f431_f435_renderer_release_gate');

async function capture(page: Page, name: string) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage: false });
  return file;
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.setItem('radshield_canvas_chrome_mode_f375', 'guided');
  });
});

test('F431-F435 validates calc/renderer closure without hiding canvas shell', async ({ page }) => {
  test.setTimeout(120_000);
  await mkdir(outputDir, { recursive: true });
  await page.setViewportSize({ width: 1600, height: 960 });
  await bootWorkspace(page);

  await expect(page.getByTestId('f100-main-floorplan-canvas')).toBeVisible({ timeout: 20_000 });
  await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible();
  await expect(page.getByTestId('f411-bim-ribbon')).toBeVisible();
  await expect(page.getByTestId('f426-f430-calc-renderer-closure')).toBeVisible();
  await expect(page.getByTestId('f431-f435-renderer-release-gate')).toBeVisible();

  const surfaces = [
    'f431-visual-smoke-surfaces',
    'f432-evidence-memory-manifest',
    'f433-release-block-review',
    'f434-renderer-base-decision',
    'f435-next-phase-handoff',
  ];

  for (const testId of surfaces) {
    await expect(page.getByTestId(testId), `${testId} visible`).toBeVisible();
  }

  const rendererDecision = await page.getByTestId('f434-renderer-base-decision').textContent();
  expect(rendererDecision || '').toMatch(/Renderer:/);

  const screenshot = await capture(page, '01_renderer_release_gate');
  const output = {
    schema: 'radshield-mx.f431-f435.renderer-release-gate-ui.v1',
    phaseRange: 'F431-F435',
    status: 'renderer-release-gate-ui-ready',
    generatedAt: new Date().toISOString(),
    screenshot,
    surfaces,
  };

  await writeFile(path.join(outputDir, 'f431_f435_renderer_release_gate.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  await writeFile(
    path.join(outputDir, 'f431_f435_renderer_release_gate.md'),
    [
      '# F431-F435 Renderer Release Gate',
      '',
      `Status: ${output.status}`,
      `Screenshot: ${screenshot}`,
      '',
      '## Surfaces',
      ...surfaces.map((surface) => `- OK ${surface}`),
      '',
      '## Guardrail',
      '- Renderer base v2 remains gated by F229 and F431 visual smoke.',
      '- Event controller rewrite is not part of this phase.',
      '',
    ].join('\n'),
    'utf8',
  );
});
