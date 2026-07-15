import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'F101: legacy menus remain except entries already promoted to primary workflow dropdowns',
      "].filter((menu) => menu.label !== t('menu.design')).map",
      'data-testid="f96-migrated-design-menu"',
      'label="3D Bunker Viewer"',
      'label="Shapes Reconstruction (v33)"',
      'data-testid="f97-migrated-equipment-menu"',
      'data-testid="f94-legacy-dropdown-parity-zone"',
    ],
  },
  {
    file: 'outputs/fase_101_access_dedup.md',
    tokens: [
      'F101',
      'duplicidad',
      'Diseño',
      'legacy',
      'Acceso Rapido',
      'pendientes',
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
  console.error('F101 access dedup contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F101 access dedup contracts OK');
