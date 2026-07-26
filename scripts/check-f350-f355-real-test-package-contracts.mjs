import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f350_f355_real_test_package');
const manifestPath = path.join(outDir, 'f350_f355_real_test_package.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

assert(fs.existsSync(manifestPath), 'Run npm run prepare:f350-f355:real-test-package before checking contracts.');

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f350-f355.real-test-package.v1', 'Unexpected F350-F355 schema.');
assert(manifest.status === 'real-test-package-ready-preliminary-not-certified', 'F350-F355 package must be ready and preliminary.');
assert(Array.isArray(manifest.phases) && manifest.phases.join(',') === 'F350,F351,F352,F353,F354,F355', 'F350-F355 phase list is incomplete.');
assert(manifest.signedCalculationProduced === false, 'F350-F355 must not produce signed calculations.');
assert(manifest.phasePolicy?.fmRsoPolicy?.userRequestedBypass === true, 'FM/RSO bypass policy must be explicit.');
assert(manifest.phasePolicy?.fmRsoPolicy?.blocksWorkflow === false, 'FM/RSO bypass should not block workflow.');
assert(manifest.phasePolicy?.fmRsoPolicy?.blocksSignedCertification === true, 'FM/RSO bypass must block signed certification.');
assert(Array.isArray(manifest.realTestRows) && manifest.realTestRows.length >= 4, 'Real test rows must cover the four Centro Neuro equipment blocks.');
assert(manifest.consistencySummary?.fail === 0, 'Consistency matrix must have zero failures.');
assert(manifest.consistencySummary?.consistent === manifest.consistencySummary?.total, 'All consistency rows must pass.');

const requiredArtifacts = [
  'f350_f355_visual_smoke.svg',
  'f350_f355_visual_smoke.html',
  'f351_memoria_preliminar.md',
  'f352_missing_data_closeout.csv',
  'f353_report_evidence_draft.html',
  'f354_consistency_matrix.csv',
  'f355_operator_package_manifest.csv',
  'radshield_f350_f355_real_test_package.zip',
];

for (const artifact of requiredArtifacts) {
  const filePath = path.join(outDir, artifact);
  assert(fs.existsSync(filePath), `Missing F350-F355 artifact: ${artifact}`);
  assert(fs.statSync(filePath).size > 0, `Empty F350-F355 artifact: ${artifact}`);
}

assert(fs.statSync(path.join(outDir, 'radshield_f350_f355_real_test_package.zip')).size > 1000, 'F350-F355 zip package is too small.');
assert(readText(path.join(outDir, 'f351_memoria_preliminar.md')).includes('NO CERTIFICADO'), 'Memoria draft must be marked no certificado.');
assert(readText(path.join(outDir, 'f352_missing_data_closeout.csv')).includes('bypassed-for-workflow-test'), 'Missing-data closeout must include FM/RSO bypass status.');
assert(readText(path.join(outDir, 'f354_consistency_matrix.csv')).includes('consistent'), 'Consistency matrix must include consistent rows.');
assert(fs.existsSync(path.join(root, 'outputs', 'fase_350_355_real_test_package.md')), 'Missing F350-F355 phase summary.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f350-f355:real-test-package'], 'Missing F350-F355 prepare script.');
assert(packageJson.scripts['test:f350-f355:real-test-package'], 'Missing F350-F355 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F350-F355'), `F350-F355 missing from ${doc}.`);
}

console.log('F350-F355 contracts OK: real test package is ready, preliminary and unsigned.');
