import type { F484F490Standard } from '@/lib/f484F490NormativeQa';

export type F519BarrierRole = 'primary' | 'secondary' | 'maze' | 'door' | 'penetration' | 'controlled-zone';

export interface F519ExpandedQaCase {
  id: string;
  modality: 'LINAC' | 'CT_RX' | 'GAMMA_KNIFE' | 'PET_NM' | 'CYCLOTRON';
  barrierRole: F519BarrierRole;
  standard: F484F490Standard;
  base: {
    transmission: number;
    tvl_mm: number;
    occupancyFactor: number;
    useFactor: number;
    workloadFactor: number;
    extraShielding_mm?: number;
  };
  conservative: {
    occupancyFactor: number;
    useFactor: number;
    workloadFactor: number;
    penetrationPenalty_mm: number;
  };
  expectedConservativeThickness_mm: number;
  tolerancePct: number;
  citationIds: string[];
  warnings: string[];
}

export interface F519ExpandedQaResult {
  caseId: string;
  modality: F519ExpandedQaCase['modality'];
  barrierRole: F519BarrierRole;
  standard: F484F490Standard;
  baseThickness_mm: number;
  conservativeThickness_mm: number;
  expectedConservativeThickness_mm: number;
  conservativeDeltaPct: number;
  dominantMethod: 'base' | 'conservative';
  status: 'pass' | 'review';
  citationIds: string[];
  warnings: string[];
}

export interface F519NormativeQaExpansionContract {
  schema: 'radshield-mx.calc.normative-qa.f519-expansion.v1';
  phase: 'F519';
  status: 'qa-pass' | 'qa-review';
  results: F519ExpandedQaResult[];
  summary: {
    totalCases: number;
    passedCases: number;
    reviewCases: number;
    barrierRolesCovered: F519BarrierRole[];
    standardsCovered: F484F490Standard[];
  };
  releaseImpact: string[];
}

export const F519_EXPANDED_QA_CASES: F519ExpandedQaCase[] = [
  {
    id: 'f519-linac-primary-public-controlled',
    modality: 'LINAC',
    barrierRole: 'primary',
    standard: 'NCRP151',
    base: { transmission: 1e-5, tvl_mm: 370, occupancyFactor: 1, useFactor: 1, workloadFactor: 1 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1.2, penetrationPenalty_mm: 0 },
    expectedConservativeThickness_mm: 1879.291,
    tolerancePct: 0.5,
    citationIds: ['NCRP-151', 'UAQ-MEMORIA-LINAC'],
    warnings: ['Public adjacency requires conservative occupancy confirmation.'],
  },
  {
    id: 'f519-linac-secondary-penetration',
    modality: 'LINAC',
    barrierRole: 'penetration',
    standard: 'NCRP151',
    base: { transmission: 1e-4, tvl_mm: 330, occupancyFactor: 1, useFactor: 0.25, workloadFactor: 1, extraShielding_mm: 80 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1, penetrationPenalty_mm: 120 },
    expectedConservativeThickness_mm: 1718.68,
    tolerancePct: 0.5,
    citationIds: ['NCRP-151', 'IAEA-SRS47'],
    warnings: ['Penetration continuity must be checked against sleeves, ducts and doors.'],
  },
  {
    id: 'f519-ct-door-diagnostic',
    modality: 'CT_RX',
    barrierRole: 'door',
    standard: 'NCRP147',
    base: { transmission: 1e-2, tvl_mm: 0.35, occupancyFactor: 1, useFactor: 1, workloadFactor: 1 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1, penetrationPenalty_mm: 0.15 },
    expectedConservativeThickness_mm: 0.85,
    tolerancePct: 0.5,
    citationIds: ['NCRP-147'],
    warnings: ['Door lead equivalence must match kVp/workload and frame continuity.'],
  },
  {
    id: 'f519-gammaknife-secondary-public',
    modality: 'GAMMA_KNIFE',
    barrierRole: 'secondary',
    standard: 'IAEA-SRS47',
    base: { transmission: 1e-4, tvl_mm: 206, occupancyFactor: 1, useFactor: 1, workloadFactor: 1 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1.1, penetrationPenalty_mm: 25 },
    expectedConservativeThickness_mm: 857.525,
    tolerancePct: 0.5,
    citationIds: ['IAEA-SRS47', 'UAQ-MEMORIA-GAMMA-KNIFE'],
    warnings: ['Vendor source model and treatment workload remain required.'],
  },
  {
    id: 'f519-pet-controlled-zone',
    modality: 'PET_NM',
    barrierRole: 'controlled-zone',
    standard: 'AAPM-TG108',
    base: { transmission: 1e-3, tvl_mm: 16, occupancyFactor: 1, useFactor: 1, workloadFactor: 1 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1.5, penetrationPenalty_mm: 4 },
    expectedConservativeThickness_mm: 54.817,
    tolerancePct: 0.5,
    citationIds: ['AAPM-TG108', 'IAEA-SRS47'],
    warnings: ['Patient residence time and controlled/public boundary must be explicit.'],
  },
  {
    id: 'f519-cyclotron-maze-neutron',
    modality: 'CYCLOTRON',
    barrierRole: 'maze',
    standard: 'UAQ',
    base: { transmission: 1e-6, tvl_mm: 320, occupancyFactor: 1, useFactor: 1, workloadFactor: 1, extraShielding_mm: 250 },
    conservative: { occupancyFactor: 1, useFactor: 1, workloadFactor: 1, penetrationPenalty_mm: 180 },
    expectedConservativeThickness_mm: 2350,
    tolerancePct: 0.5,
    citationIds: ['UAQ-MEMORIA-CICLOTRON', 'IAEA-SRS47'],
    warnings: ['Neutron maze, activation and penetrations require dedicated review.'],
  },
];

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function thicknessFromTransmission(transmission: number, tvlMm: number, extraMm = 0): number {
  if (!Number.isFinite(transmission) || transmission <= 0 || transmission >= 1 || !Number.isFinite(tvlMm) || tvlMm <= 0) {
    return Number.NaN;
  }
  return -Math.log10(transmission) * tvlMm + extraMm;
}

