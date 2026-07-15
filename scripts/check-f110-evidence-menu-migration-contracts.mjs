import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f110EvidenceMenuMigration.ts',
    tokens: [
      'buildF110EvidenceMenuMigration',
      'Evidence Pack',
      'RAG deep dive',
      'Reference Library',
      'Evidence becomes canonical in F110',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f110-migrated-evidence-dropdown',
      'F110 Evidencia migrada',
      'RAG deep dive',
      'Reference Library',
      'Evidence Pack (fallback F110)',
      'Technical Audit (fallback F110)',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF110EvidenceMenuMigration',
      'F110 Evidencia canonica',
      'f110-evidence-menu-migration',
      'f110Migration.ragBoundary',
    ],
  },
  {
    file: 'scripts/f110-evidence-menu-migration.mjs',
    tokens: [
      'f110_evidence_menu_migration.json',
      'fase_110_evidence_menu_migration.md',
      'F111 puede implementar Acceso Rapido',
    ],
  },
  {
    file: 'outputs/f110_evidence_menu_migration.json',
    tokens: [
      '"phase": "F110"',
      '"physicalRemovalNow": false',
      '"ragBoundary"',
    ],
  },
  {
    file: 'outputs/fase_110_evidence_menu_migration.md',
    tokens: [
      'F110',
      'Evidencia canonica',
      'Limite RAG/DB',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f110:evidence-menu-migration',
      'test:f110:evidence-menu-migration',
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
  console.error('F110 evidence menu migration contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F110 evidence menu migration contracts OK');
