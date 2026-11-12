import { CASES, runValidation, summarize } from './validation/NCRPValidationSuite';
import { NCRP151_TVL_CM, TG108_GAMMA_CONSTANTS } from './validationEngine';
// Fase 11, etapa 8: los casos LINAC, PET, Gamma Knife y HDR ejercen las funciones del motor validado que usa el
// diálogo «Layout de búnker» (zonaControladaMotor), no las fórmulas propias de uaqProtocol.
import { espesorGammaKnifeZona, espesorHDRZona, espesorLinacZona, espesorPETZona, GAMMA_IR192_uGy_m2_MBq_h, materialCatalogo } from './zonaControladaMotor';
import { dosisSemanalTG108 } from './tg108';

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

  // NCRP 151 §7.1.1: primaria 18 MV, W = 450 Gy/semana, U = 1/4, T = 1/40, d = 7.2 m, P = 0.02 mSv/semana → 149.6 cm.
  const linac = espesorLinacZona({
    tipo: 'primaria', haces: [{ energia_MV: 18, W_Gy_semana: 450 }], fraccionIMRT: 0,
    P_mSv_semana: 0.02, T: 0.025, U: 0.25, d_m: 7.2, materialCodigo: 'CONCRETE235',
  });
  const linacExpected = 149.6;

  // TG-108 sala de captación F-18: 370 MBq, 60 pacientes/semana, tU = 1 h, d = 2 m, P = 0.02, T = 1.
  const concreto = materialCatalogo('CONCRETE235');
  const petInput = { A0_MBq: 370, pacientesSemana: 60, tU_h: 1, d_m: 2, P_mSv_semana: 0.02, T: 1, materialCodigo: 'CONCRETE235' };
  const pet = espesorPETZona(petInput);
  const petUnshielded = dosisSemanalTG108({ nuclido: 'F18', A0_MBq: 370, pacientesSemana: 60, tU_h: 1, tI_h: 0, sala: 'captacion', d_m: 2 }) / 1000;
  // Inversa cerrada publicada en TG-108 con su Tabla V (concreto): x = ln{[B^−γ + β/α]/[1 + β/α]}/(αγ) cm; el motor
  // invierte B(x) numéricamente.
  const petB = petInput.P_mSv_semana / (petInput.T * petUnshielded);
  const petR = -0.1161 / 0.1539;
  const petExpectedMm = (10 * Math.log((petB ** -2.0752 + petR) / (1 + petR))) / (0.1539 * 2.0752);

  const gammaKnife = espesorGammaKnifeZona({ fraccionesSemana: 20, dosisFraccion_Gy: 12, d_m: 4, P_mSv_semana: 0.02, T: 1, materialCodigo: 'CONCRETE235' });
  const gammaKnifeUnshielded = (12 * 20 * 1000) / (4 ** 2);
  const gammaKnifeExpectedMm = expectedTvlThickness(gammaKnifeUnshielded, 0.02, concreto.TVL_mm!.Co60 / 10) * 10;

  const hdr = espesorHDRZona({ actividad_Ci: 10, horasSemana: 4, d_m: 3, P_mSv_semana: 0.02, T: 1, materialCodigo: 'CONCRETE235' });
  const hdrUnshielded = (GAMMA_IR192_uGy_m2_MBq_h * 10 * 3.7e4 * 4) / (3 ** 2) / 1000;
  const hdrExpectedMm = expectedTvlThickness(hdrUnshielded, 0.02, concreto.TVL_mm!.Ir192 / 10) * 10;

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
      label: 'LINAC 18 MV barrera primaria (NCRP 151 §7.1.1)',
      source: 'NCRP 151 §7.1.1 / barreraMV (motor validado, Layout de búnker)',
      formula: 'B=P*d^2/(W*U*T); t=TVL1+(n-1)*TVLe; n=log10(1/B)',
      expected: linacExpected,
      actual: Math.round(linac.espesor_mm) / 10,
      unit: 'cm',
      tolerancePercent: 1.5,
      evidenceStrength: 'canonical-reference',
      notes: 'Published NCRP 151 worked example (149.6 cm concrete); same functions as motorProyecto.',
    }),
    buildCase({
      id: 'F149-TG108-PET-F18',
      family: 'AAPM_TG108',
      label: 'PET/CT F-18 sala de captacion',
      source: 'AAPM TG-108 Ec. 2-3 y Tabla V / dosisSemanalTG108 + curva de banda ancha 511 keV (motor validado)',
      formula: 'K=0.64*Gamma*A0*N*tU*Rt/d^2; B=P/(T*K); x=ln{[B^-g+b/a]/[1+b/a]}/(a*g) (TG-108 Tabla V)',
      expected: petExpectedMm,
      actual: pet.espesor_mm,
      unit: 'mm',
      tolerancePercent: 0.1,
      evidenceStrength: 'engine-cross-check',
      notes: 'Before Fase 11 etapa 8 this path used the 6 MV concrete TVL (37 cm) for 511 keV; now the TG-108 broad-beam curve (Table V).',
    }),
    buildCase({
      id: 'F149-UAQ-GAMMA-KNIFE-CO60',
      family: 'UAQ_PROTOCOL',
      label: 'Gamma Knife Co-60 barrera',
      source: 'NCRP 151 Co-60 TVL / tvlThickness (motor validado)',
      formula: 'K=D*f/d^2; B=P/(T*K); t=log10(1/B)*TVL(Co-60)',
      expected: gammaKnifeExpectedMm,
      actual: gammaKnife.espesor_mm,
      unit: 'mm',
      tolerancePercent: 0.1,
      evidenceStrength: 'protocol-internal',
      notes: 'Protocol-consistency case. Requires project-specific source activity and vendor/site planning values before certification.',
    }),
    buildCase({
      id: 'F149-IAEA-HDR-CO60-IR192',
      family: 'IAEA_SRS47',
      label: 'HDR braquiterapia blindaje simplificado',
      source: 'IAEA SRS-47 / Gamma-delta Ir-192 + tvlThickness (motor validado)',
      formula: 'K=Gamma_delta*A*t/d^2; B=P/(T*K); t=log10(1/B)*TVL(Ir-192)',
      expected: hdrExpectedMm,
      actual: hdr.espesor_mm,
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
