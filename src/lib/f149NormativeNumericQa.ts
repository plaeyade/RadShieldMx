import { CASES, runValidation, summarize } from './validation/NCRPValidationSuite';
import { NCRP151_TVL_CM, TG108_GAMMA_CONSTANTS } from './validationEngine';
import {
  calculateGammaKnifeBarrier,
  calculateHDRBrachyBarrier,
  calculateLINACPrimaryBarrier,
  calculatePETCTBarrier,
} from './uaqProtocol';

export type F149NormativeFamily = 'NCRP147' | 'NCRP151' | 'AAPM_TG108' | 'IAEA_SRS47' | 'UAQ_PROTOCOL';
export type F149CaseStatus = 'pass' | 'review' | 'fail';
export type F149EvidenceStrength = 'canonical-reference' | 'engine-cross-check' | 'protocol-internal';

export interface F149NumericQaCase {
  id: string;
  family: F149NormativeFamily;
  label: string;
  source: string;
  formula: string;
  expected: number;
  actual: number;
  unit: string;
  tolerancePercent: number;
  differencePercent: number;
  status: F149CaseStatus;
  evidenceStrength: F149EvidenceStrength;
  releaseBlocking: boolean;
  notes: string;
}

export interface F149NormativeNumericQaSummary {
  phase: 'F149';
  status: 'implemented';
  canonicalSuite: {
    total: number;
    passed: number;
    failed: number;
    maxDiffPercent: number;
    avgDiffPercent: number;
  };
  cases: F149NumericQaCase[];
  totals: {
    total: number;
    passed: number;
    review: number;
    failed: number;
    releaseBlocking: number;
    canonicalReference: number;
    engineCrossCheck: number;
    protocolInternal: number;
  };
  familySummary: Record<F149NormativeFamily, { total: number; passed: number; review: number; failed: number }>;
  releaseReady: boolean;
  decision: string;
  nextPhase: string;
  exportRequirements: string[];
}

const percentDiff = (expected: number, actual: number): number => {
  if (!Number.isFinite(expected) || expected === 0) return actual === expected ? 0 : Infinity;
  return Math.abs((actual - expected) / expected) * 100;
};

