import { readFileSync } from 'node:fs';

const checks = [
  [
    'src/lib/f661F665RendererObservedClickBridge.ts',
    [
      'radshield-mx.canvas.renderer-observed-click-bridge.f661-f665.v1',
      'buildF661F665RendererObservedClickBridge',
      'observed-click-bridge-partial',
      'Click legacy capturado',
      'Owner useCanvas',
    ],
  ],
  [
    'src/sections/CanvasArea.tsx',
    [
      'buildF661F665RendererObservedClickBridge',
      'f661-f665-renderer-observed-click-bridge',
      'f661-f665-status',
      'f661-f665-metrics',
      'f661-f665-receipt',
      'f661-f665-decision',
      'f661-f665-gates',
      'radshield_canvas_f661_last_click',
    ],
  ],
  [
    'src/sections/dialogs/UpdateAppDialog.tsx',
    ['F661-F665 Observed click bridge', 'observed-click-bridge-partial'],
  ],
  [
    'e2e/f661-f665-renderer-observed-click-bridge.spec.ts',
    ['f661-f665-renderer-observed-click-bridge', 'f661_f665_renderer_observed_click_bridge'],
  ],
  [
    'CHANGELOG.md',
    ['F661-F665', 'click real', 'useCanvas'],
  ],
  [
    'MANUAL_USUARIO_v99.md',
    ['F661-F665', 'Observed Click Bridge', 'click real'],
  ],
  [
    'MANUAL_VERSIONES_v50.md',
    ['F661-F665', 'observed-click-bridge-partial'],
  ],
  [
    'public/manual_usuario.html',
    ['F661-F665', 'Observed Click Bridge'],
  ],
  [
    'public/manual_versiones.html',
    ['F661-F665', 'Observed Click Bridge'],
  ],
  [
    'package.json',
    [
      'test:f661-f665:renderer-observed-click-bridge',
      'test:f661-f665:renderer-observed-click-bridge:values',
      'test:f661-f665:renderer-observed-click-bridge:e2e',
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
  console.error('F661-F665 renderer observed click bridge contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F661-F665 renderer observed click bridge contracts passed.');
