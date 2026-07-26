import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const f289Path = path.join(root, 'outputs', 'f289_memoria_ia_rag_handoff', 'f289_memoria_ia_rag_handoff.json');
const f267Path = path.join(root, 'outputs', 'f267_real_case_smoke_execution', 'f267_real_case_smoke_execution.json');
const outputDir = path.join(root, 'outputs', 'f290_real_clinical_testing_matrix');
fs.mkdirSync(outputDir, { recursive: true });

const f289 = JSON.parse(fs.readFileSync(f289Path, 'utf8'));
const f267 = fs.existsSync(f267Path) ? JSON.parse(fs.readFileSync(f267Path, 'utf8')) : null;

const testCases = [
  { id: 'DX-CT-ROOM-001', profile: 'DX', source: 'signed-memory-required', floorplan: 'required', equipment: 'CT/RX', expected: 'NCRP147/UAQ compare', status: 'operator-input-required' },
  { id: 'TX-LINAC-6MV-001', profile: 'TX', source: 'Versa HD memory/example', floorplan: 'required', equipment: 'LINAC', expected: 'NCRP151 primary/secondary', status: 'ready-with-approved-rag-examples' },
  { id: 'TX-GK-CO60-001', profile: 'TX', source: 'Gamma Knife memory/example', floorplan: 'required', equipment: 'Gamma Knife', expected: 'Co-60 workload/checklist', status: 'ready-with-approved-rag-examples' },
  { id: 'TX-BRAQUI-CO60-001', profile: 'TX', source: 'Braqui Co-60 memory/example', floorplan: 'required', equipment: 'HDR Co-60', expected: 'source strength/occupancy check', status: 'ready-with-approved-rag-examples' },
  { id: 'NM-PET-F18-001', profile: 'NM', source: 'signed-memory-required', floorplan: 'required', equipment: 'PET/CT uptake', expected: 'TG108/IAEA compare', status: 'operator-input-required' },
  { id: 'CY-KIUBE-001', profile: 'CY', source: 'Cyclotron/KIUBE memory/example', floorplan: 'required', equipment: 'Cyclotron', expected: 'neutron/activation/ventilation checklist', status: 'ready-with-approved-rag-examples' },
];

const csvHeader = ['id', 'profile', 'source', 'floorplan', 'equipment', 'expected', 'status'];
const csv = [
  csvHeader.join(','),
  ...testCases.map((row) => csvHeader.map((key) => JSON.stringify(String(row[key] ?? ''))).join(',')),
].join('\n');

const gates = {
  f289Ready: f289.status === 'memoria-ia-rag-handoff-ready',
  realSmokeBaselineAvailable: Boolean(f267?.status),
  allProfilesCovered: ['DX', 'TX', 'NM', 'CY'].every((profile) => testCases.some((item) => item.profile === profile)),
  signedMemoryRequiredFlagged: testCases.some((item) => item.status === 'operator-input-required'),
  noClinicalReleaseClaim: true,
};

const manifest = {
  phase: 'F290',
  schema: 'radshield-mx.real-clinical-testing-matrix.f290.v1',
  generatedAt: new Date().toISOString(),
  status: Object.values(gates).every(Boolean) ? 'real-clinical-testing-matrix-ready' : 'real-clinical-testing-matrix-gated',
  inputPhases: ['F267', 'F289'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  gates,
  testCases,
  acceptanceCriteria: [
    'Each case must have a real floorplan or confirmed template with scale.',
    'Each calculation must show formula, standard, inputs, outputs, assumptions and warnings.',
    'Each report must include citationId/pageRef/sourceHash/chunkHash for RAG evidence.',
    'Any DX/NM case without approved RAG evidence must use canonical sources and operator-supplied signed memory.',
    'No clinical signed release until blocker/major deviations are closed by qualified review.',
  ],
  nextRecommendedPhases: [
    'F291 calculation engine hardening against real-case deviations.',
    'F292 canvas/floorplan QA for real project entry.',
    'F293 release package refresh after real-case smoke.',
  ],
  outputArtifacts: [
    'outputs/f290_real_clinical_testing_matrix/f290_real_clinical_testing_matrix.json',
    'outputs/f290_real_clinical_testing_matrix/f290_real_case_matrix.csv',
    'outputs/fase_290_real_clinical_testing_matrix.md',
  ],
};

fs.writeFileSync(path.join(outputDir, 'f290_real_clinical_testing_matrix.json'), `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outputDir, 'f290_real_case_matrix.csv'), `${csv}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_290_real_clinical_testing_matrix.md'), [
  '# F290 Real Clinical Testing Matrix',
  '',
  `Status: ${manifest.status}`,
  '',
  '## Cases',
  ...testCases.map((item) => `- ${item.id} (${item.profile}): ${item.status}`),
  '',
  '## Acceptance criteria',
  ...manifest.acceptanceCriteria.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({
  status: manifest.status,
  cases: testCases.length,
  profiles: [...new Set(testCases.map((item) => item.profile))],
}, null, 2));

if (manifest.status !== 'real-clinical-testing-matrix-ready') process.exit(1);
