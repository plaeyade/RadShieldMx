import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/canvasF85Workflow.ts',
    tokens: ['buildCanvasQAExport', 'canvasQAExportToCsv', 'radshield-mx.canvas-qa.f87'],
  },
  {
    file: 'src/sections/Sidebar.tsx',
    tokens: ['f87-barrier-preset-selector', 'f87-preset-', 'applyShieldingPresetToBarrier', 'SHIELDING_PRESETS'],
  },
  {
    file: 'src/pages/ShieldingDesigner.tsx',
    tokens: ['buildCanvasQAExport', 'canvasQAExportToCsv', 'canvas_qa_f87_', 'Incluye JSON/CSV F87'],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F87 Canvas QA export', 'visual presets + JSON/CSV'],
  },
  {
    file: 'package.json',
    tokens: ['test:f87:canvas-qa-export'],
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
  console.error('F87 canvas QA export contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F87 canvas QA export contract OK');
