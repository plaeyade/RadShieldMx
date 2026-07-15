import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f105FinalMenuSmokeGate.ts',
    tokens: [
      'buildF105FinalMenuSmokeGate',
      'F105FinalMenuSmokeGate',
      'physicalMoveNow: boolean',
      'test:submenus:smoke',
      'Static gate passes',
      'runtime smoke',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF105FinalMenuSmokeGate',
      'F105 Final menu smoke gate',
      'f105-final-menu-smoke-gate',
      'runtime smoke required before removal',
      'Do not remove legacy fallback',
    ],
  },
  {
    file: 'scripts/f105-final-menu-smoke-gate.mjs',
    tokens: [
      'f105_final_menu_smoke_gate.json',
      'fase_105_final_menu_smoke_gate.md',
      'PLAYWRIGHT_TEST_BASE_URL=http://127.0.0.1:4174/ npm run test:submenus:smoke',
      'physicalMoveNow',
    ],
  },
  {
    file: 'outputs/f105_final_menu_smoke_gate.json',
    tokens: [
      '"phase": "F105"',
      '"targetFlow"',
      '"physicalMoveNow": false',
      '"requiredBeforeRemoval": true',
      '"passed"',
      '"test:submenus:smoke"',
    ],
  },
  {
    file: 'outputs/fase_105_final_menu_smoke_gate.md',
    tokens: [
      'F105',
      'Smoke final',
      'Diseno -> Equipos -> Blindaje -> Verificacion -> Reportes -> Evidencia -> Integraciones',
      'smoke Playwright',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f105:menu-smoke-gate',
      'test:f105:menu-smoke-gate',
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
  console.error('F105 final menu smoke gate contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F105 final menu smoke gate contracts OK');
