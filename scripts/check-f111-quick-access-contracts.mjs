import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f111QuickAccessImplementation.ts',
    tokens: [
      'buildF111QuickAccessImplementation',
      'implemented-low-risk',
      'Memoria',
      'RAG evidencia',
      'F111 implements favorites and status chips',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'f112-persistent-favorites',
      'f112-smart-status-chips',
      'DB diferida',
      'RAG {f112ResultCount > 0',
      'Smoke pendiente',
    ],
  },
  {
    file: 'src/sections/CanvasQuickActionsSidebar.tsx',
    tokens: [
      'CanvasQuickActionsSidebar v110',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF111QuickAccessImplementation',
      'F111 Acceso Rapido',
      'f111-quick-access-implementation',
      'f111QuickAccess.deferredToF112',
    ],
  },
  {
    file: 'scripts/f111-quick-access-implementation.mjs',
    tokens: [
      'f111_quick_access_implementation.json',
      'fase_111_quick_access_implementation.md',
      'No se reemplazan DX/TX/NM/CY',
    ],
  },
  {
    file: 'outputs/f111_quick_access_implementation.json',
    tokens: [
      '"phase": "F111"',
      '"status": "implemented-low-risk"',
      '"deferredToF112"',
    ],
  },
  {
    file: 'outputs/fase_111_quick_access_implementation.md',
    tokens: [
      'F111',
      'Acceso Rapido de bajo riesgo',
      'Diferido a F112',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f111:quick-access',
      'test:f111:quick-access',
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
  console.error('F111 quick access contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F111 quick access contracts OK');
