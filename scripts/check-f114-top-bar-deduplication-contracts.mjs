import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f114TopBarDeduplication.ts',
    tokens: [
      'buildF114TopBarDeduplication',
      'visibleLegacyMenus',
      'hiddenDuplicateMenus',
      'F114 removes visible duplicate legacy triggers',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f114-deduped-legacy-menu-zone',
      "[t('menu.file'), 'Eficiencia'].includes(String(menu.label))",
      'F114: only non-duplicated legacy menus remain visible',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF114TopBarDeduplication',
      'f114-top-bar-deduplication',
      'F114 Top bar deduplication',
      'F114 Barra superior deduplicada',
    ],
  },
  {
    file: 'scripts/f114-top-bar-deduplication.mjs',
    tokens: [
      'f114_top_bar_deduplication.json',
      'fase_114_top_bar_deduplication.md',
      'Deduplicacion de barra superior',
    ],
  },
  {
    file: 'outputs/f114_top_bar_deduplication.json',
    tokens: [
      '"phase": "F114"',
      '"status": "implemented-controlled"',
      '"visibleLegacyMenus"',
      '"hiddenDuplicateMenus"',
    ],
  },
  {
    file: 'outputs/fase_114_top_bar_deduplication.md',
    tokens: [
      'F114',
      'Deduplicacion de barra superior',
      'Duplicados ocultos',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f114:top-bar-dedup',
      'test:f114:top-bar-dedup',
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
  console.error('F114 top bar deduplication contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F114 top bar deduplication contracts OK');
