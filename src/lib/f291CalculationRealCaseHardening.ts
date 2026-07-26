import type { NumericQaValidationResult } from './numericQaValidation';

export type F291ClinicalCaseStatus = 'ready' | 'operator-input-required' | 'blocked';

export interface F291ClinicalMatrixCase {
  id: string;
  profile: 'DX' | 'TX' | 'NM' | 'CY';
  status: string;
  expected: string;
}

export interface F291ClinicalCaseHardening {
  caseId: string;
  profile: string;
  status: F291ClinicalCaseStatus;
  numericCaseIds: string[];
  requiredGuards: string[];
  requiredWarnings: string[];
  evidencePolicy: string;
  releaseDecision: string;
}

export interface F291CalculationRealCaseHardening {
  schema: 'radshield-mx.f291.calculation-real-case-hardening.v1';
  phase: 'F291';
  status: 'calculation-real-case-hardening-ready' | 'calculation-real-case-hardening-blocked';
  totalCases: number;
  readyCases: number;
  operatorInputRequired: number;
  numericQa: {
    total: number;
    pass: number;
    reviewRequired: number;
    fail: number;
  };
  cases: F291ClinicalCaseHardening[];
  engineGuards: string[];
  decision: string;
}

const NUMERIC_CASES_BY_PROFILE: Record<string, string[]> = {
  DX: ['ct-rx-ncrp147-archer', 'uaq-local-review-gate'],
  TX: ['linac-6mv-primary-tvl', 'linac-18mv-neutron-warning', 'gamma-knife-co60-energy-key', 'uaq-local-review-gate'],
  NM: ['pet-nm-point-kernel', 'uaq-local-review-gate'],
  CY: ['uaq-local-review-gate'],
};

const WARNING_BY_PROFILE: Record<string, string[]> = {
  DX: ['source standard inferred only if missing', 'clinicalReview before CNSNS/UAQ release'],
  TX: ['energy >10 MV requires neutron/maze/door check when applicable', 'clinicalReview before signed memory'],
  NM: ['point-kernel screen is preliminary', 'operator signed memory required when no approved RAG case exists'],
  CY: ['activation/neutron/ventilation review required', 'external MC runner remains optional evidence, not automatic certification'],
};

function statusFromCase(input: F291ClinicalMatrixCase, numericResults: NumericQaValidationResult[]): F291ClinicalCaseStatus {
  const related = NUMERIC_CASES_BY_PROFILE[input.profile] ?? [];
  const hasFailedNumeric = numericResults.some((result) => related.includes(result.id) && result.status === 'fail');
  if (hasFailedNumeric) return 'blocked';
  if (input.status === 'operator-input-required') return 'operator-input-required';
  return 'ready';
}

export function buildF291CalculationRealCaseHardening(
  matrixCases: F291ClinicalMatrixCase[],
  numericResults: NumericQaValidationResult[],
): F291CalculationRealCaseHardening {
  const cases = matrixCases.map((item) => {
    const status = statusFromCase(item, numericResults);
    const numericCaseIds = NUMERIC_CASES_BY_PROFILE[item.profile] ?? [];
    return {
      caseId: item.id,
      profile: item.profile,
      status,
      numericCaseIds,
      requiredGuards: [
        'finite positive P/T/U/W, scale, distance, workload and material density',
        'normalized units snapshot mm/cm/m, mSv/wk/uSv/h, kg/m2 and kPa',
        'calculation trace with formulaId, standard, inputs, outputs, assumptions and citationIds',
        'base-vs-conservative comparison before report release',
        'safe cache invalidation by geometry, scale, source, material, norm and P/T/U/W',
      ],
      requiredWarnings: WARNING_BY_PROFILE[item.profile] ?? ['clinicalReview before signed release'],
      evidencePolicy: item.status === 'operator-input-required'
        ? 'Use canonical NCRP/IAEA/UAQ only until an operator-supplied signed memory/floorplan closes this case.'
        : 'Approved RAG examples may support workflow and citations, but normative sources remain canonical.',
      releaseDecision: status === 'ready'
        ? 'Ready for real-case smoke with reviewed inputs and report evidence.'
        : status === 'operator-input-required'
          ? 'Hold signed output until the operator supplies real floorplan, equipment data and signed/approved evidence.'
          : 'Blocked by numeric QA failure; fix calculation engine before report export.',
    } satisfies F291ClinicalCaseHardening;
  });

  const fail = numericResults.filter((result) => result.status === 'fail').length;
  const readyCases = cases.filter((item) => item.status === 'ready').length;
  const operatorInputRequired = cases.filter((item) => item.status === 'operator-input-required').length;

  return {
    schema: 'radshield-mx.f291.calculation-real-case-hardening.v1',
    phase: 'F291',
    status: fail === 0 && cases.length > 0 ? 'calculation-real-case-hardening-ready' : 'calculation-real-case-hardening-blocked',
    totalCases: cases.length,
    readyCases,
    operatorInputRequired,
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
  };
}
