import { readFileSync } from 'node:fs';

const checks = [
  ['src/lib/f666F670RendererSelectionStabilizer.ts', [
    'radshield-mx.canvas.renderer-selection-stabilizer.f666-f670.v1',
    'buildF666F670RendererSelectionStabilizer',
    'selection-stabilizer-preview',
    'Muestra diferida',
    'Prediccion coincide',
  ]],
  ['src/sections/CanvasArea.tsx', [
    'buildF666F670RendererSelectionStabilizer',
    'f666-f670-renderer-selection-stabilizer',
    'f666-f670-status',
    'f666-f670-metrics',
    'f666-f670-sample',
    'f666-f670-decision',
    'f666-f670-gates',
    'radshield_canvas_f666_selection_sample',
  ]],
  ['src/sections/dialogs/UpdateAppDialog.tsx', ['F666-F670 Selection stabilizer', 'selection-stabilizer-preview']],
  ['e2e/f666-f670-renderer-selection-stabilizer.spec.ts', ['f666-f670-renderer-selection-stabilizer', 'f666_f670_renderer_selection_stabilizer']],
  ['CHANGELOG.md', ['F666-F670', 'muestra diferida', 'seleccion']],
  ['MANUAL_USUARIO_v99.md', ['F666-F670', 'Selection Stabilizer', 'muestra diferida']],
  ['MANUAL_VERSIONES_v50.md', ['F666-F670', 'selection-stabilizer-preview']],
  ['public/manual_usuario.html', ['F666-F670', 'Selection Stabilizer']],
  ['public/manual_versiones.html', ['F666-F670', 'Selection Stabilizer']],
  ['package.json', [
    'test:f666-f670:renderer-selection-stabilizer',
    'test:f666-f670:renderer-selection-stabilizer:values',
    'test:f666-f670:renderer-selection-stabilizer:e2e',
  ]],
];

const failures = [];
for (const [file, needles] of checks) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file}: missing "${needle}"`);
  }
}

if (failures.length) {
  console.error('F666-F670 renderer selection stabilizer contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F666-F670 renderer selection stabilizer contracts passed.');
