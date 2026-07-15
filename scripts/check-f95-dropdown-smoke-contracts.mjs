import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f95DropdownSmoke.ts',
    tokens: [
      'F95DropdownSmokeSummary',
      'buildF95DropdownSmokeSummary',
      'allow-staged-migration',
      'fix-parity-first',
      'physicalMoveNow: false',
      'handlerMapped',
      'dialogRegistered',
      'workflowMapped',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'F95 Dropdown smoke by group',
      'f95-dropdown-smoke-summary',
      'buildF95DropdownSmokeSummary',
      'allow staged migration',
    ],
  },
  {
    file: 'package.json',
    tokens: ['test:f95:dropdown-smoke'],
  },
  {
    file: 'outputs/fase_95_dropdown_smoke_by_group.md',
    tokens: [
      'Fase 95',
      'Dropdown smoke',
      'allow-staged-migration',
      'No se movieron dropdowns',
    ],
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
  console.error('F95 dropdown smoke contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F95 dropdown smoke contract OK');

