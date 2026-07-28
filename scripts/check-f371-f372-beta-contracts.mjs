import { existsSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();

function read(file) {
  return readFileSync(path.join(root, file), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const requiredFiles = [
  'e2e/f371-f372-beta-visual-smoke.spec.ts',
  'scripts/f372-beta-static-package.mjs',
  'outputs/f371_f372_beta_visuals/f371_f372_beta_visual_smoke.json',
  'outputs/f372_beta_static_package/f372_beta_static_package.json',
  'outputs/f372_beta_static_package/radshield-mx-f372-static-beta.zip',
];

for (const file of requiredFiles) {
  assert(existsSync(path.join(root, file)), `Missing ${file}`);
}

const spec = read('e2e/f371-f372-beta-visual-smoke.spec.ts');
for (const token of [
  'f100-main-floorplan-canvas',
  'f295-primary-file-menu',
  'canvas-context-menu',
  'f367-f370-release-integration-memoria',
  'f367-f370-release-integration-pdf',
  'f367-f370-release-integration-evidence',
  'f367-f370-medical-3d-release-integration',
  'three_unity_memoria_flow_visual',
]) {
  assert(spec.includes(token), `F371 visual spec missing ${token}`);
}

const packageJson = JSON.parse(read('package.json'));
assert(packageJson.scripts['test:f371-f372:beta-visual'], 'package.json missing test:f371-f372:beta-visual');
assert(packageJson.scripts['prepare:f372:beta-package'], 'package.json missing prepare:f372:beta-package');
assert(packageJson.scripts['test:f371-f372:beta-contracts'], 'package.json missing test:f371-f372:beta-contracts');

const visualSmoke = JSON.parse(read('outputs/f371_f372_beta_visuals/f371_f372_beta_visual_smoke.json'));
assert(['beta-visual-smoke-ready', 'beta-visual-smoke-partial'].includes(visualSmoke.status), 'Unexpected F371 visual smoke status');
assert(Array.isArray(visualSmoke.screenshots) && visualSmoke.screenshots.length >= 6, 'F371 needs visual screenshots');

const packageManifest = JSON.parse(read('outputs/f372_beta_static_package/f372_beta_static_package.json'));
assert(packageManifest.phase === 'F372', 'F372 manifest phase mismatch');
assert(packageManifest.releaseScope.some((item) => /Three\/R3F/.test(item)), 'F372 manifest missing Three/R3F scope');
assert(packageManifest.releaseScope.some((item) => /Unity WebGL/.test(item)), 'F372 manifest missing Unity scope');
assert(packageManifest.notClaimed.some((item) => /Babylon/.test(item)), 'F372 manifest must keep Babylon pending');

const zipSize = statSync(path.join(root, 'outputs/f372_beta_static_package/radshield-mx-f372-static-beta.zip')).size;
assert(zipSize > 1024 * 100, 'F372 static package zip is unexpectedly small');

for (const file of ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  const content = read(file);
  assert(content.includes('F371') || content.includes('F372'), `${file} missing F371/F372 update`);
}

console.log('F371-F372 beta contracts passed.');
