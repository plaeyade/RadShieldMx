import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f94DropdownParity.ts',
    tokens: [
      'F94_CRITICAL_DROPDOWN_COMMANDS',
      'buildF94DropdownParitySummary',
      'ready-for-staged-smoke-not-moved',
      'physicalMoveNow: false',
      'evidencePack',
      'F93_DROPDOWN_MIGRATION_DECISION',
    ],
  },
  {
    file: 'src/stores/dialogRegistry.ts',
    tokens: ['evidencePack'],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f94-legacy-dropdown-parity-zone',
      'F101: legacy menus remain except entries already promoted to primary workflow dropdowns',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'F94 Dropdown parity map',
      'f94-dropdown-parity-summary',
      'buildF94DropdownParitySummary',
      'staged smoke first',
    ],
  },
  {
    file: 'package.json',
    tokens: ['test:f94:dropdown-parity'],
  },
  {
    file: 'outputs/fase_94_dropdown_parity_map.md',
    tokens: [
      'Fase 94',
      'Dropdown parity',
      'ready-for-staged-smoke-not-moved',
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
  console.error('F94 dropdown parity contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F94 dropdown parity contract OK');
