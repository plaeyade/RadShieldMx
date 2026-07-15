import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f96DropdownMigration.ts',
    tokens: [
      'F96DropdownMigrationSummary',
      'buildF96DropdownMigrationSummary',
      'design-migrated-with-legacy-fallback',
      'physicalMoveStarted: true',
      'legacyFallbackKept: true',
      'equipment',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f96-migrated-design-dropdown',
      'f96-migrated-design-menu',
      'F96 Diseno migrado',
      'f94-legacy-dropdown-parity-zone',
      'Floor Plan Features',
      'Medical 3D Floor Plan',
      'Auto-Barrier Detection',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'F96 Design dropdown migration',
      'f96-dropdown-migration-summary',
      'buildF96DropdownMigrationSummary',
      'legacy fallback',
    ],
  },
  {
    file: 'package.json',
    tokens: ['test:f96:design-dropdown'],
  },
  {
    file: 'outputs/fase_96_design_dropdown_migration.md',
    tokens: [
      'Fase 96',
      'Design dropdown migration',
      'design-migrated-with-legacy-fallback',
      'fallback legacy',
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
  console.error('F96 design dropdown migration contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F96 design dropdown migration contract OK');

