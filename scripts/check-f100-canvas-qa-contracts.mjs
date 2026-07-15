import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'f100-main-floorplan-canvas',
      'f99-cad-like-readiness-panel',
      'f89-heatmap-toggle',
      'f89-heatmap-status-chip',
    ],
  },
  {
    file: 'src/hooks/useCanvas.ts',
    tokens: [
      'selectedIds',
      'hoverId',
      'snapAdvanced',
      'barrier-start',
      'barrier-mid',
      'barrier-end',
      'source-rotate',
      'selection-window',
      'Umbral regulatorio',
      'cadLikeFeatures',
    ],
  },
  {
    file: 'e2e/canvas-cad-like.spec.ts',
    tokens: [
      'F100 Canvas CAD-like QA',
      'f100-main-floorplan-canvas',
      'cad-inline-barrier-editor',
      'dragCanvas',
      'f99-cad-selection',
      'f89-heatmap-toggle',
    ],
  },
  {
    file: 'outputs/fase_100_canvas_interactive_qa.md',
    tokens: [
      'F100',
      'QA visual/interactivo',
      'Playwright',
      'grips arrastrables',
      'heat maps',
      'pendientes',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F100 canvas QA contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F100 canvas QA contracts OK');
