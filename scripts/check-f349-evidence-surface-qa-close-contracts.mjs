import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f349_evidence_surface_qa_close');
const manifestPath = path.join(outDir, 'f349_evidence_surface_qa_close.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f349:evidence-surface-qa-close before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f349.evidence-surface-qa-close.v1', 'Unexpected F349 schema.');
assert(manifest.status === 'evidence-surface-qa-ready', 'F349 QA must be ready.');
assert(manifest.signedCalculationProduced === false, 'F349 must stay unsigned.');
assert(manifest.qaSummary?.fail === 0, 'F349 must have zero failed checks.');
assert(manifest.qaSummary?.pass === manifest.qaSummary?.total, 'F349 all checks must pass.');
assert(Array.isArray(manifest.qaChecks) && manifest.qaChecks.length >= 9, 'F349 QA checks incomplete.');

for (const filePath of [
  path.join(outDir, 'f349_qa_checks.csv'),
  path.join(outDir, 'f349_evidence_surface_qa.svg'),
  path.join(root, 'outputs', 'fase_349_evidence_surface_qa_close.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F349 artifact: ${filePath}`);
}

assert(readText(path.join(outDir, 'f349_evidence_surface_qa.svg')).includes('F349'), 'F349 visual SVG missing title.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f349:evidence-surface-qa-close'], 'Missing F349 prepare script.');
assert(packageJson.scripts['test:f349:evidence-surface-qa-close'], 'Missing F349 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F349'), `F349 missing from ${doc}.`);
}

console.log('F349 contracts OK: evidence surface QA close is ready.');
