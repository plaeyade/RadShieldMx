import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f115VisualMenuSmoke.ts',
    tokens: [
      'buildF115VisualMenuSmoke',
      'requiredCanonicalTriggers',
      'forbiddenLegacyTriggers',
      'F115/F116 validates the visible menu surface',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF115VisualMenuSmoke',
      'f115-visual-menu-smoke',
      'F115 Visual menu smoke',
      'F115 Smoke visual menus',
    ],
  },
  {
    file: 'scripts/f115-visual-menu-smoke-plan.mjs',
    tokens: [
      'f115_visual_menu_smoke_plan.json',
      'fase_115_visual_menu_smoke.md',
      'Smoke visual de menus',
    ],
  },
  {
    file: 'scripts/check-f115-visual-menu-smoke.mjs',
    tokens: [
      'f115_visual_menu_smoke_result.json',
      'f114-deduped-legacy-menu-zone',
      'requiredCanonical',
      'forbiddenLegacy',
    ],
  },
  {
    file: 'outputs/f115_visual_menu_smoke_plan.json',
    tokens: [
      '"phase": "F115"',
      '"canonicalDropdowns"',
      '"forbiddenLegacyVisible"',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f115:visual-menu-smoke',
      'test:f115:visual-menu-smoke',
      'test:f115:visual-menu-contracts',
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
  console.error('F115 visual menu smoke contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F115 visual menu smoke contracts OK');
