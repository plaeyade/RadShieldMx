import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/types/radshield.ts',
    tokens: ['export interface CriticalPoint', 'criticalPoints?: CriticalPoint[]'],
  },
  {
    file: 'src/lib/canvasF85Workflow.ts',
    tokens: ['SHIELDING_PRESETS', 'buildCriticalPointDraft', 'buildScaleCalibrationDraft', 'buildAuditSnapshotMetadata', 'getF85CanvasReadiness'],
  },
  {
    file: 'src/hooks/useCanvas.ts',
    tokens: ['Punto critico', 'criticalPoints', 'CriticalPoint'],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: ['f85-canvas-tools-panel', 'Calibrar', 'Punto critico', 'Presets', 'Snapshot', 'getF85CanvasReadiness'],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    tokens: ['handleCalibrateScaleQuick', 'handleAddCriticalPointDraft', 'handleShieldingPresetApply', 'handleAuditSnapshot', 'calibrateScale'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F85 Canvas QA tools', 'scale/critical/preset/snapshot base'],
  },
  {
    file: 'package.json',
    tokens: ['test:f85:canvas-tools'],
  },
];

const failures = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      failures.push(`${check.file} missing token: ${token}`);
    }
  }
}

if (failures.length > 0) {
  console.error('F85 canvas tools contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F85 canvas tools contract OK');
