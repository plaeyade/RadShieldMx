import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f346_standard_parameter_draft');
const manifestPath = path.join(outDir, 'f346_standard_parameter_draft.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f346:standard-parameter-draft before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f346.standard-parameter-draft.v1', 'Unexpected F346 schema.');
assert(manifest.status === 'standard-parameters-applied-draft-only', 'F346 must remain draft-only.');
assert(manifest.signedCalculationProduced === false, 'F346 must not produce signed calculations.');
assert(Array.isArray(manifest.parameterizedRows) && manifest.parameterizedRows.length === 24, 'F346 requires 24 parameterized rows.');
assert(manifest.parameterizedRows.every((row) => row.standardParameterStatus === 'standard-parameters-applied-for-draft'), 'Every row must have standard parameters.');
assert(manifest.parameterizedRows.every((row) => row.outputStatus === 'standard-draft-ready-final-review-blocked'), 'Every row must be final-review blocked.');
assert(manifest.parameterizedRows.some((row) => row.sourceTermId === 'std-versa-hd-15mev-max-workload-draft'), 'Versa HD standard source term missing.');
assert(manifest.parameterizedRows.some((row) => row.sourceTermId === 'std-gamma-knife-esprit-cobalt60-draft'), 'Gamma Knife standard source term missing.');
assert(manifest.parameterizedRows.some((row) => row.sourceTermId === 'std-cyclone-kiube-18mev-max-production-draft'), 'KIUBE standard source term missing.');
assert(manifest.materialCandidate?.densityKgM3Draft === 3200, 'High-density concrete draft density missing.');
assert(manifest.materialCandidate?.tvlStatus === 'candidate-values-require-citation-before-use', 'TVL candidates must require citation before use.');
assert(manifest.materialCandidate?.warning.includes('placeholders'), 'Material warning must mark TVL values as placeholders.');
assert(manifest.parameterizedRows.every((row) => row.tvlCitationStatus.includes('requires')), 'Every row must require TVL/inventory citation.');
assert(manifest.standardPenetrations?.length >= 5, 'Standard penetration list incomplete.');
assert(manifest.gates.some((gate) => gate.gateId === 'fm-rso-final-review' && gate.status === 'final-release-gate'), 'FM/RSO final gate missing.');
assert(manifest.gates.some((gate) => gate.gateId === 'citation-versioning' && gate.status === 'pending-before-signed-calc'), 'Citation gate missing.');

for (const filePath of [
  path.join(outDir, 'f346_parameterized_barrier_matrix.csv'),
  path.join(outDir, 'f346_gate_status.csv'),
  path.join(outDir, 'f346_standard_parameter_visual.svg'),
  path.join(outDir, 'f346_standard_parameter_visual.html'),
  path.join(root, 'outputs', 'fase_346_standard_parameter_draft.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F346 artifact: ${filePath}`);
}

assert(readText(path.join(outDir, 'f346_standard_parameter_visual.svg')).includes('F346'), 'F346 visual SVG missing title.');
assert(readText(path.join(outDir, 'f346_standard_parameter_visual.html')).includes('parametros estandar'), 'F346 visual HTML missing title.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f346:standard-parameter-draft'], 'Missing F346 prepare script.');
assert(packageJson.scripts['test:f346:standard-parameter-draft'], 'Missing F346 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F346'), `F346 missing from ${doc}.`);
}

console.log('F346 contracts OK: standard geometry/source/material/penetration draft is visual and blocked for signed use.');
