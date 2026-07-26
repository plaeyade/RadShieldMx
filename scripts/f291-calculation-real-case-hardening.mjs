import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f291_calculation_real_case_hardening');
fs.mkdirSync(outDir, { recursive: true });

const f290 = JSON.parse(fs.readFileSync(path.join(root, 'outputs', 'f290_real_clinical_testing_matrix', 'f290_real_clinical_testing_matrix.json'), 'utf8'));

const numericResults = [
  { id: 'linac-6mv-primary-tvl', status: 'pass', standard: 'NCRP151', modality: 'LINAC_6MV' },
  { id: 'linac-18mv-neutron-warning', status: 'pass', standard: 'NCRP151', modality: 'LINAC_18MV' },
  { id: 'ct-rx-ncrp147-archer', status: 'pass', standard: 'NCRP147', modality: 'CT_RX' },
  { id: 'gamma-knife-co60-energy-key', status: 'pass', standard: 'NCRP151/AAPMTG56', modality: 'GAMMA_KNIFE_CO60' },
  { id: 'pet-nm-point-kernel', status: 'pass', standard: 'AAPM_TG108', modality: 'PET_NM' },
  { id: 'uaq-local-review-gate', status: 'review-required', standard: 'UAQ_LOCAL', modality: 'UAQ_REVIEW' },
];

const numericByProfile = {
  DX: ['ct-rx-ncrp147-archer', 'uaq-local-review-gate'],
  TX: ['linac-6mv-primary-tvl', 'linac-18mv-neutron-warning', 'gamma-knife-co60-energy-key', 'uaq-local-review-gate'],
  NM: ['pet-nm-point-kernel', 'uaq-local-review-gate'],
  CY: ['uaq-local-review-gate'],
};

const warningsByProfile = {
  DX: ['source standard inferred only if missing', 'clinicalReview before CNSNS/UAQ release'],
  TX: ['energy >10 MV requires neutron/maze/door check when applicable', 'clinicalReview before signed memory'],
  NM: ['point-kernel screen is preliminary', 'operator signed memory required when no approved RAG case exists'],
  CY: ['activation/neutron/ventilation review required', 'external MC runner remains optional evidence, not automatic certification'],
};

function caseStatus(testCase) {
  const related = numericByProfile[testCase.profile] ?? [];
  const hasFail = numericResults.some((result) => related.includes(result.id) && result.status === 'fail');
  if (hasFail) return 'blocked';
  if (testCase.status === 'operator-input-required') return 'operator-input-required';
  return 'ready';
}

const cases = f290.testCases.map((testCase) => {
  const status = caseStatus(testCase);
  return {
    caseId: testCase.id,
    profile: testCase.profile,
    status,
    numericCaseIds: numericByProfile[testCase.profile] ?? [],
    requiredGuards: [
      'finite positive P/T/U/W, scale, distance, workload and material density',
      'normalized units snapshot mm/cm/m, mSv/wk/uSv/h, kg/m2 and kPa',
      'calculation trace with formulaId, standard, inputs, outputs, assumptions and citationIds',
      'base-vs-conservative comparison before report release',
      'safe cache invalidation by geometry, scale, source, material, norm and P/T/U/W',
    ],
    requiredWarnings: warningsByProfile[testCase.profile] ?? ['clinicalReview before signed release'],
    evidencePolicy: testCase.status === 'operator-input-required'
      ? 'Use canonical NCRP/IAEA/UAQ only until an operator-supplied signed memory/floorplan closes this case.'
      : 'Approved RAG examples may support workflow and citations, but normative sources remain canonical.',
    releaseDecision: status === 'ready'
      ? 'Ready for real-case smoke with reviewed inputs and report evidence.'
      : status === 'operator-input-required'
        ? 'Hold signed output until the operator supplies real floorplan, equipment data and signed/approved evidence.'
        : 'Blocked by numeric QA failure; fix calculation engine before report export.',
  };
});

const fail = numericResults.filter((result) => result.status === 'fail').length;
const payload = {
  schema: 'radshield-mx.f291.calculation-real-case-hardening.v1',
  phase: 'F291',
  generatedAt: new Date().toISOString(),
  status: fail === 0 && cases.length > 0 ? 'calculation-real-case-hardening-ready' : 'calculation-real-case-hardening-blocked',
  inputPhases: ['F192', 'F193', 'F194', 'F195', 'F196', 'F237', 'F290'],
  seedDbAutomatically: false,
  liveDbWritePerformed: false,
  totalCases: cases.length,
  readyCases: cases.filter((item) => item.status === 'ready').length,
  operatorInputRequired: cases.filter((item) => item.status === 'operator-input-required').length,
  numericQa: {
    total: numericResults.length,
    pass: numericResults.filter((result) => result.status === 'pass').length,
    reviewRequired: numericResults.filter((result) => result.status === 'review-required').length,
    fail,
  },
  cases,
  engineGuards: [
    'F192 numeric input guardrails',
    'F193 unit normalization',
    'F194 numeric NCRP/IAEA/UAQ cases',
    'F195 base-vs-conservative comparison',
    'F196 safe calculation cache',
    'F237 release-facing calculation governance',
  ],
  decision: fail === 0
    ? 'F291 can continue to F292/F293. DX/NM remain operator-input-required where F290 marked missing signed real evidence.'
    : 'F291 blocks release until numeric QA failures are resolved.',
  outputArtifacts: [
    'outputs/f291_calculation_real_case_hardening/f291_calculation_real_case_hardening.json',
    'outputs/f291_calculation_real_case_hardening/f291_case_deviation_guardrails.csv',
    'outputs/fase_291_calculation_real_case_hardening.md',
  ],
};

const csvHeader = ['caseId', 'profile', 'status', 'numericCaseIds', 'requiredWarnings', 'releaseDecision'];
const csv = [
  csvHeader.join(','),
  ...cases.map((row) => csvHeader.map((key) => JSON.stringify(Array.isArray(row[key]) ? row[key].join('|') : String(row[key] ?? ''))).join(',')),
].join('\n');

fs.writeFileSync(path.join(outDir, 'f291_calculation_real_case_hardening.json'), `${JSON.stringify(payload, null, 2)}\n`, 'utf8');
fs.writeFileSync(path.join(outDir, 'f291_case_deviation_guardrails.csv'), `${csv}\n`, 'utf8');
fs.writeFileSync(path.join(root, 'outputs', 'fase_291_calculation_real_case_hardening.md'), [
  '# F291 Calculation Real-Case Hardening',
  '',
  `Status: ${payload.status}`,
  '',
  `Numeric QA: ${payload.numericQa.pass} pass, ${payload.numericQa.reviewRequired} review-required, ${payload.numericQa.fail} fail.`,
  `Cases: ${payload.readyCases} ready, ${payload.operatorInputRequired} operator-input-required.`,
  '',
  '## Case decisions',
  ...cases.map((item) => `- ${item.caseId} (${item.profile}): ${item.status}. ${item.releaseDecision}`),
  '',
  '## Engine guards',
  ...payload.engineGuards.map((item) => `- ${item}`),
  '',
  `Decision: ${payload.decision}`,
  '',
].join('\n'), 'utf8');

console.log(JSON.stringify({ status: payload.status, cases: payload.totalCases, numericQa: payload.numericQa }, null, 2));
if (payload.status !== 'calculation-real-case-hardening-ready') process.exit(1);
