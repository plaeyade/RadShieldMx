import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f636F640RendererHitTestShadow.ts',
    [
      'radshield-mx.canvas.renderer-hit-test-shadow.f636-f640.v1',
      'buildF636F640RendererHitTestShadow',
      'drawF636F640HitTestShadowOverlay',
      'candidateIds',
      'hit-test-shadow-preview',
      'Mantener useCanvas',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF636F640RendererHitTestShadow',
      'drawF636F640HitTestShadowOverlay',
      'f636-f640-renderer-hit-test-shadow',
      'f636-f640-status',
      'f636-f640-metrics',
      'f636-f640-probe',
      'f636-f640-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F636-F640 Hit-test shadow map', 'hit-test-shadow-preview'],
  ],
  [
    'e2e/f636-f640-renderer-hit-test-shadow.spec.ts',
    ['f636-f640-renderer-hit-test-shadow', 'f636_f640_renderer_hit_test_shadow'],
  ],
  [
    'CHANGELOG.md',
    ['F636-F640', 'hit-test shadow', 'candidatos'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F636-F640', 'hit-test', 'preview reversible'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F636-F640', 'hit-test-shadow-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F636-F640', 'Hit-test Shadow'],
  ],
  [
    'public/manual_versiones.html',
    ['F636-F640', 'Hit-test Shadow'],
  ],
  [
    'package.json',
    [
      'test:f636-f640:renderer-hit-test-shadow',
      'test:f636-f640:renderer-hit-test-shadow:values',
      'test:f636-f640:renderer-hit-test-shadow:e2e',
    ],
  ],
];

const failures = [];
for (const [file, needles] of checks) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file}: missing "${needle}"`);
  }
}

if (failures.length) {
  console.error('F636-F640 renderer hit-test shadow contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F636-F640 renderer hit-test shadow contracts passed.');
