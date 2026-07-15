import fs from 'node:fs';

const checks = [
  {
    file: 'src/lib/f122CanvasStructuralOverlay.ts',
    tokens: [
      'buildF122CanvasStructuralOverlay',
      'mapBarrierMaterialToF121',
      'getF122StructuralOverlayColor',
      'kgPerLinearM',
      'reviewRequiredCount',
      'datasheetRequiredCount',
      'F123 material editor and cost/schedule comparator',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'buildF122CanvasStructuralOverlay',
      'f122-structural-overlay-panel',
      'f122-structural-risk-chip',
      'f122-review-required-chip',
      'f122-datasheet-required-chip',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF122StructuralOverlayPhaseSummary',
      'f122-canvas-structural-overlay',
      'F122 Canvas structural overlay',
      'F122 Overlay estructural canvas',
    ],
  },
  {
    file: 'scripts/f122-canvas-structural-overlay.mjs',
    tokens: [
      'f122_canvas_structural_overlay.json',
      'fase_122_canvas_structural_overlay.md',
      'f122-structural-overlay-panel',
      'kg/m2',
      'kg/ml',
    ],
  },
  {
    file: 'outputs/f122_canvas_structural_overlay.json',
    tokens: ['"phase": "F122"', 'radshield-mx.canvas-structural-overlay.f122', '"nextPhase": "F123"'],
  },
  {
    file: 'outputs/fase_122_canvas_structural_overlay.md',
    tokens: ['# F122 Canvas Structural Overlay', 'kg/m2', 'kg/ml', 'F123'],
  },
  {
    file: 'package.json',
    tokens: ['prepare:f122:structural-overlay', 'test:f122:structural-overlay'],
  },
];

const failures = [];

for (const check of checks) {
  if (!fs.existsSync(check.file)) {
    failures.push(`${check.file}: missing file`);
    continue;
  }
  const text = fs.readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) failures.push(`${check.file}: missing token "${token}"`);
  }
}

if (failures.length > 0) {
  console.error('F122 canvas structural overlay contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F122 canvas structural overlay contracts OK.');
