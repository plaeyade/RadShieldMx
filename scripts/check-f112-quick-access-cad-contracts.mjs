import { readFileSync } from 'node:fs';

const checks = [
  {
    file: 'src/lib/f112QuickAccessCadIntegration.ts',
    tokens: [
      'buildF112QuickAccessCadIntegration',
      'persistentFavorites',
      'miniCadTools',
      'DX/TX/NM/CY remain category launchers',
    ],
  },
  {
    file: 'src/sections/Toolbar.tsx',
    tokens: [
      'F112_FAVORITES_KEY',
      'f112-persistent-favorites',
      'f112-smart-status-chips',
      'Layout {f112BarrierCount}B',
      "RAG {f112ResultCount > 0 ? 'listo' : 'tras calcular'}",
      'f112-pin-',
    ],
  },
  {
    file: 'src/sections/CanvasQuickActionsSidebar.tsx',
    tokens: [
      'MINI_CAD_ACTIONS',
      'f112-mini-cad-sidebar',
      'f112-mini-cad-',
      'v112',
    ],
  },
  {
    file: 'src/sections/dialogs/UpdateAppDialog.tsx',
    tokens: [
      'buildF112QuickAccessCadIntegration',
      'f112-quick-access-cad-integration',
      'F112 Acceso Rapido + Mini CAD',
      'f112Integration.dxTxNmCyPolicy',
    ],
  },
  {
    file: 'scripts/f112-quick-access-cad-integration.mjs',
    tokens: [
      'f112_quick_access_cad_integration.json',
      'fase_112_quick_access_cad_integration.md',
      'Sidebar mini CAD',
      'DX/TX/NM/CY se preservan',
    ],
  },
  {
    file: 'outputs/f112_quick_access_cad_integration.json',
    tokens: [
      '"phase": "F112"',
      '"status": "implemented-feature-flag-safe"',
      '"miniCadTools"',
      '"persistentFavorites"',
    ],
  },
  {
    file: 'outputs/fase_112_quick_access_cad_integration.md',
    tokens: [
      'F112',
      'Chips inteligentes',
      'Sidebar mini CAD',
      'Favoritos persistentes',
    ],
  },
  {
    file: 'package.json',
    tokens: [
      'prepare:f112:quick-access-cad',
      'test:f112:quick-access-cad',
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
  console.error('F112 quick access CAD contracts failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F112 quick access CAD contracts OK');
