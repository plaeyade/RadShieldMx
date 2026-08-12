import { readFileSync } from 'node:fs';

const checks = [
  ['src/lib/f671F675RendererPredictionAlignment.ts', [
    'radshield-mx.canvas.renderer-prediction-alignment.f671-f675.v1',
    'buildF671F675RendererPredictionAlignment',
    'prediction-alignment-review',
    'missing-selection',
  ]],
  ['src/lib/f676F680RendererOwnerSmoke.ts', [
    'radshield-mx.canvas.renderer-owner-smoke.f676-f680.v1',
    'buildF676F680RendererOwnerSmoke',
    'owner-smoke-blocked',
    'canvasHighRiskCad',
  ]],
  ['src/sections/CanvasArea.tsx', [
    'buildF671F675RendererPredictionAlignment',
    'buildF676F680RendererOwnerSmoke',
    'f671-f675-renderer-prediction-alignment',
    'f676-f680-renderer-owner-smoke',
    'f671-f675-diagnosis',
    'f676-f680-decision',
  ]],
  ['src/sections/dialogs/UpdateAppDialog.tsx', ['F671-F675 Prediction alignment', 'F676-F680 Owner smoke gate']],
  ['e2e/f671-f680-renderer-alignment-owner-smoke.spec.ts', ['f671_f680_renderer_alignment_owner_smoke', 'f676-f680-renderer-owner-smoke']],
  ['CHANGELOG.md', ['F671-F675', 'F676-F680', 'owner smoke']],
  ['MANUAL_USUARIO_v99.md', ['F671-F675', 'F676-F680', 'Owner Smoke']],
  ['MANUAL_VERSIONES_v50.md', ['F671-F675', 'F676-F680']],
  ['public/manual_usuario.html', ['F671-F675', 'F676-F680']],
  ['public/manual_versiones.html', ['F671-F675', 'F676-F680']],
  ['package.json', [
    'test:f671-f680:renderer-alignment-owner-smoke',
    'test:f671-f680:renderer-alignment-owner-smoke:values',
    'test:f671-f680:renderer-alignment-owner-smoke:e2e',
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
  console.error('F671-F680 renderer alignment/owner smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log('F671-F680 renderer alignment/owner smoke contracts passed.');
