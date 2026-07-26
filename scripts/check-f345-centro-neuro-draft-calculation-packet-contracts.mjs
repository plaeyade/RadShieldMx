import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f345_centro_neuro_draft_calculation_packet');
const manifestPath = path.join(outDir, 'f345_centro_neuro_draft_calculation_packet.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f345:centro-neuro-draft-calculation-packet before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f345.centro-neuro-draft-calculation-packet.v1', 'Unexpected F345 schema.');
assert(manifest.status === 'draft-calculation-packet-ready-thickness-blocked', 'F345 must be draft-ready and thickness-blocked.');
assert(manifest.signedCalculationProduced === false, 'F345 must not produce signed calculations.');
assert(Array.isArray(manifest.barrierCalculationRows) && manifest.barrierCalculationRows.length === 24, 'F345 requires 24 draft barrier rows.');
assert(manifest.barrierCalculationRows.every((row) => row.adjacencyClass === 'publico en general'), 'All F345 rows must use public adjacency.');
assert(manifest.barrierCalculationRows.every((row) => row.occupancyFactorT === 1), 'All F345 rows must use T=1.');
assert(manifest.barrierCalculationRows.every((row) => row.outputStatus === 'draft-input-row-ready-thickness-blocked'), 'All F345 rows must be thickness-blocked.');
assert(manifest.barrierCalculationRows.some((row) => row.methodId.includes('ncrp151')), 'LINAC NCRP 151 method missing.');
assert(manifest.barrierCalculationRows.some((row) => row.methodId.includes('cobalt60')), 'Gamma Knife Co-60 method missing.');
assert(manifest.barrierCalculationRows.some((row) => row.methodId.includes('cyclotron18mev')), 'Cyclotron 18 MeV method missing.');
assert(manifest.calculationGateStatus.some((gate) => gate.gateId === 'scale-1-100' && gate.status === 'pass-for-draft'), 'Scale draft gate missing.');
assert(manifest.calculationGateStatus.some((gate) => gate.gateId === 'source-term' && gate.status === 'pending-before-thickness'), 'Source-term thickness gate missing.');
assert(manifest.calculationGateStatus.some((gate) => gate.gateId === 'fm-rso-final-review' && gate.status === 'final-release-gate'), 'FM/RSO final gate missing.');

for (const filePath of [
  path.join(outDir, 'f345_barrier_draft_calculation_matrix.csv'),
  path.join(outDir, 'f345_calculation_gate_status.csv'),
  path.join(outDir, 'f345_visual_progress.svg'),
  path.join(outDir, 'f345_visual_progress.html'),
  path.join(root, 'outputs', 'fase_345_centro_neuro_draft_calculation_packet.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F345 artifact: ${filePath}`);
}

assert(readText(path.join(outDir, 'f345_visual_progress.svg')).includes('F345 Centro Neuro'), 'F345 visual SVG missing title.');
assert(readText(path.join(outDir, 'f345_visual_progress.html')).includes('avance visual'), 'F345 visual HTML missing visible progress text.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f345:centro-neuro-draft-calculation-packet'], 'Missing F345 prepare script.');
assert(packageJson.scripts['test:f345:centro-neuro-draft-calculation-packet'], 'Missing F345 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F345'), `F345 missing from ${doc}.`);
}

console.log('F345 contracts OK: draft calculation matrix and visual progress artifacts are complete.');