const round = (value: number, digits = 4): number => {
  if (!Number.isFinite(value)) return value;
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

const buildCase = (input: Omit<F149NumericQaCase, 'differencePercent' | 'status' | 'releaseBlocking'>): F149NumericQaCase => {
  const differencePercent = percentDiff(input.expected, input.actual);
  const status: F149CaseStatus = differencePercent <= input.tolerancePercent
    ? 'pass'
    : input.evidenceStrength === 'protocol-internal'
      ? 'review'
      : 'fail';
  return {
    ...input,
    expected: round(input.expected, 6),
    actual: round(input.actual, 6),
    differencePercent: round(differencePercent, 4),
    status,
    releaseBlocking: status === 'fail',
  };
};

const expectedTvlThickness = (
  unshieldedKerma_mSv: number,
  designGoal_mSv: number,
  tvl_cm: number,
): number => {
  const transmission = designGoal_mSv / unshieldedKerma_mSv;
  return Math.max(0, Math.log10(1 / transmission) * tvl_cm);
};

const buildFamilies = (cases: F149NumericQaCase[]): F149NormativeNumericQaSummary['familySummary'] => {
  const families: F149NormativeFamily[] = ['NCRP147', 'NCRP151', 'AAPM_TG108', 'IAEA_SRS47', 'UAQ_PROTOCOL'];
  return families.reduce((acc, family) => {
    const rows = cases.filter((item) => item.family === family);
    acc[family] = {
      total: rows.length,
      passed: rows.filter((item) => item.status === 'pass').length,
      review: rows.filter((item) => item.status === 'review').length,
      failed: rows.filter((item) => item.status === 'fail').length,
    };
    return acc;
  }, {} as F149NormativeNumericQaSummary['familySummary']);
};

export function buildF149NormativeNumericQa(): F149NormativeNumericQaSummary {
  const suiteResults = runValidation(CASES);
  const suite = summarize(suiteResults);

  const linacInput = {
    energy_MeV: 6,
    W_Gy_per_wk: 500,
    technique: '3D-CRT',
    P_mSv_per_wk: 0.02,
    d_pri_m: 6,
    U: 0.25,
    T: 1,
    F_conv_fraction: 1,
    F_IMRT_fraction: 0,
    materialCode: 'concrete235',
  };
  const linac = calculateLINACPrimaryBarrier(linacInput);
  const linacB = (linacInput.P_mSv_per_wk * linacInput.d_pri_m ** 2) /
    (linacInput.W_Gy_per_wk * 1000 * linacInput.U * linacInput.T);
  const linacExpected = Math.log10(1 / linacB) * NCRP151_TVL_CM.concrete['6MV'];

  const petInput = {
    activity_MBQ_per_injection: 370,
    patients_per_week: 60,
    gamma_constant_uSv_m2_per_GBq_h: TG108_GAMMA_CONSTANTS['F-18'],
    hours_per_week: 1,
    d_m: 2,
    P_mSv_per_wk: 0.02,
    materialCode: 'concrete235',
  };
  const pet = calculatePETCTBarrier(
    petInput.activity_MBQ_per_injection,
    petInput.patients_per_week,
    petInput.gamma_constant_uSv_m2_per_GBq_h,
    petInput.hours_per_week,
    petInput.d_m,
    petInput.P_mSv_per_wk,
    petInput.materialCode,
  );
  const petUnshielded = (petInput.gamma_constant_uSv_m2_per_GBq_h * (petInput.activity_MBQ_per_injection / 1000) *
    petInput.patients_per_week * petInput.hours_per_week) / (petInput.d_m ** 2) / 1000;
  const petExpectedMm = expectedTvlThickness(petUnshielded, petInput.P_mSv_per_wk, NCRP151_TVL_CM.concrete['6MV']) * 10;

  const gammaKnife = calculateGammaKnifeBarrier(20, 12, 4, 0.02, 'concrete235');
  const gammaKnifeUnshielded = (12 * 20 * 1000) / (4 ** 2);
  const gammaKnifeExpectedMm = expectedTvlThickness(gammaKnifeUnshielded, 0.02, NCRP151_TVL_CM.concrete.Co60) * 10;

  const hdr = calculateHDRBrachyBarrier(10, 0.48, 4, 3, 0.02, 'concrete235');
  const hdrUnshielded = ((0.48 * 10 * 4) / (3 ** 2)) * 0.00876;
  const hdrExpectedMm = expectedTvlThickness(hdrUnshielded, 0.02, 11) * 10;

  const cases: F149NumericQaCase[] = [
    buildCase({
      id: 'F149-NCRP151-TVL-CONC-6MV',
      family: 'NCRP151',
      label: 'TVL concreto primario 6 MV',
      source: 'NCRP 151 Table B.1 / validationEngine.NCRP151_TVL_CM',
      formula: 'TVL lookup must match canonical value',
      expected: 37,
      actual: NCRP151_TVL_CM.concrete['6MV'],
      unit: 'cm',
      tolerancePercent: 0.01,
      evidenceStrength: 'canonical-reference',
      notes: 'Release blocker if the canonical TVL table changes without source governance.',
    }),
    buildCase({
      id: 'F149-NCRP151-TVL-PB-CO60',
      family: 'NCRP151',
      label: 'TVL plomo Co-60',
      source: 'NCRP 151 Table B.6 / validationEngine.NCRP151_TVL_CM',
      formula: 'TVL lookup must match canonical value',
      expected: 1.13,
      actual: NCRP151_TVL_CM.lead.Co60,
      unit: 'cm',
      tolerancePercent: 0.01,
      evidenceStrength: 'canonical-reference',
      notes: 'Used by Gamma Knife and Co-60 shielding profiles.',
    }),
    buildCase({
      id: 'F149-TG108-F18-GAMMA',
      family: 'AAPM_TG108',
      label: 'Constante gamma F-18',
      source: 'AAPM TG-108 / validationEngine.TG108_GAMMA_CONSTANTS',
      formula: 'Gamma constant lookup must match canonical PET value',
      expected: 0.143,
      actual: TG108_GAMMA_CONSTANTS['F-18'],
      unit: 'mSv*m2/GBq*h',
      tolerancePercent: 0.01,
      evidenceStrength: 'canonical-reference',
      notes: 'Required for PET/CT room and uptake-room analytic-memory profile.',
    }),
    buildCase({
      id: 'F149-NCRP151-LINAC-PRIMARY',
      family: 'NCRP151',
      label: 'LINAC 6 MV barrera primaria',
      source: 'NCRP 151 Eq. 4.1-4.3 / UAQ protocol adapter',
      formula: 'B=P*d^2/(W*1000*U*T); t=n*TVL; n=log10(1/B)',
      expected: linacExpected,
      actual: linac.thickness_cm,
      unit: 'cm',
      tolerancePercent: 0.1,
      evidenceStrength: 'engine-cross-check',
      notes: 'Cross-checks the implemented primary barrier path against an independent closed-form calculation.',
    }),
    buildCase({
      id: 'F149-TG108-PET-F18',
      family: 'AAPM_TG108',
      label: 'PET/CT F-18 blindaje simplificado',
      source: 'AAPM TG-108 / PET-CT calculation path',
      formula: 'K=Gamma*A*N*t/d^2; B=P/K; t=log10(1/B)*TVL',
      expected: petExpectedMm,
      actual: pet.thickness_mm,
      unit: 'mm',
      tolerancePercent: 0.1,
      evidenceStrength: 'engine-cross-check',
      notes: 'Uses the current concrete TVL proxy; final release should add PET 511 keV material-specific TVLs from source-governed documents.',
    }),
    buildCase({
      id: 'F149-UAQ-GAMMA-KNIFE-CO60',
      family: 'UAQ_PROTOCOL',
      label: 'Gamma Knife Co-60 barrera',
      source: 'UAQ protocol / NCRP 151 Co-60 TVL pathway',
      formula: 'K=D*f/d^2; B=P/K; t=log10(1/B)*TVL(Co-60)',
      expected: gammaKnifeExpectedMm,
      actual: gammaKnife.thickness_mm,
      unit: 'mm',
      tolerancePercent: 0.1,
      evidenceStrength: 'protocol-internal',
      notes: 'Protocol-consistency case. Requires project-specific source activity and vendor/site planning values before certification.',
    }),
    buildCase({
      id: 'F149-IAEA-HDR-CO60-IR192',
      family: 'IAEA_SRS47',
      label: 'HDR braquiterapia blindaje simplificado',
      source: 'IAEA SRS-47 / UAQ HDR approximation',
      formula: 'K=Gamma*A*t/d^2; B=P/K; t=log10(1/B)*TVL',
      expected: hdrExpectedMm,
      actual: hdr.thickness_mm,
      unit: 'mm',
      tolerancePercent: 0.1,
      evidenceStrength: 'engine-cross-check',
      notes: 'Checks HDR calculation plumbing. Final clinical memory must cite radionuclide-specific TVL and activity certificate.',
    }),
    buildCase({
      id: 'F149-NCRP147-SUITE',
      family: 'NCRP147',
      label: 'Suite NCRP 147/diagnostico existente',
      source: 'NCRPValidationSuite.CASES',
      formula: 'Reference suite pass ratio',
      expected: CASES.filter((item) => item.category === 'NCRP147').length,
      actual: suiteResults.filter((item) => item.caseId.startsWith('147-') && item.passed).length,
      unit: 'passed cases',
      tolerancePercent: 0.01,
      evidenceStrength: 'canonical-reference',
      notes: 'Aggregated diagnostic reference gate. Individual legacy cases remain in NCRPValidationSuite.',
    }),
  ];

  const totals = {
    total: cases.length,
    passed: cases.filter((item) => item.status === 'pass').length,
    review: cases.filter((item) => item.status === 'review').length,
    failed: cases.filter((item) => item.status === 'fail').length,
    releaseBlocking: cases.filter((item) => item.releaseBlocking).length,
    canonicalReference: cases.filter((item) => item.evidenceStrength === 'canonical-reference').length,
    engineCrossCheck: cases.filter((item) => item.evidenceStrength === 'engine-cross-check').length,
    protocolInternal: cases.filter((item) => item.evidenceStrength === 'protocol-internal').length,
  };
  const releaseReady = suite.allPassed && totals.releaseBlocking === 0 && totals.failed === 0;

  return {
    phase: 'F149',
    status: 'implemented',
    canonicalSuite: {
      total: suite.total,
      passed: suite.passed,
      failed: suite.failed,
      maxDiffPercent: round(suite.maxDiff, 4),
      avgDiffPercent: round(suite.avgDiff, 4),
    },
    cases,
    totals,
    familySummary: buildFamilies(cases),
    releaseReady,
    decision: releaseReady
      ? 'F149 numeric QA gate is implemented with no release-blocking failures. Protocol-internal cases still require professional review before final signature.'
      : 'F149 found release-blocking numeric mismatches. Do not start F150 until failed cases are resolved.',
    nextPhase: releaseReady ? 'F149b smoke Memoria IA/PDF/Evidence export, then F150 release candidate.' : 'Resolve failed numeric cases, rerun F149, then resume release path.',
    exportRequirements: [
      'Every exported analytic memory must include formula, standard, input, output, citation and QA status.',
      'Protocol-internal cases may support workflow QA but cannot replace a cited normative calculation.',
      'Any TVL or gamma constant change must update source governance and rerun F149.',
      'Failed canonical-reference or engine-cross-check cases block F150.',
    ],
  };
}

export function formatF149NormativeNumericQaText(summary = buildF149NormativeNumericQa()): string {
  const caseLines = summary.cases.map((item) => (
    `   - ${item.id}: ${item.status.toUpperCase()} | ${item.label} | expected ${item.expected} ${item.unit}, actual ${item.actual} ${item.unit}, diff ${item.differencePercent}% | ${item.source}`
  ));
  return [
    'F149 QA NUMERICO NORMATIVO',
    `   Suite canonical NCRP: ${summary.canonicalSuite.passed}/${summary.canonicalSuite.total} pass; max diff ${summary.canonicalSuite.maxDiffPercent}%.`,
    `   Casos F149: ${summary.totals.passed}/${summary.totals.total} pass; review ${summary.totals.review}; fail ${summary.totals.failed}; bloqueos release ${summary.totals.releaseBlocking}.`,
    `   Release ready: ${summary.releaseReady ? 'si' : 'no'}.`,
    ...caseLines,
    `   Decision: ${summary.decision}`,
  ].join('\n');
}
