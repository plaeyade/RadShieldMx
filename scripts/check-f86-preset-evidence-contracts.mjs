import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/types/radshield.ts',
    tokens: ['shieldingPresetId?', 'shieldingLayers?', 'shieldingPresetNote?'],
  },
  {
    file: 'src/lib/canvasF85Workflow.ts',
    tokens: ['applyShieldingPresetToBarrier', 'applyShieldingPresetToFloorPlan', 'buildF86EvidenceSummary'],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    tokens: ['handleShieldingPresetApply', 'applyShieldingPresetToFloorPlan', 'buildF86EvidenceSummary', 'selectedCriticalPoint'],
  },
  {
    file: 'src/sections/Sidebar.tsx',
    tokens: ['f86-critical-point-editor', 'f86-selected-barrier-preset', 'selectedCriticalPoint'],
  },
  {
    file: 'src/lib/analyticMemoryEvidence.ts',
    tokens: ['ev-f86-canvas-qa', 'presetCoveragePct', 'criticalPoints'],
  },
  {
    file: 'src/sections/dialogs/EvidencePackDialog.tsx',
    tokens: ['evidence-pack-f86-critical-points', 'evidence-pack-f86-preset-coverage'],
  },
  {
    file: 'src/sections/dialogs/RegulatoryReportDialog.tsx',
    tokens: ['puntos_criticos_f86', 'cobertura_presets_f86_pct'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F86 Shielding preset workflow'],
  },
  {
    file: 'package.json',
    tokens: ['test:f86:preset-evidence'],
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
  console.error('F86 preset/evidence contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F86 preset/evidence contract OK');
