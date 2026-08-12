import { readFileSync } from 'node:fs';

const checks = [
  ['src/lib/f681F685RendererTargetedLegacyClick.ts', [
    'radshield-mx.canvas.renderer-targeted-legacy-click.f681-f685.v1',
    'buildF681F685RendererTargetedLegacyClick',
    'click-predicted-center',
    'predicted-target-center',
  ]],
  ['src/sections/CanvasArea.tsx', [
    'buildF681F685RendererTargetedLegacyClick',
    'f681-f685-renderer-targeted-legacy-click',
    'data-click-x',
    'data-click-y',
  ]],
  ['src/sections/dialogs/UpdateAppDialog.tsx', ['F681-F685 Targeted legacy click']],
  ['e2e/f681-f685-renderer-targeted-legacy-click.spec.ts', [
    'f681_f685_renderer_targeted_legacy_click',
    'f681-f685-renderer-targeted-legacy-click',
    'f100-main-floorplan-canvas',
  ]],
  ['CHANGELOG.md', ['F681-F685', 'targeted legacy click']],
  ['MANUAL_USUARIO_v99.md', ['F681-F685', 'click dirigido']],
  ['MANUAL_VERSIONES_v50.md', ['F681-F685']],
  ['public/manual_usuario.html', ['F681-F685', 'click dirigido']],
  ['public/manual_versiones.html', ['F681-F685']],
  ['package.json', [
    'test:f681-f685:renderer-targeted-legacy-click',
    'test:f681-f685:renderer-targeted-legacy-click:values',
    'test:f681-f685:renderer-targeted-legacy-click:e2e',
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
  console.error('F681-F685 targeted legacy click contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F681-F685 targeted legacy click contracts passed.');
