import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f97DropdownMigration.ts',
    tokens: [
      'F97DropdownMigrationSummary',
      'buildF97DropdownMigrationSummary',
      'equipment-migrated-with-legacy-fallback',
      'physicalMoveContinued: true',
      'legacyFallbackKept: true',
      'shielding',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f97-migrated-equipment-dropdown',
      'f97-migrated-equipment-menu',
      'F97 Equipos migrado',
      "openDialog('sourceLibrary')",
      'Equipment Library',
      'Gamma Knife',
      'Cyclone KIUBE',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'F97 Equipment dropdown migration',
      'f97-dropdown-migration-summary',
      'buildF97DropdownMigrationSummary',
      'equipment migrated with legacy fallback',
    ],
  },
  {
    file: 'package.json',
    tokens: ['test:f97:equipment-dropdown'],
  },
  {
    file: 'outputs/fase_97_equipment_dropdown_migration.md',
    tokens: [
      'Fase 97',
      'Equipment dropdown migration',
      'equipment-migrated-with-legacy-fallback',
      'Fases hacia release',
      'Puntos pendientes',
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
  console.error('F97 equipment dropdown migration contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F97 equipment dropdown migration contract OK');

