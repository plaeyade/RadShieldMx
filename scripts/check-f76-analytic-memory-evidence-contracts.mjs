import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
function check(name, pass, details = '') {
  checks.push({ name, pass: Boolean(pass), details });
}

const shared = read('src/lib/analyticMemoryEvidence.ts');
const wizard = read('src/sections/dialogs/MemoriaAIWizard.tsx');
const evidenceDialog = read('src/sections/dialogs/EvidencePackDialog.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const pkg = JSON.parse(read('package.json'));

check(
  'shared analytic-memory evidence utility exists',
  ['buildAnalyticMemorySnapshot', 'createFloorPlanEvidenceSources', 'buildAnalyticMemoryEvidenceSection'].every(token => shared.includes(token)),
  'Expected shared snapshot/evidence/section builders.'
);

check(
  'memoria wizard receives live canvas context',
  ['floorPlan?: FloorPlan', 'barrierResults?: CanvasBarrierResult[]', 'sampleLines?: CanvasSampleLine[]'].every(token => wizard.includes(token)),
  'Expected MemoriaAIWizard to accept floorPlan, barrierResults and sampleLines.'
);

check(
  'memoria wizard renders F76 snapshot',
  wizard.includes('data-testid="memoria-evidence-snapshot"') &&
    wizard.includes('Evidence Pack F76') &&
    wizard.includes('buildAnalyticMemoryEvidenceSection'),
  'Expected visible snapshot and generated evidence section.'
);

check(
  'evidence pack uses shared utility',
  evidenceDialog.includes("from '@/lib/analyticMemoryEvidence'") &&
    evidenceDialog.includes('buildAnalyticMemorySnapshot') &&
    evidenceDialog.includes('createFloorPlanEvidenceSources'),
  'Expected EvidencePackDialog to share the same evidence builders.'
);

check(
  'designer passes context to memoria dialogs',
  ['name="memoriaWizard"', 'name="memoriaAI"', 'floorPlan={floorPlan}', 'barrierResults={barrierResults}', 'sampleLines={sampleLines}']
    .every(token => designer.includes(token)),
  'Expected ShieldingDesigner to pass live calculation context into both memory dialogs.'
);

check(
  'package exposes F76 test',
  pkg.scripts?.['test:f76:memory-evidence'] === 'node scripts/check-f76-analytic-memory-evidence-contracts.mjs',
  'Expected npm script for F76 contracts.'
);

const passed = checks.filter(c => c.pass).length;
const outPath = path.join(root, 'outputs', 'f76_analytic_memory_evidence_contracts.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ passed, total: checks.length, checks }, null, 2));

if (passed !== checks.length) {
  console.error(`F76 analytic memory evidence contracts failed: ${passed}/${checks.length}`);
  for (const c of checks.filter(c => !c.pass)) console.error(`- ${c.name}: ${c.details}`);
  process.exit(1);
}

console.log(`F76 analytic memory evidence contracts passed: ${passed}/${checks.length}`);
