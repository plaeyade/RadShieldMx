import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f108VerificationQuickAccessPlan.ts',
    tokens: [
      'buildF108VerificationQuickAccessPlan',
      'Favoritos fijables',
      'Chips de estado operativo',
      'f112-feature-flag',
      'post-release',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f108-migrated-verification-dropdown',
      'F108 Verificacion migrada',
      'NCRP Validation Suite',
      'Uncertainty (fallback F108)',
      'Sensitivity Analysis (fallback F108)',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF108VerificationQuickAccessPlan',
      'F108 Verificacion canonica',
      'f108-verification-quick-access-plan',
      'quickAccessImplementationPlan',
    ],
  },
  {
    file: 'scripts/f108-verification-quick-access-plan.mjs',
    tokens: [
      'f108_verification_quick_access_plan.json',
      'fase_108_verification_quick_access_plan.md',
      'F111',
      'F112',
    ],
  },
  {
    file: 'outputs/f108_verification_quick_access_plan.json',
    tokens: [
      '"phase": "F108"',
      '"physicalRemovalNow": false',
      '"quickAccessImplementationPlan"',
      'Favoritos fijables',
    ],
  },
  {
    file: 'outputs/fase_108_verification_quick_access_plan.md',
    tokens: [
      'F108',
      'Acceso Rapido',
      'F111',
      'F109 debe migrar Reportes',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f108:verification-quick-access',
      'test:f108:verification-quick-access',
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
  console.error('F108 verification quick access contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F108 verification quick access contracts OK');
