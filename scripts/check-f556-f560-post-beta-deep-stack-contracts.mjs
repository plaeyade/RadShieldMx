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

const lib = read('src/lib/f556F560PostBetaDeepStack.ts');
requireIncludes('F556-F560 lib', lib, [
  "schema: 'radshield-mx.f556-f560.post-beta-deep-stack.v1'",
  "phaseRange: 'F556-F560'",
  'rendererBaseV2CanReplaceCanvas: false',
  'babylonCanBecomePrimaryRenderer: false',
  'unityCanAuthorClinicalCalculations: false',
  'heavyPhotorealCanAffectTechnicalValues: false',
  'needsFullEndfXcomIcru: true',
  'XCOM photon attenuation',
  'ENDF neutron/photon nuclear data',
]);

const canvas = read('src/sections/CanvasArea.tsx');
requireIncludes('CanvasArea', canvas, [
  'buildF556F560PostBetaDeepStack',
  'buildBabylonDeepRuntimeContract',
  'buildUnityWebglExportedBuildContract',
  'buildAdvancedPhotorealPackContract',
  'buildF484F490NormativeQa',
  'f556-f560-post-beta-deep-stack',
  'f556-f560-status',
  'f556-f560-lane-${lane.id}',
  'f559-technical-db-summary',
  'f556-f560-activation-rules',
]);

const packageJson = read('package.json');
requireIncludes('package scripts', packageJson, [
  'test:f556-f560:post-beta-deep',
  'test:f556-f560:post-beta-deep:e2e',
]);

const e2e = read('e2e/f556-f560-post-beta-deep-stack.spec.ts');
requireIncludes('F556-F560 e2e', e2e, [
  'f556-f560-post-beta-deep-stack',
  'f556-f560-lane-renderer-v2',
  'f556-f560-lane-babylon',
  'f556-f560-lane-unity',
  'f559-technical-db-summary',
  '01_post_beta_deep_stack.png',
  '02_post_beta_deep_stack_panel.png',
  '03_post_beta_deep_stack_ghost.png',
]);

for (const path of ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'public/manual_usuario.html', 'public/manual_versiones.html']) {
  const text = read(path);
  requireIncludes(path, text, ['F556-F560']);
}

if (failures.length) {
  console.error('F556-F560 post-beta deep stack contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[F556-F560] post-beta deep stack contracts OK');
