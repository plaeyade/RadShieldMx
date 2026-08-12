import { readFileSync } from 'node:fs';

const checks = [
  ['src/lib/f686F690RendererOwnerBeforeAfterSmoke.ts', [
    'radshield-mx.canvas.renderer-owner-before-after-smoke.f686-f690.v1',
    'buildF686F690RendererOwnerBeforeAfterSmoke',
    'run-before-after-e2e',
    'eligible-for-controlled-owner-smoke',
  ]],
  ['src/sections/CanvasArea.tsx', [
    'buildF686F690RendererOwnerBeforeAfterSmoke',
    'f686-f690-renderer-before-after-smoke',
    'f686-f690-decision',
    'f686-f690-gates',
  ]],
  ['src/sections/dialogs/UpdateAppDialog.tsx', ['F686-F690 Before/after owner smoke']],
  ['e2e/f686-f690-renderer-before-after-smoke.spec.ts', [
    'f686_f690_renderer_before_after_smoke',
    'canvasHighRiskCad',
    'f686-f690-renderer-before-after-smoke',
  ]],
  ['CHANGELOG.md', ['F686-F690', 'before/after owner smoke']],
  ['MANUAL_USUARIO_v99.md', ['F686-F690', 'smoke antes/despues']],
  ['MANUAL_VERSIONES_v50.md', ['F686-F690']],
  ['public/manual_usuario.html', ['F686-F690', 'smoke antes/despues']],
  ['public/manual_versiones.html', ['F686-F690']],
  ['package.json', [
    'test:f686-f690:renderer-before-after-smoke',
    'test:f686-f690:renderer-before-after-smoke:values',
    'test:f686-f690:renderer-before-after-smoke:e2e',
  ]],
];

const failures = [];
for (const [file, needles] of checks) {
  const text = readFileSync(file, 'utf8');
  for (const needle of needles) {
    if (!text.includes(needle)) failures.push(`${file} missing "${needle}"`);
  }
}

if (failures.length) {
  console.error('F686-F690 before/after smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F686-F690 before/after smoke contracts passed.');
