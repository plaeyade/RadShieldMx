import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f656F660RendererLegacyClickProbe.ts',
    [
      'radshield-mx.canvas.renderer-legacy-click-probe.f656-f660.v1',
      'buildF656F660RendererLegacyClickProbe',
      'legacy-click-probe-preview',
      'Click legacy observado',
      'Owner legacy preservado',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF656F660RendererLegacyClickProbe',
      'f656-f660-renderer-legacy-click-probe',
      'f656-f660-status',
      'f656-f660-metrics',
      'f656-f660-decision',
      'f656-f660-safety',
      'f656-f660-gates',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F656-F660 Legacy click probe', 'legacy-click-probe-preview'],
  ],
  [
    'e2e/f656-f660-renderer-legacy-click-probe.spec.ts',
    ['f656-f660-renderer-legacy-click-probe', 'f656_f660_renderer_legacy_click_probe'],
  ],
  [
    'CHANGELOG.md',
    ['F656-F660', 'click legacy', 'useCanvas'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F656-F660', 'Legacy Click Probe', 'useCanvas'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F656-F660', 'legacy-click-probe-preview'],
  ],
  [
    'public/manual_usuario.html',
    ['F656-F660', 'Legacy Click Probe'],
  ],
  [
    'public/manual_versiones.html',
    ['F656-F660', 'Legacy Click Probe'],
  ],
  [
    'package.json',
    [
      'test:f656-f660:renderer-legacy-click-probe',
      'test:f656-f660:renderer-legacy-click-probe:values',
      'test:f656-f660:renderer-legacy-click-probe:e2e',
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
  console.error('F656-F660 renderer legacy click probe contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F656-F660 renderer legacy click probe contracts passed.');
