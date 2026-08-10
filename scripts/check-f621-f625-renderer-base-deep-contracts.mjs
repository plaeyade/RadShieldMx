import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f621F625RendererBaseDeep.ts',
    [
      'radshield-mx.canvas.renderer-base-deep.f621-f625.v1',
      'buildF621F625RendererBaseDeep',
      'drawF621F625RendererBaseDeepHud',
      'visibleInViewport',
      'dirtyBounds',
      'runtime.eventControllerTouched === false',
      'Renderer profundo sigue dibujando en overlay pointer-events:none',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF621F625RendererBaseDeep',
      'drawF621F625RendererBaseDeepHud',
      'f621-f625-renderer-base-deep',
      'f621-f625-status',
      'f621-f625-metrics',
      'f621-f625-gates',
      'pointer-events-none',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F621-F625 Renderer base profundo', 'renderer-base-deep-preview'],
  ],
  [
    'e2e/f621-f625-renderer-base-deep.spec.ts',
    ['f621-f625-renderer-base-deep', 'f621_f625_renderer_base_deep', 'pointerEvents'],
  ],
  [
    'CHANGELOG.md',
    ['F621-F625', 'Renderer base profundo', 'dirty regions'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F621-F625', 'renderer base profundo', 'overlay sin eventos'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F621-F625', 'renderer-base-deep-preview', 'rollback'],
  ],
  [
    'public/manual_usuario.html',
    ['F621-F625', 'Renderer Base Profundo', 'dirty regions'],
  ],
  [
    'public/manual_versiones.html',
    ['F621-F625', 'Renderer base profundo'],
  ],
  [
    'package.json',
    [
      'test:f621-f625:renderer-base-deep',
      'test:f621-f625:renderer-base-deep:values',
      'test:f621-f625:renderer-base-deep:e2e',
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
  console.error('F621-F625 renderer base deep contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F621-F625 renderer base deep contracts passed.');
