import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f116UtilityMenuConsolidation.ts',
    tokens: [
      'buildF116UtilityMenuConsolidation',
      'visibleLegacyMenus',
      'movedToIntegrations',
      'f116-migrated-integrations-dropdown',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f116-migrated-integrations-dropdown',
      'f116-migrated-integrations-menu',
      'F116: Archivo remains as the only visible utility menu',
      "].filter((menu) => [t('menu.file')].includes(String(menu.label)))",
    ],
  },
  {
    file: 'src/lib/f115VisualMenuSmoke.ts',
    tokens: [
      'f116-migrated-integrations-dropdown',
      "requiredLegacyTriggers: ['Archivo']",
      'Eficiencia',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF116UtilityMenuConsolidation',
      'f116-utility-menu-consolidation',
      'F116 Utility consolidation',
      'F116 Consolidacion utilidades',
    ],
  },
  {
    file: 'scripts/f116-utility-menu-consolidation.mjs',
    tokens: [
      'f116_utility_menu_consolidation.json',
      'fase_116_utility_menu_consolidation.md',
      'No se borran handlers legacy',
    ],
  },
  {
    file: 'outputs/f116_utility_menu_consolidation.json',
    tokens: [
      '"phase": "F116"',
      '"visibleLegacyMenus"',
      '"canonicalIntegrationsTrigger": "f116-migrated-integrations-dropdown"',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f116:utility-menu',
      'test:f116:utility-menu',
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
  console.error('F116 utility menu consolidation contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F116 utility menu consolidation contracts OK');
