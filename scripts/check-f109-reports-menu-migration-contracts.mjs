import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f109ReportsMenuMigration.ts',
    tokens: [
      'buildF109ReportsMenuMigration',
      'Memoria IA',
      'PDF analitico',
      'Evidence Pack bridge',
      'Reports becomes canonical in F109',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f109-migrated-reports-dropdown',
      'F109 Reportes migrados',
      'PDF analitico',
      'Reporte CNSNS',
      'Exportar PDF (fallback F109)',
      'Evidence Pack (fallback F110)',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF109ReportsMenuMigration',
      'F109 Reportes canonicos',
      'f109-reports-menu-migration',
      'f109Migration.canonicalCommands.length',
    ],
  },
  {
    file: 'scripts/f109-reports-menu-migration.mjs',
    tokens: [
      'f109_reports_menu_migration.json',
      'fase_109_reports_menu_migration.md',
      'F110 debe migrar Evidencia',
    ],
  },
  {
    file: 'outputs/f109_reports_menu_migration.json',
    tokens: [
      '"phase": "F109"',
      '"physicalRemovalNow": false',
      '"canonicalCommands"',
    ],
  },
  {
    file: 'outputs/fase_109_reports_menu_migration.md',
    tokens: [
      'F109',
      'Reportes canonicos',
      'F110 debe migrar Evidencia',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f109:reports-menu-migration',
      'test:f109:reports-menu-migration',
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
  console.error('F109 reports menu migration contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F109 reports menu migration contracts OK');
