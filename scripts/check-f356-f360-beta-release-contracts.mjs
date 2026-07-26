import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f356_f360_beta_release');
const manifestPath = path.join(outDir, 'f356_f360_beta_release.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

assert(fs.existsSync(manifestPath), 'Run npm run prepare:f356-f360:beta-release before checking contracts.');

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f356-f360.beta-release.v1', 'Unexpected F356-F360 schema.');
assert(manifest.status === 'beta-release-ready-not-certified', 'F356-F360 must be beta-ready and not certified.');
assert(Array.isArray(manifest.phases) && manifest.phases.join(',') === 'F356,F357,F358,F359,F360', 'F356-F360 phase list is incomplete.');
assert(manifest.signedCalculationProduced === false, 'F356-F360 must not produce a signed calculation.');
assert(manifest.releaseClassification === 'beta-operativa-no-certificada', 'Release classification must remain beta/no-certificada.');
assert(manifest.f356UserTestChecklist?.length >= 8, 'F356 user test checklist is incomplete.');
assert(manifest.f357MissingDataCapture?.length >= 7, 'F357 missing-data capture is incomplete.');
assert(manifest.f358PreliminaryCalculations?.length >= 4, 'F358 preliminary calculations must cover four equipment blocks.');
assert(manifest.f359MemoriaSections?.length >= 4, 'F359 Memoria sections must cover four equipment blocks.');
assert(manifest.f360BetaDecision?.decision === 'release-as-beta', 'F360 must decide release-as-beta.');
assert(manifest.f360BetaDecision?.blockedUse?.includes('memoria analitica firmada'), 'F360 must block signed analytic memory.');

for (const artifact of [
  'f356_f360_beta_release_visual.svg',
  'f356_f360_beta_release.html',
  'f356_user_test_checklist.csv',
  'f357_missing_data_capture.csv',
  'f358_traceable_preliminary_calculations.csv',
  'f359_memoria_beta_preliminar.md',
  'radshield_f356_f360_beta_release.zip',
]) {
  const filePath = path.join(outDir, artifact);
  assert(fs.existsSync(filePath), `Missing F356-F360 artifact: ${artifact}`);
  assert(fs.statSync(filePath).size > 0, `Empty F356-F360 artifact: ${artifact}`);
}

assert(fs.statSync(path.join(outDir, 'radshield_f356_f360_beta_release.zip')).size > 1000, 'F356-F360 zip package is too small.');
assert(readText(path.join(outDir, 'f356_f360_beta_release.html')).includes('BETA / NO CERTIFICADO'), 'Beta HTML must show no-certificado banner.');
assert(readText(path.join(outDir, 'f359_memoria_beta_preliminar.md')).includes('NO CERTIFICADO'), 'Memoria beta must be marked no certificado.');
assert(readText(path.join(outDir, 'f358_traceable_preliminary_calculations.csv')).includes('not-certified'), 'Preliminary calculations must stay not-certified.');
assert(fs.existsSync(path.join(root, 'outputs', 'fase_356_360_beta_release.md')), 'Missing F356-F360 phase summary.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f356-f360:beta-release'], 'Missing F356-F360 prepare script.');
assert(packageJson.scripts['test:f356-f360:beta-release'], 'Missing F356-F360 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F356-F360'), `F356-F360 missing from ${doc}.`);
}

console.log('F356-F360 contracts OK: beta release is ready and not certified.');
