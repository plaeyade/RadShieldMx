import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f344_centro_neuro_public_occupancy_markup');
const manifestPath = path.join(outDir, 'f344_centro_neuro_public_occupancy_markup.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f344:centro-neuro-public-occupancy-markup before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f344.centro-neuro-public-occupancy-markup.v1', 'Unexpected F344 schema.');
assert(manifest.status === 'centro-neuro-markup-ready-signed-calculation-blocked', 'F344 must be markup-ready but signed-calculation blocked.');
assert(manifest.scalePolicy?.ratioLabel === '1:100', 'F344 must preserve user scale 1:100.');
assert(manifest.scalePolicy?.status === 'user-confirmed-for-draft-and-markup', 'F344 scale must be confirmed for draft markup.');
assert(manifest.publicOccupancyPolicy?.adjacencyClass === 'publico en general', 'F344 must apply publico en general adjacency.');
assert(manifest.publicOccupancyPolicy?.defaultOccupancyFactorT === 1, 'F344 public occupancy draft T must be 1.');
assert(manifest.fmReviewPolicy?.blocksMarkup === false, 'FM review must not block markup.');
assert(manifest.fmReviewPolicy?.blocksSignedCalculation === true, 'FM review must still block signed calculation.');
assert(manifest.signedCalculationProduced === false, 'F344 must not emit signed calculations.');
assert(Array.isArray(manifest.rooms) && manifest.rooms.length === 4, 'F344 must include four rooms/work areas.');
assert(manifest.rooms.some((room) => room.label.includes('Versa HD')), 'Versa HD room missing.');
assert(manifest.rooms.some((room) => room.label.includes('Gamma Knife')), 'Gamma Knife room missing.');
assert(manifest.rooms.some((room) => room.label.includes('KIUBE')), 'KIUBE room missing.');
assert(Array.isArray(manifest.canvasMarkupLayers) && manifest.canvasMarkupLayers.length >= 7, 'F344 canvas layers incomplete.');
assert(Array.isArray(manifest.barrierDrafts) && manifest.barrierDrafts.length === manifest.rooms.length * 6, 'F344 must create six barrier drafts per room.');
assert(manifest.barrierDrafts.every((barrier) => barrier.adjacencyClass === 'publico en general'), 'Every barrier must default to publico en general.');
assert(manifest.calculationGates.some((gate) => gate.id === 'fm-review-final-not-markup-blocker' && gate.status === 'pass'), 'FM final review gate missing.');
assert(manifest.calculationGates.some((gate) => gate.id === 'source-terms-still-required' && gate.status === 'pending-before-signed-calc'), 'Source term pending gate missing.');

for (const filePath of [
  path.join(outDir, 'f344_canvas_layers.csv'),
  path.join(outDir, 'f344_barrier_public_adjacencies.csv'),
  path.join(root, 'outputs', 'fase_344_centro_neuro_public_occupancy_markup.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F344 artifact: ${filePath}`);
}

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f344:centro-neuro-public-occupancy-markup'], 'Missing F344 prepare script.');
assert(packageJson.scripts['test:f344:centro-neuro-public-occupancy-markup'], 'Missing F344 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F344'), `F344 missing from ${doc}.`);
}

console.log('F344 contracts OK: scale 1:100, public adjacency markup and final FM gate are documented.');
