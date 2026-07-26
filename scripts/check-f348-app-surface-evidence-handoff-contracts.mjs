import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f348_app_surface_evidence_handoff');
const manifestPath = path.join(outDir, 'f348_app_surface_evidence_handoff.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f348:app-surface-evidence-handoff before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f348.app-surface-evidence-handoff.v1', 'Unexpected F348 schema.');
assert(manifest.status === 'app-surface-evidence-handoff-ready', 'F348 status mismatch.');
assert(manifest.signedCalculationProduced === false, 'F348 must stay unsigned.');
assert(Array.isArray(manifest.appSurfaces) && manifest.appSurfaces.length === 5, 'F348 requires five app/report surfaces.');
assert(Array.isArray(manifest.surfaceBindings) && manifest.surfaceBindings.length === 20, 'F348 requires 20 block/surface bindings.');
assert(manifest.appSurfaces.some((surface) => surface.surfaceId === 'canvas-evidence-sidebar'), 'Canvas surface missing.');
assert(manifest.appSurfaces.some((surface) => surface.surfaceId === 'memoria-ai-wizard'), 'Memoria IA surface missing.');
assert(manifest.appSurfaces.some((surface) => surface.surfaceId === 'evidence-pack'), 'Evidence Pack surface missing.');
assert(manifest.surfaceBindings.every((binding) => binding.status === 'bound-preliminary-not-signed'), 'All F348 bindings must be preliminary.');

for (const filePath of [
  path.join(outDir, 'f348_surface_bindings.csv'),
  path.join(outDir, 'f348_app_surface_handoff.svg'),
  path.join(outDir, 'f348_app_surface_handoff.html'),
  path.join(root, 'outputs', 'fase_348_app_surface_evidence_handoff.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F348 artifact: ${filePath}`);
}

assert(readText(path.join(outDir, 'f348_app_surface_handoff.svg')).includes('F348'), 'F348 visual SVG missing title.');
assert(readText(path.join(outDir, 'f348_app_surface_handoff.html')).includes('superficies'), 'F348 visual HTML missing visible text.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f348:app-surface-evidence-handoff'], 'Missing F348 prepare script.');
assert(packageJson.scripts['test:f348:app-surface-evidence-handoff'], 'Missing F348 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F348'), `F348 missing from ${doc}.`);
}

console.log('F348 contracts OK: app/report evidence surfaces are bound and unsigned.');
