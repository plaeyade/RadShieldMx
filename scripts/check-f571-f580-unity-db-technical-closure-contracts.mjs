import { readFileSync } from 'node:fs';

const failures = [];

function read(path) {
  return readFileSync(path, 'utf8');
}

function requireIncludes(label, text, tokens) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const lib = read('src/lib/f571F580UnityDbTechnicalClosure.ts');
requireIncludes('F571-F580 lib', lib, [
  "schema: 'radshield-mx.f571-f580.unity-db-technical-closure.v1'",
  "phaseRange: 'F571-F580'",
  "'unity-build-blocked'",
  'canSeedLiveDb: false',
  'canClaimClinicalCertifiedCalculation: false',
  'public/unity/radshield-medical-3d',
  'XCOM photon attenuation by material/mixture/energy',
  'ENDF neutron/photon data for high-energy/cyclotron workflows',
]);

const canvas = read('src/sections/CanvasArea.tsx');
requireIncludes('CanvasArea', canvas, [
  'buildF571F580UnityDbTechnicalClosure',
  'f571-f580-unity-db-closure',
  'f571-f580-status',
  'f571-f580-track-${track.id}',
  'f571-f575-unity-build-summary',
  'f576-f580-technical-db-summary',
  'f571-f580-release-rules',
]);

const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
requireIncludes('UpdateAppDialog', update, ['F571-F580 Unity WebGL real + DB tecnica']);

const packageJson = read('package.json');
requireIncludes('package scripts', packageJson, [
  'test:f571-f580:unity-db-closure',
  'test:f571-f580:unity-db-closure:e2e',
]);

const e2e = read('e2e/f571-f580-unity-db-technical-closure.spec.ts');
requireIncludes('F571-F580 e2e', e2e, [
  'f571-f580-unity-db-closure',
  '00_unity_db_closure_panel.png',
  '01_unity_db_closure_canvas.png',
  '02_unity_db_closure_event_action.png',
]);

for (const path of ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'public/manual_usuario.html', 'public/manual_versiones.html']) {
  requireIncludes(path, read(path), ['F571-F580']);
}

if (failures.length) {
  console.error('F571-F580 Unity/DB technical closure contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[F571-F580] Unity/DB technical closure contracts OK');
