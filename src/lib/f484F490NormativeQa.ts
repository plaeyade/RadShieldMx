export type F484F490Standard = 'NCRP151' | 'NCRP147' | 'IAEA-SRS47' | 'UAQ' | 'AAPM-TG108';

export type F484F490Modality =
  | 'LINAC_6MV_PRIMARY'
  | 'LINAC_15MV_SECONDARY_NEUTRON'
  | 'DIAGNOSTIC_CT_NCRP147'
  | 'GAMMA_KNIFE_COBALT'
  | 'PET_NM_TG108'
  | 'CYCLOTRON_18MEV';

export interface F484F490QaCase {
  id: string;
  phase: 'F484' | 'F485' | 'F486' | 'F487' | 'F488' | 'F489' | 'F490';
  modality: F484F490Modality;
  label: string;
  standard: F484F490Standard;
  method: string;
  inputs: {
    transmission: number;
    tvl_mm: number;
    extraShielding_mm?: number;
  };
  expected: {
    tvls: number;
    requiredThickness_mm: number;
  };
  tolerancePct: number;
  citationIds: string[];
  assumptions: string[];
  clinicalWarnings: string[];
}

export interface F484F490QaResult {
  caseId: string;
  phase: F484F490QaCase['phase'];
  label: string;
  standard: F484F490Standard;
  calculatedTvls: number;
  calculatedThickness_mm: number;
  expectedThickness_mm: number;
  deltaPct: number;
  status: 'pass' | 'review';
  warnings: string[];
  citationIds: string[];
}

export interface F484F490NormativeQaContract {
  schema: 'radshield-mx.calc.normative-qa.f484-f490.v1';
  phaseRange: 'F484-F490';
  status: 'qa-pass' | 'qa-review';
  cases: F484F490QaResult[];
  summary: {
    totalCases: number;
    passedCases: number;
    reviewCases: number;
    standardsCovered: F484F490Standard[];
    modalitiesCovered: F484F490Modality[];
  };
  releaseGate: {
    decision: 'allow-beta-preliminary-calculation' | 'hold-clinical-release';
    requiredBeforeClinicalUse: string[];
  };
  heavyAssetImplementationRoute: string[];
}

