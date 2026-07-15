import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
function check(name, pass, details = '') {
  checks.push({ name, pass: Boolean(pass), details });
}

const dialog = read('src/sections/dialogs/EvidencePackDialog.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const memoryEvidence = read('src/lib/analyticMemoryEvidence.ts');
const pkg = JSON.parse(read('package.json'));

check(
  'evidence pack receives live floorplan context',
  ['floorPlan?: FloorPlan', 'barrierResults?: CanvasBarrierResult[]', 'sampleLines?: CanvasSampleLine[]'].every(token => dialog.includes(token)),
  'Expected EvidencePackDialog props for floorPlan, results and sample lines.'
);

check(
  'evidence pack generates F75 sources',
  dialog.includes('createFloorPlanEvidenceSources') &&
    ['ev-f75-floorplan', 'ev-f75-calculation-results', 'ev-f75-standard-routing', 'createFloorPlanEvidenceSources'].every(token => memoryEvidence.includes(token)),
  'Expected generated evidence sources for layout, calculation and standards routing.'
);

check(
  'calculation snapshot is visible',
  dialog.includes('data-testid="evidence-pack-calculation-snapshot"') &&
    ['Barreras:', 'Fuentes:', 'Resultados:', 'Lineas 0.3m:', 'Max espesor:'].every(token => dialog.includes(token)),
  'Expected sidebar snapshot for calculation review.'
);

check(
  'designer passes calculation context',
  designer.includes('component={EvidencePackDialog}') &&
    designer.includes('floorPlan={floorPlan}') &&
    designer.includes('barrierResults={barrierResults}') &&
    designer.includes('sampleLines={sampleLines}'),
  'Expected ShieldingDesigner to pass live context into EvidencePackDialog.'
);

check(
  'package exposes F75 tests',
  pkg.scripts?.['test:f75:evidence'] === 'node scripts/check-f75-smart-room-evidence-contracts.mjs' &&
    pkg.scripts?.['test:f75:smoke'] === 'node scripts/check-f75-smart-room-evidence-smoke.mjs',
  'Expected npm scripts for F75 contract and smoke.'
);

const passed = checks.filter(c => c.pass).length;
const outPath = path.join(root, 'outputs', 'f75_smart_room_evidence_contracts.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ passed, total: checks.length, checks }, null, 2));

if (passed !== checks.length) {
  console.error(`F75 smart-room evidence contracts failed: ${passed}/${checks.length}`);
  for (const c of checks.filter(c => !c.pass)) console.error(`- ${c.name}: ${c.details}`);
  process.exit(1);
}

console.log(`F75 smart-room evidence contracts passed: ${passed}/${checks.length}`);