export function evaluateF519ExpandedQaCase(testCase: F519ExpandedQaCase): F519ExpandedQaResult {
  const baseThickness = thicknessFromTransmission(
    testCase.base.transmission,
    testCase.base.tvl_mm,
    testCase.base.extraShielding_mm ?? 0,
  );
  const workloadMultiplier = Math.max(
    testCase.conservative.occupancyFactor / Math.max(testCase.base.occupancyFactor, 0.000001),
    testCase.conservative.useFactor / Math.max(testCase.base.useFactor, 0.000001),
    testCase.conservative.workloadFactor / Math.max(testCase.base.workloadFactor, 0.000001),
    1,
  );
  const workloadDeltaTvls = Math.log10(workloadMultiplier);
  const conservativeThickness =
    baseThickness + workloadDeltaTvls * testCase.base.tvl_mm + testCase.conservative.penetrationPenalty_mm;
  const deltaPct =
    Math.abs(conservativeThickness - testCase.expectedConservativeThickness_mm) /
    testCase.expectedConservativeThickness_mm *
    100;

  return {
    caseId: testCase.id,
    modality: testCase.modality,
    barrierRole: testCase.barrierRole,
    standard: testCase.standard,
    baseThickness_mm: round(baseThickness),
    conservativeThickness_mm: round(conservativeThickness),
    expectedConservativeThickness_mm: testCase.expectedConservativeThickness_mm,
    conservativeDeltaPct: round(deltaPct),
    dominantMethod: conservativeThickness >= baseThickness ? 'conservative' : 'base',
    status: Number.isFinite(deltaPct) && deltaPct <= testCase.tolerancePct ? 'pass' : 'review',
    citationIds: testCase.citationIds,
    warnings: [
      ...testCase.warnings,
      'Preliminary QA fixture: replace with site-specific geometry, source term, workload and page/hash before clinical release.',
    ],
  };
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

export function buildF519NormativeQaExpansion(): F519NormativeQaExpansionContract {
  const results = F519_EXPANDED_QA_CASES.map(evaluateF519ExpandedQaCase);
  const reviewCases = results.filter((item) => item.status === 'review').length;

  return {
    schema: 'radshield-mx.calc.normative-qa.f519-expansion.v1',
    phase: 'F519',
    status: reviewCases === 0 ? 'qa-pass' : 'qa-review',
    results,
    summary: {
      totalCases: results.length,
      passedCases: results.length - reviewCases,
      reviewCases,
      barrierRolesCovered: unique(results.map((item) => item.barrierRole)),
      standardsCovered: unique(results.map((item) => item.standard)),
    },
    releaseImpact: [
      'Adds barrier-role QA coverage beyond F484-F490 fixtures.',
      'Introduces base vs conservative comparison for Memoria IA and Evidence Pack.',
      'Keeps results preliminary until DB-backed datasets and professional review are present.',
    ],
  };
}

export function formatF519NormativeQaExpansionMarkdown(contract = buildF519NormativeQaExpansion()): string {
  return [
    '# F519 QA NUMERICO AMPLIADO',
    '',
    `Estado: ${contract.status}`,
    `Casos: ${contract.summary.passedCases}/${contract.summary.totalCases} pass`,
    `Roles: ${contract.summary.barrierRolesCovered.join(', ')}`,
    '',
    '## Comparador base/conservador',
    ...contract.results.map(
      (item) =>
        `- ${item.caseId}: base ${item.baseThickness_mm} mm, conservador ${item.conservativeThickness_mm} mm (${item.status})`,
    ),
    '',
    '## Impacto',
    ...contract.releaseImpact.map((item) => `- ${item}`),
    '',
  ].join('\n');
}