export const F484_F490_QA_CASES: F484F490QaCase[] = [
  {
    id: 'f484-linac-6mv-primary-ncrp151',
    phase: 'F484',
    modality: 'LINAC_6MV_PRIMARY',
    label: 'LINAC 6 MV barrera primaria - TVL concreto',
    standard: 'NCRP151',
    method: 'TVL regression: thickness = -log10(B) * TVL',
    inputs: { transmission: 1e-5, tvl_mm: 370 },
    expected: { tvls: 5, requiredThickness_mm: 1850 },
    tolerancePct: 0.25,
    citationIds: ['NCRP-151', 'UAQ-MEMORIA-LINAC'],
    assumptions: ['Primary use factor U=1 screening case.', 'Concrete TVL is a versioned placeholder until project-specific material is selected.'],
    clinicalWarnings: ['Preliminary result: requires qualified medical physicist/RSO review before clinical or regulatory use.'],
  },
  {
    id: 'f485-linac-15mv-secondary-neutron',
    phase: 'F485',
    modality: 'LINAC_15MV_SECONDARY_NEUTRON',
    label: 'LINAC 15 MV secundaria con contribucion neutronica',
    standard: 'NCRP151',
    method: 'Photon TVL plus neutron screening allowance',
    inputs: { transmission: 1e-4, tvl_mm: 330, extraShielding_mm: 120 },
    expected: { tvls: 4, requiredThickness_mm: 1440 },
    tolerancePct: 0.25,
    citationIds: ['NCRP-151', 'IAEA-SRS47'],
    assumptions: ['Energy above 10 MV triggers neutron review.', 'Extra shielding term is a conservative screening allowance, not a final maze calculation.'],
    clinicalWarnings: ['Energy >10 MV requires neutron/maze review and source-term confirmation.'],
  },
  {
    id: 'f486-diagnostic-ct-ncrp147',
    phase: 'F486',
    modality: 'DIAGNOSTIC_CT_NCRP147',
    label: 'CT/RX diagnostico - barrera plomo NCRP147',
    standard: 'NCRP147',
    method: 'Diagnostic TVL regression for lead equivalent',
    inputs: { transmission: 1e-2, tvl_mm: 0.35 },
    expected: { tvls: 2, requiredThickness_mm: 0.7 },
    tolerancePct: 0.5,
    citationIds: ['NCRP-147'],
    assumptions: ['Diagnostic workload and room occupancy must be replaced with site-specific values.'],
    clinicalWarnings: ['TVL must remain tied to energy/workload and document hash before final report.'],
  },
  {
    id: 'f487-gamma-knife-cobalt',
    phase: 'F487',
    modality: 'GAMMA_KNIFE_COBALT',
    label: 'Gamma Knife / Co-60 - barrera concreto',
    standard: 'IAEA-SRS47',
    method: 'Co-60 TVL regression with local memory cross-check',
    inputs: { transmission: 1e-4, tvl_mm: 206 },
    expected: { tvls: 4, requiredThickness_mm: 824 },
    tolerancePct: 0.25,
    citationIds: ['IAEA-SRS47', 'UAQ-MEMORIA-GAMMA-KNIFE'],
    assumptions: ['Co-60 TVL is used as a regression fixture only.', 'Final design requires device-specific leakage/source geometry.'],
    clinicalWarnings: ['Gamma Knife vendor source model must be attached before firmable memory.'],
  },
  {
    id: 'f488-pet-nm-tg108',
    phase: 'F488',
    modality: 'PET_NM_TG108',
    label: 'PET/NM - fuente puntual 511 keV',
    standard: 'AAPM-TG108',
    method: 'Point-kernel screening with lead TVL',
    inputs: { transmission: 1e-3, tvl_mm: 16 },
    expected: { tvls: 3, requiredThickness_mm: 48 },
    tolerancePct: 0.5,
    citationIds: ['AAPM-TG108', 'IAEA-SRS47'],
    assumptions: ['Patient uptake, residence time and occupancy are simplified for regression QA.'],
    clinicalWarnings: ['PET/NM memory requires source inventory, uptake workflow and controlled/public area classification.'],
  },
  {
    id: 'f489-cyclotron-18mev',
    phase: 'F489',
    modality: 'CYCLOTRON_18MEV',
    label: 'Ciclotron 18 MeV - concreto alta densidad + neutrones',
    standard: 'UAQ',
    method: 'High-energy TVL regression plus neutron allowance',
    inputs: { transmission: 1e-6, tvl_mm: 320, extraShielding_mm: 250 },
    expected: { tvls: 6, requiredThickness_mm: 2170 },
    tolerancePct: 0.25,
    citationIds: ['UAQ-MEMORIA-CICLOTRON', 'IAEA-SRS47'],
    assumptions: ['Cyclotron fixture is a QA bound, not a substitute for vault-specific Monte Carlo or vendor report.'],
    clinicalWarnings: ['Cyclotron shielding requires activation/neutron review, penetrations and vendor source-term package.'],
  },
];

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function finitePositive(value: number): boolean {
  return Number.isFinite(value) && value > 0;
}

