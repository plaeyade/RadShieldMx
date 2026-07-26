import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f347_memoria_evidence_blocks');
const manifestPath = path.join(outDir, 'f347_memoria_evidence_blocks.json');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function readText(filePath) {
  return fs.readFileSync(filePath, 'utf8');
}

if (!fs.existsSync(manifestPath)) {
  throw new Error('Run npm run prepare:f347:memoria-evidence-blocks before checking contracts.');
}

const manifest = JSON.parse(readText(manifestPath));
assert(manifest.schema === 'radshield-mx.f347.memoria-evidence-blocks.v1', 'Unexpected F347 schema.');
assert(manifest.status === 'memoria-evidence-blocks-ready-preliminary', 'F347 must be preliminary.');
assert(manifest.signedCalculationProduced === false, 'F347 must not produce signed calculations.');
assert(Array.isArray(manifest.evidenceBlocks) && manifest.evidenceBlocks.length === 4, 'F347 requires four evidence blocks.');
assert(manifest.evidenceBlocks.every((block) => block.status === 'memoria-evidence-draft-ready-not-signed'), 'Every evidence block must be draft/not signed.');
assert(manifest.evidenceBlocks.every((block) => block.formulaTraceDraft?.noThicknessOutput === true), 'Every block must declare no thickness output.');
assert(manifest.evidenceBlocks.some((block) => block.equipmentLabel.includes('Versa HD')), 'Versa HD evidence block missing.');
assert(manifest.evidenceBlocks.some((block) => block.equipmentLabel.includes('Gamma Knife')), 'Gamma Knife evidence block missing.');
assert(manifest.evidenceBlocks.some((block) => block.equipmentLabel.includes('KIUBE')), 'KIUBE evidence block missing.');
assert(manifest.evidenceBlocks.some((block) => block.modalityProfile === 'NM'), 'NM/hot lab evidence block missing.');
assert(Array.isArray(manifest.memoriaIaChecklist) && manifest.memoriaIaChecklist.length >= 7, 'Memoria IA checklist incomplete.');
assert(manifest.reportHandoff?.memoriaIaReady === true, 'Memoria IA handoff missing.');
assert(manifest.reportHandoff?.signedCalculationProduced === false, 'Report handoff must stay unsigned.');

for (const filePath of [
  path.join(outDir, 'f347_memoria_blocks.csv'),
  path.join(outDir, 'f347_memoria_checklist.csv'),
  path.join(outDir, 'f347_memoria_evidence_visual.svg'),
  path.join(outDir, 'f347_memoria_evidence_visual.html'),
  path.join(root, 'outputs', 'fase_347_memoria_evidence_blocks.md'),
]) {
  assert(fs.existsSync(filePath), `Missing F347 artifact: ${filePath}`);
}

assert(readText(path.join(outDir, 'f347_memoria_evidence_visual.svg')).includes('F347'), 'F347 visual SVG missing title.');
assert(readText(path.join(outDir, 'f347_memoria_evidence_visual.html')).includes('Memoria IA'), 'F347 visual HTML missing Memoria IA text.');

const packageJson = JSON.parse(readText(path.join(root, 'package.json')));
assert(packageJson.scripts['prepare:f347:memoria-evidence-blocks'], 'Missing F347 prepare script.');
assert(packageJson.scripts['test:f347:memoria-evidence-blocks'], 'Missing F347 test script.');

for (const doc of ['CHANGELOG.md', 'MANUAL_VERSIONES_v50.md', 'MANUAL_USUARIO_v99.md', 'src/sections/dialogs/UpdateAppDialog.tsx']) {
  assert(readText(path.join(root, doc)).includes('F347'), `F347 missing from ${doc}.`);
}

console.log('F347 contracts OK: Memoria IA evidence blocks are ready and unsigned.');
