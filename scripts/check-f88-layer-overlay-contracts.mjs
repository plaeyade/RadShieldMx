import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/canvasF85Workflow.ts',
    tokens: ['getBarrierLayerDisplay', 'buildF88LayerCoverageSummary', 'f88LayerCount', 'f88PendingBarriers', 'preset-covered'],
  },
  {
    file: 'src/hooks/useCanvas.ts',
    tokens: ['getBarrierLayerDisplay', 'layerDisplay.hasPreset', 'roundRect'],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: ['buildF88LayerCoverageSummary', 'f88-layer-coverage-chip', 'F88'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F88 Layer coverage overlay', 'canvas layer labels'],
  },
  {
    file: 'package.json',
    tokens: ['test:f88:layer-overlay'],
  },
];

const failures = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) failures.push(`${check.file} missing token: ${token}`);
  }
}

if (failures.length > 0) {
  console.error('F88 layer overlay contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F88 layer overlay contract OK');