export function evaluateF484F490QaCase(testCase: F484F490QaCase): F484F490QaResult {
  if (!finitePositive(testCase.inputs.transmission) || testCase.inputs.transmission >= 1 || !finitePositive(testCase.inputs.tvl_mm)) {
    return {
      caseId: testCase.id,
      phase: testCase.phase,
      label: testCase.label,
      standard: testCase.standard,
      calculatedTvls: Number.NaN,
      calculatedThickness_mm: Number.NaN,
      expectedThickness_mm: testCase.expected.requiredThickness_mm,
      deltaPct: Number.POSITIVE_INFINITY,
      status: 'review',
      warnings: ['Invalid QA fixture input: transmission must be between 0 and 1 and TVL must be positive.'],
      citationIds: testCase.citationIds,
    };
  }

  const tvls = -Math.log10(testCase.inputs.transmission);
  const calculatedThickness = tvls * testCase.inputs.tvl_mm + (testCase.inputs.extraShielding_mm ?? 0);
  const deltaPct = Math.abs(calculatedThickness - testCase.expected.requiredThickness_mm) / testCase.expected.requiredThickness_mm * 100;

  return {
    caseId: testCase.id,
    phase: testCase.phase,
    label: testCase.label,
    standard: testCase.standard,
    calculatedTvls: round(tvls),
    calculatedThickness_mm: round(calculatedThickness),
    expectedThickness_mm: testCase.expected.requiredThickness_mm,
    deltaPct: round(deltaPct),
    status: deltaPct <= testCase.tolerancePct ? 'pass' : 'review',
    warnings: testCase.clinicalWarnings,
    citationIds: testCase.citationIds,
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function buildF484F490NormativeQa(): F484F490NormativeQaContract {
  const cases = F484_F490_QA_CASES.map(evaluateF484F490QaCase);
  const reviewCases = cases.filter((item) => item.status === 'review').length;

  return {
    schema: 'radshield-mx.calc.normative-qa.f484-f490.v1',
    phaseRange: 'F484-F490',
    status: reviewCases === 0 ? 'qa-pass' : 'qa-review',
    cases,
    summary: {
      totalCases: cases.length,
      passedCases: cases.length - reviewCases,
      reviewCases,
      standardsCovered: unique(cases.map((item) => item.standard)),
      modalitiesCovered: unique(F484_F490_QA_CASES.map((item) => item.modality)),
    },
    releaseGate: {
      decision: reviewCases === 0 ? 'allow-beta-preliminary-calculation' : 'hold-clinical-release',
      requiredBeforeClinicalUse: [
        'Replace fixture TVL/density/source terms with versioned document_chunks citations, page hints and hashes.',
        'Run site-specific NCRP/IAEA/UAQ cases for each barrier role, penetration and occupancy scenario.',
        'Attach qualified medical physicist/RSO review before signing a memoria analitica.',
      ],
    },
    heavyAssetImplementationRoute: [
      'Keep heavy visuals outside the calculation bundle until F484-F490 passes.',
      'Copy PBR/HDRI/decals to public/medical3d/photoreal and keep them lazy-loaded by Medical 3D.',
      'Copy Unity WebGL export to public/unity/radshield-medical-3d with index.html, Build/* and TemplateData/*.',
      'Use WebP/KTX2/HDR compression and keep optional assets out of the initial app shell.',
      'Run visual QA, calculation QA and post-deploy smoke before publishing a new static dist.',
    ],
  };
}

export function formatF484F490NormativeQaMarkdown(contract = buildF484F490NormativeQa()): string {
  const lines = [
    '# F484-F490 MOTOR CALCULO QA NCRP/IAEA/UAQ',
    '',
    `Estado: ${contract.status}`,
    `Casos: ${contract.summary.passedCases}/${contract.summary.totalCases} pass`,
    `Normas cubiertas: ${contract.summary.standardsCovered.join(', ')}`,
    '',
    '## Casos',
    ...contract.cases.map(
      (item) => `- ${item.phase} ${item.label}: ${item.calculatedThickness_mm} mm (${item.standard}, delta ${item.deltaPct}%, ${item.status})`,
    ),
    '',
    '## Ruta de assets pesados',
    ...contract.heavyAssetImplementationRoute.map((item) => `- ${item}`),
    '',
    '## Antes de uso clinico',
    ...contract.releaseGate.requiredBeforeClinicalUse.map((item) => `- ${item}`),
  ];

  return lines.join('\n');
}
