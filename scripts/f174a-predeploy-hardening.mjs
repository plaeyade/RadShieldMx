import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f174a_predeploy_hardening');
const jsonPath = path.join(outDir, 'f174a_predeploy_hardening.json');
const mdPath = path.join(root, 'outputs', 'fase_174a_predeploy_hardening.md');
mkdirSync(outDir, { recursive: true });

const read = (file) => readFileSync(path.join(root, file), 'utf8');
const shieldingMath = read('src/lib/shieldingMath.ts');
const lib = read('src/lib/f174aPredeployHardening.ts');
const updateDialog = read('src/sections/dialogs/UpdateAppDialog.tsx');
const f172 = JSON.parse(read('outputs/f172_release_candidate_final/f172_release_candidate_final.json'));
const f173 = JSON.parse(read('outputs/f173_canvas_low_risk_polish/f173_canvas_low_risk_polish.json'));
const f170 = JSON.parse(read('outputs/f170_rag_citation_governance/f170_rag_citation_governance.json'));

const guardrailIds = [
  'finite-input-guards',
  'bounded-transmission',
  'predeploy-update-center',
  'rag-source-policy',
  'no-db-migration',
];

const gates = {
  f172ControlledReady: ['controlled-offline-ready', 'public-deploy-ready'].includes(f172.status),
  f173CanvasReady: f173.status === 'canvas-low-risk-polish-ready',
  f170RagReady: ['rag-citation-governance-ready', 'rag-citation-governance-review'].includes(f170.status),
  calculationGuardsPresent: [
    'isFinitePositive',
    'clampTransmission',
    'getCalculationInputWarnings',
  ].every((token) => shieldingMath.includes(token)),
  ragPolicyPresent: [
    'classifyF174RagSource',
    'getF174RagCitationWarning',
    'buildF174APredeployHardening',
  ].every((token) => lib.includes(token)),
  frontendVisible: updateDialog.includes('F174A Predeploy hardening'),
  noDbMigration: !lib.includes('drizzle') && !lib.includes('DATABASE_URL') && !lib.includes('migrate'),
};

const status = Object.values(gates).every(Boolean) ? 'predeploy-hardening-ready' : 'predeploy-hardening-gated';
const output = {
  phase: 'F174A',
  title: 'Predeploy low-risk hardening',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.predeploy-hardening.f174a.v1',
  status,
  gates,
  guardrailIds,
  scope: {
    calculation: [
      'Finite positive input warnings for release-critical numeric inputs.',
      'Forward transmission outputs bounded to the physical 0..1 interval.',
      'No material constants, regulatory limits or validated formulas changed.',
    ],
    frontend: [
      'Update Center exposes the F174A hardening state before deploy.',
      'No layout migration, menu relocation or DB-dependent UI added.',
    ],
    rag: [
      'Sources classified as canonical, research, material-evidence, analytic-memory or external.',
      'Citation warnings prevent research/vendor/prior-memory sources from silently acting as canonical formulas.',
    ],
  },
  nextPhases: [
    'Run build and focused tests.',
    'Retry deploy target once Git/hosting metadata is available.',
    'Repeat F154-F158 against final URL after publication.',
  ],
};

writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
writeFileSync(mdPath, [
  '# F174A - Predeploy Low-Risk Hardening',
  '',
  `Generado: ${output.generatedAt}`,
  `Estado: **${output.status}**`,
  '',
  '## Gates',
  '',
  ...Object.entries(gates).map(([key, value]) => `- ${key}: ${value ? 'OK' : 'FAIL'}`),
  '',
  '## Calculo',
  '',
  ...output.scope.calculation.map((item) => `- ${item}`),
  '',
  '## Frontend',
  '',
  ...output.scope.frontend.map((item) => `- ${item}`),
  '',
  '## RAG',
  '',
  ...output.scope.rag.map((item) => `- ${item}`),
  '',
].join('\n'), 'utf8');

console.log(`F174A predeploy hardening ${status}.`);
if (status !== 'predeploy-hardening-ready') process.exit(1);
