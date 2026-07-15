import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f90EndToEndQa.ts',
    tokens: [
      'buildF90EndToEndChecklist',
      'summarizeF90EndToEndQa',
      'releaseReadyOffline',
      'controlledZone',
      'dbDecision',
      'heatmap',
    ],
  },
  {
    file: 'src/sections/CanvasArea.tsx',
    tokens: [
      'f90-e2e-qa-panel',
      'f90-step-${step.id}',
      'buildF90EndToEndChecklist',
      'summarizeF90EndToEndQa',
      'F90 {f90Summary.pct}%',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: ['F90 End-to-end QA', 'release smoke checklist'],
  },
  {
    file: 'package.json',
    tokens: ['test:f90:e2e-qa'],
  },
  {
    file: 'outputs/fase_90_end_to_end_qa.md',
    tokens: ['Fase 90', 'Release smoke', 'DB diferida'],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) {
      missing.push(`${check.file}: ${token}`);
    }
  }
}

if (missing.length > 0) {
  console.error('F90 end-to-end QA contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F90 end-to-end QA contract OK');
