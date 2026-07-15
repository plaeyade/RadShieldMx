import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f106PhysicalMenuMigration.ts',
    tokens: [
      'buildF106PhysicalMenuMigration',
      'controlled-migration',
      'canonical-dropdown',
      'labeled-rollback',
      'duplicate React key Rb-82',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'F106 equipo migrado (fallback)',
      'Medicina nuclear avanzada',
      'Equipment Library (rollback F106)',
      '(rollback F106)',
      'f97-migrated-equipment-dropdown',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF106PhysicalMenuMigration',
      'F106 Migracion fisica controlada',
      'f106-physical-menu-migration',
      'rollback F106',
    ],
  },
  {
    file: 'scripts/f106-physical-menu-migration.mjs',
    tokens: [
      'f106_physical_menu_migration.json',
      'fase_106_physical_menu_migration.md',
      'controlled-migration',
      'Equipos queda como dropdown canonico',
    ],
  },
  {
    file: 'outputs/f106_physical_menu_migration.json',
    tokens: [
      '"phase": "F106"',
      '"status": "controlled-migration"',
      '"physicalRemovalNow": false',
      '"labeledRollbackItems"',
    ],
  },
  {
    file: 'outputs/fase_106_physical_menu_migration.md',
    tokens: [
      'F106',
      'Migracion fisica controlada',
      'rollback F106',
      'Mover Blindaje',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f106:physical-menu-migration',
      'test:f106:physical-menu-migration',
    ],
  },
];

const missing = [];
for (const check of checks) {
  const text = readFileSync(check.file, 'utf8');
  for (const token of check.tokens) {
    if (!text.includes(token)) missing.push(`${check.file}: ${token}`);
  }
}

if (missing.length > 0) {
  console.error('F106 physical menu migration contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F106 physical menu migration contracts OK');
