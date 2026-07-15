import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f107ShieldingMenuMigration.ts',
    tokens: [
      'buildF107ShieldingMenuMigration',
      'quickAccessAlternatives',
      'Favoritos fijables',
      'workflow-status-chips',
      'Blindaje becomes the third canonical workflow dropdown',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f107-migrated-shielding-dropdown',
      'F107 Blindaje migrado',
      'F107 blindaje migrado (fallback)',
      'AAPM TG 108 PET Shielding (fallback F107)',
      "t('physics.neutron')} (fallback F107)",
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF107ShieldingMenuMigration',
      'F107 Blindaje canonico',
      'f107-shielding-menu-migration',
      'quickAccessAlternatives',
    ],
  },
  {
    file: 'scripts/f107-shielding-menu-migration.mjs',
    tokens: [
      'f107_shielding_menu_migration.json',
      'fase_107_shielding_menu_migration.md',
      'Ribbon compacto por flujo',
      'F108 debe mover Verificacion',
    ],
  },
  {
    file: 'outputs/f107_shielding_menu_migration.json',
    tokens: [
      '"phase": "F107"',
      '"status": "controlled-migration"',
      '"physicalRemovalNow": false',
      '"quickAccessAlternatives"',
    ],
  },
  {
    file: 'outputs/fase_107_shielding_menu_migration.md',
    tokens: [
      'F107',
      'Migracion canonica de Blindaje',
      'Favoritos fijables',
      'F108 debe mover Verificacion',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f107:shielding-menu-migration',
      'test:f107:shielding-menu-migration',
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
  console.error('F107 shielding menu migration contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F107 shielding menu migration contracts OK');
