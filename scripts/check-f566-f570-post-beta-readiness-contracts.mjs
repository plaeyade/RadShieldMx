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

const lib = read('src/lib/f566F570PostBetaProductionReadiness.ts');
requireIncludes('F566-F570 lib', lib, [
  "schema: 'radshield-mx.f566-f570.post-beta-production-readiness.v1'",
  "phaseRange: 'F566-F570'",
  "rendererBaseV2: 'observable-only'",
  "babylonDeep: 'preview-with-three-fallback'",
  "unityWebgl: 'external-build-required'",
  "photorealism: 'visual-only-no-technical-values'",
  "normativeQa: 'required-before-clinical-claim'",
  'canReplaceCanvasRenderer: false',
  'canClaimClinicalMonteCarlo: false',
  'mustKeepRollback: true',
]);

const canvas = read('src/sections/CanvasArea.tsx');
requireIncludes('CanvasArea', canvas, [
  'buildF566F570PostBetaProductionReadiness',
  'f566-f570-post-beta-readiness',
  'f566-f570-status',
  'f566-f570-track-${track.id}',
  'f566-f570-activation-matrix',
  'f566-f570-release-rules',
]);

const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
requireIncludes('UpdateAppDialog', update, ['F566-F570 Post-beta production readiness']);

const packageJson = read('package.json');
requireIncludes('package scripts', packageJson, [
  'test:f566-f570:post-beta-readiness',
  'test:f566-f570:post-beta-readiness:e2e',
]);

const e2e = read('e2e/f566-f570-post-beta-readiness.spec.ts');
requireIncludes('F566-F570 e2e', e2e, [
  'f566-f570-post-beta-readiness',
  '00_post_beta_readiness_panel.png',
  '01_post_beta_readiness_canvas.png',
  '02_post_beta_readiness_event_action.png',
]);

for (const path of ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'public/manual_usuario.html', 'public/manual_versiones.html']) {
  requireIncludes(path, read(path), ['F566-F570']);
}

if (failures.length) {
  console.error('F566-F570 post-beta readiness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[F566-F570] post-beta readiness contracts OK');
