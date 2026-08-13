import { readFileSync } from 'node:fs';

const checks = [
  ['src/lib/f691F695RendererControlledOwnerSmoke.ts', [
    'radshield-mx.canvas.renderer-controlled-owner-smoke.f691-f695.v1',
    'buildF691F695RendererControlledOwnerSmoke',
    'select-target-only',
    'canvasEventControllerV2',
  ]],
  ['src/lib/medical3D/f696F700PhotorealAssetReadiness.ts', [
    'radshield-mx.medical3d.photoreal-asset-readiness.f696-f700.v1',
    'buildF696F700PhotorealAssetReadiness',
    'public/medical3d/photoreal',
    'public/medical3d/models/{linac,gamma-knife,cyclotron,petct}.glb',
  ]],
  ['src/sections/CanvasArea.tsx', [
    'buildF691F695RendererControlledOwnerSmoke',
    'f691-f695-renderer-controlled-owner-smoke',
    'f691-f695-decision',
    'buildF696F700PhotorealAssetReadiness',
    'f696-f700-photoreal-asset-readiness',
    'f696-f700-decision',
  ]],
  ['src/sections/dialogs/UpdateAppDialog.tsx', [
    'F691-F695 Controlled owner smoke',
    'F696-F700 Photoreal asset readiness',
  ]],
  ['e2e/f691-f700-owner-smoke-photoreal.spec.ts', [
    'f691_f700_owner_smoke_photoreal',
    'canvasEventControllerV2',
    'f696-f700-photoreal-asset-readiness',
  ]],
  ['CHANGELOG.md', ['F691-F700', 'controlled owner smoke']],
  ['MANUAL_USUARIO_v99.md', ['F691-F700', 'Asset Readiness']],
  ['MANUAL_VERSIONES_v50.md', ['F691-F700']],
  ['public/manual_usuario.html', ['F691-F700', 'fotorrealista']],
  ['public/manual_versiones.html', ['F691-F700', 'Asset Readiness']],
  ['package.json', [
    'test:f691-f700:owner-smoke-photoreal',
    'test:f691-f700:owner-smoke-photoreal:values',
    'test:f691-f700:owner-smoke-photoreal:e2e',
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
  console.error('F691-F700 owner smoke + photoreal contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F691-F700 owner smoke + photoreal contracts passed.');
