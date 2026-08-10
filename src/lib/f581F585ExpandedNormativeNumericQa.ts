import type { F484F490Standard } from '@/lib/f484F490NormativeQa';
import { buildF484F490NormativeQa } from '@/lib/f484F490NormativeQa';
import { buildF519NormativeQaExpansion, type F519BarrierRole } from '@/lib/f519NormativeQaExpansion';

export type F581F585Modality =
  | 'LINAC_6MV'
  | 'LINAC_15MV'
  | 'DIAGNOSTIC_CT'
  | 'GAMMA_KNIFE'
  | 'PET_NM'
  | 'CYCLOTRON_18MEV';

export type F581F585Status = 'pass' | 'review';

export interface F581F585NumericQaCase {
  id: string;
  phase: 'F581' | 'F582' | 'F583' | 'F584' | 'F585';
  label: string;
  modality: F581F585Modality;
  barrierRole: F519BarrierRole;
  standard: F484F490Standard;
  calculationRoute: 'tvl' | 'tvl-plus-penalty' | 'lead-equivalent' | 'source-term-screening';
  units: {
    distance_m?: number;
    workload_Gy_per_week?: number;
    designGoal_mSv_per_week?: number;
    occupancyFactor: number;
    useFactor: number;
    tvl_mm: number;
    density_kg_m3?: number;
  };
  inputs: {
    transmission: number;
    penalty_mm?: number;
    workloadMultiplier?: number;
  };
  expected: {
    thickness_mm: number;
  };
  tolerancePct: number;
  citationIds: string[];
  assumptions: string[];
  requiredWarnings: string[];
}

export interface F581F585NumericQaResult {
  caseId: string;
  phase: F581F585NumericQaCase['phase'];
  label: string;
  modality: F581F585Modality;
  barrierRole: F519BarrierRole;
  standard: F484F490Standard;
  calculatedThickness_mm: number;
  expectedThickness_mm: number;
  deltaPct: number;
  status: F581F585Status;
  warnings: string[];
  citationIds: string[];
}

export interface F581F585ExpandedNormativeNumericQa {
  schema: 'radshield-mx.calc.normative-qa.f581-f585.v1';
  phaseRange: 'F581-F585';
  status: 'qa-expanded-pass' | 'qa-expanded-review';
  baseCoverage: {
    f484F490Cases: number;
    f519Cases: number;
    inheritedStandards: F484F490Standard[];
  };
  results: F581F585NumericQaResult[];
  summary: {
    totalCases: number;
    passedCases: number;
    reviewCases: number;
    standardsCovered: F484F490Standard[];
    modalitiesCovered: F581F585Modality[];
    rolesCovered: F519BarrierRole[];
    maxDeltaPct: number;
  };
  gates: {
    canPublishBetaNumericQa: boolean;
    canClaimClinicalCertification: false;
    requiresDbBackedDatasets: true;
    requiresPhysicistReview: true;
  };
  releaseBlockers: string[];
  screenshots: string[];
}

export const F581_F585_NUMERIC_QA_CASES: F581F585NumericQaCase[] = [
  {
    id: 'f581-linac-6mv-primary-public-ncrp151',
    phase: 'F581',
    label: 'LINAC 6 MV primaria publica - concreto normal',
    modality: 'LINAC_6MV',
    barrierRole: 'primary',
    standard: 'NCRP151',
    calculationRoute: 'tvl',
    units: { distance_m: 4.5, workload_Gy_per_week: 500, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 370, density_kg_m3: 2350 },
    inputs: { transmission: 1e-5 },
    expected: { thickness_mm: 1850 },
    tolerancePct: 0.25,
    citationIds: ['NCRP-151', 'UAQ-MEMORIA-LINAC'],
    assumptions: ['Fixture de regresion TVL con U=1, T=1 y colindancia publica.', 'No sustituye calculo completo con geometria trazada.'],
    requiredWarnings: ['resultado preliminar requiere revision RSO/fisico medico'],
  },
  {
    id: 'f581-linac-15mv-secondary-neutron-iaea',
    phase: 'F581',
    label: 'LINAC 15 MV secundaria + neutrones - margen conservador',
    modality: 'LINAC_15MV',
    barrierRole: 'secondary',
    standard: 'IAEA-SRS47',
    calculationRoute: 'tvl-plus-penalty',
    units: { distance_m: 5.2, workload_Gy_per_week: 650, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 0.25, tvl_mm: 330, density_kg_m3: 2350 },
    inputs: { transmission: 1e-4, penalty_mm: 120 },
    expected: { thickness_mm: 1440 },
    tolerancePct: 0.25,
    citationIds: ['NCRP-151', 'IAEA-SRS47'],
    assumptions: ['Energia mayor a 10 MV activa revision neutronica.', 'Penalizacion neutronica conservadora para QA, no maze final.'],
    requiredWarnings: ['energia >10 MV requiere neutrones', 'resultado preliminar requiere revision RSO/fisico medico'],
  },
  {
    id: 'f582-ct-lead-door-ncrp147',
    phase: 'F582',
    label: 'CT/RX puerta plomada - equivalencia Pb',
    modality: 'DIAGNOSTIC_CT',
    barrierRole: 'door',
    standard: 'NCRP147',
    calculationRoute: 'lead-equivalent',
    units: { distance_m: 2.1, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 0.35, density_kg_m3: 11340 },
    inputs: { transmission: 1e-2, penalty_mm: 0.15 },
    expected: { thickness_mm: 0.85 },
    tolerancePct: 0.5,
    citationIds: ['NCRP-147'],
    assumptions: ['Puerta requiere continuidad de marco y energia/kVp versionada.', 'El valor es fixture de regresion lead-equivalent.'],
    requiredWarnings: ['TVL no versionado', 'material sin densidad validada'],
  },
  {
    id: 'f582-ct-control-room-secondary',
    phase: 'F582',
    label: 'CT/RX sala de control - secundaria diagnostica',
    modality: 'DIAGNOSTIC_CT',
    barrierRole: 'secondary',
    standard: 'NCRP147',
    calculationRoute: 'lead-equivalent',
    units: { distance_m: 3.4, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 0.35, density_kg_m3: 11340 },
    inputs: { transmission: 5e-3 },
    expected: { thickness_mm: 0.805 },
    tolerancePct: 0.5,
    citationIds: ['NCRP-147', 'UAQ-MEMORIA-DX'],
    assumptions: ['Barrera diagnostica simplificada con transmision fixture.', 'Debe reemplazarse por workload y kVp reales.'],
    requiredWarnings: ['TVL no versionado'],
  },
  {
    id: 'f583-gammaknife-cobalt-secondary',
    phase: 'F583',
    label: 'Gamma Knife Esprit/Co-60 secundaria publica',
    modality: 'GAMMA_KNIFE',
    barrierRole: 'secondary',
    standard: 'IAEA-SRS47',
    calculationRoute: 'tvl-plus-penalty',
    units: { distance_m: 4.8, workload_Gy_per_week: 300, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 206, density_kg_m3: 2350 },
    inputs: { transmission: 1e-4, penalty_mm: 25 },
    expected: { thickness_mm: 849 },
    tolerancePct: 0.25,
    citationIds: ['IAEA-SRS47', 'UAQ-MEMORIA-GAMMA-KNIFE'],
    assumptions: ['Fixture Co-60 con margen para equipo/proveedor.', 'Debe anexarse fuente vendor y carga real.'],
    requiredWarnings: ['resultado preliminar requiere revision RSO/fisico medico'],
  },
  {
    id: 'f583-pet-hotlab-controlled-zone',
    phase: 'F583',
    label: 'PET/NM 511 keV hot lab - zona controlada',
    modality: 'PET_NM',
    barrierRole: 'controlled-zone',
    standard: 'AAPM-TG108',
    calculationRoute: 'source-term-screening',
    units: { distance_m: 1.5, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 16, density_kg_m3: 11340 },
    inputs: { transmission: 1e-3, penalty_mm: 4 },
    expected: { thickness_mm: 52 },
    tolerancePct: 0.5,
    citationIds: ['AAPM-TG108', 'IAEA-SRS47'],
    assumptions: ['Fixture de fuente puntual PET; actividad, residencia y flujo de pacientes se sustituyen en memoria real.'],
    requiredWarnings: ['distancia menor a 0.3 m'],
  },
  {
    id: 'f584-cyclotron-18mev-maze-uaq',
    phase: 'F584',
    label: 'Ciclotron 18 MeV laberinto - alta densidad + neutrones',
    modality: 'CYCLOTRON_18MEV',
    barrierRole: 'maze',
    standard: 'UAQ',
    calculationRoute: 'tvl-plus-penalty',
    units: { distance_m: 6, workload_Gy_per_week: 1000, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 320, density_kg_m3: 3100 },
    inputs: { transmission: 1e-6, penalty_mm: 180 },
    expected: { thickness_mm: 2100 },
    tolerancePct: 0.25,
    citationIds: ['UAQ-MEMORIA-CICLOTRON', 'IAEA-SRS47'],
    assumptions: ['Fixture conservador para laberinto; requiere source term proveedor y activacion.'],
    requiredWarnings: ['energia >10 MV requiere neutrones', 'resultado preliminar requiere revision RSO/fisico medico'],
  },
  {
    id: 'f584-penetration-hvac-sleeve',
    phase: 'F584',
    label: 'Penetracion HVAC/sleeve - continuidad de blindaje',
    modality: 'LINAC_15MV',
    barrierRole: 'penetration',
    standard: 'NCRP151',
    calculationRoute: 'tvl-plus-penalty',
    units: { distance_m: 3.8, workload_Gy_per_week: 650, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 330, density_kg_m3: 2350 },
    inputs: { transmission: 1e-4, penalty_mm: 180 },
    expected: { thickness_mm: 1500 },
    tolerancePct: 0.25,
    citationIds: ['NCRP-151', 'IAEA-SRS47'],
    assumptions: ['La penalizacion modela continuidad, ductos, sleeves y huecos como fixture.'],
    requiredWarnings: ['penetracion requiere continuidad de blindaje'],
  },
  {
    id: 'f585-unit-conversion-density-load',
    phase: 'F585',
    label: 'Unidades densidad/carga estructural - concreto alta densidad',
    modality: 'CYCLOTRON_18MEV',
    barrierRole: 'primary',
    standard: 'UAQ',
    calculationRoute: 'tvl',
    units: { distance_m: 5, workload_Gy_per_week: 1000, designGoal_mSv_per_week: 0.02, occupancyFactor: 1, useFactor: 1, tvl_mm: 320, density_kg_m3: 3100 },
    inputs: { transmission: 1e-5 },
    expected: { thickness_mm: 1600 },
    tolerancePct: 0.25,
    citationIds: ['UAQ-MATERIAL-HD', 'UAQ-MEMORIA-CICLOTRON'],
    assumptions: ['Carga estructural asociada: 1.6 m * 3100 kg/m3 = 4960 kg/m2 antes de factor constructivo.'],
    requiredWarnings: ['material sin densidad validada', 'resultado preliminar requiere revision RSO/fisico medico'],
  },
];

function round(value: number, digits = 3): number {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function unique<T>(items: T[]): T[] {
  return [...new Set(items)];
}

function calculateThicknessMm(testCase: F581F585NumericQaCase): number {
  if (
    !Number.isFinite(testCase.inputs.transmission) ||
    testCase.inputs.transmission <= 0 ||
    testCase.inputs.transmission >= 1 ||
    !Number.isFinite(testCase.units.tvl_mm) ||
    testCase.units.tvl_mm <= 0
  ) {
    return Number.NaN;
  }

  const tvlThickness = -Math.log10(testCase.inputs.transmission) * testCase.units.tvl_mm;
  const workloadMultiplier = Math.max(testCase.inputs.workloadMultiplier ?? 1, 1);
  const workloadDelta = Math.log10(workloadMultiplier) * testCase.units.tvl_mm;
  return tvlThickness + workloadDelta + (testCase.inputs.penalty_mm ?? 0);
}

export function evaluateF581F585NumericQaCase(testCase: F581F585NumericQaCase): F581F585NumericQaResult {
  const calculated = calculateThicknessMm(testCase);
  const deltaPct = Math.abs(calculated - testCase.expected.thickness_mm) / testCase.expected.thickness_mm * 100;
  const warnings = [
    ...testCase.requiredWarnings,
    ...(testCase.units.distance_m !== undefined && testCase.units.distance_m < 0.3 ? ['distancia menor a 0.3 m'] : []),
    'fixture QA: sustituir por geometria, workload, U/T/P y cita hash/pagina antes de firma',
  ];

  return {
    caseId: testCase.id,
    phase: testCase.phase,
    label: testCase.label,
    modality: testCase.modality,
    barrierRole: testCase.barrierRole,
    standard: testCase.standard,
    calculatedThickness_mm: round(calculated),
    expectedThickness_mm: testCase.expected.thickness_mm,
    deltaPct: round(deltaPct),
    status: Number.isFinite(deltaPct) && deltaPct <= testCase.tolerancePct ? 'pass' : 'review',
    warnings: unique(warnings),
    citationIds: testCase.citationIds,
  };
}

export function buildF581F585ExpandedNormativeNumericQa(): F581F585ExpandedNormativeNumericQa {
  const f484F490 = buildF484F490NormativeQa();
  const f519 = buildF519NormativeQaExpansion();
  const results = F581_F585_NUMERIC_QA_CASES.map(evaluateF581F585NumericQaCase);
  const reviewCases = results.filter((item) => item.status === 'review').length;
  const maxDeltaPct = results.reduce((max, item) => Math.max(max, item.deltaPct), 0);

  return {
    schema: 'radshield-mx.calc.normative-qa.f581-f585.v1',
    phaseRange: 'F581-F585',
    status: reviewCases === 0 ? 'qa-expanded-pass' : 'qa-expanded-review',
    baseCoverage: {
      f484F490Cases: f484F490.summary.totalCases,
      f519Cases: f519.summary.totalCases,
      inheritedStandards: unique([...f484F490.summary.standardsCovered, ...f519.summary.standardsCovered]),
    },
    results,
    summary: {
      totalCases: results.length,
      passedCases: results.length - reviewCases,
      reviewCases,
      standardsCovered: unique(results.map((item) => item.standard)),
      modalitiesCovered: unique(results.map((item) => item.modality)),
      rolesCovered: unique(results.map((item) => item.barrierRole)),
      maxDeltaPct: round(maxDeltaPct),
    },
    gates: {
      canPublishBetaNumericQa: reviewCases === 0,
      canClaimClinicalCertification: false,
      requiresDbBackedDatasets: true,
      requiresPhysicistReview: true,
    },
    releaseBlockers: [
      'Completar datasets ENDF/XCOM/ICRU versionados y vinculados a document_chunks.',
      'Correr QA DB-backed por proyecto con geometria, penetraciones, ocupacion, workload y materiales reales.',
      'Agregar firma/revision de fisico medico o RSO antes de memoria analitica firmable.',
      'Mantener resultados como preliminares mientras falte validacion independiente.',
    ],
    screenshots: [
      'outputs/f581_f585_expanded_normative_qa/00_normative_numeric_qa_panel.png',
      'outputs/f581_f585_expanded_normative_qa/01_normative_numeric_qa_canvas.png',
      'outputs/f581_f585_expanded_normative_qa/02_normative_numeric_qa_event.png',
    ],
  };
}

export function formatF581F585ExpandedNormativeNumericQaMarkdown(
  contract = buildF581F585ExpandedNormativeNumericQa(),
): string {
  return [
    '# F581-F585 QA NORMATIVO NUMERICO AMPLIADO',
    '',
    `Estado: ${contract.status}`,
    `Casos: ${contract.summary.passedCases}/${contract.summary.totalCases} pass`,
    `Max delta: ${contract.summary.maxDeltaPct}%`,
    `Normas: ${contract.summary.standardsCovered.join(', ')}`,
    `Modalidades: ${contract.summary.modalitiesCovered.join(', ')}`,
    '',
    '## Casos',
    ...contract.results.map(
      (item) =>
        `- ${item.phase} ${item.label}: ${item.calculatedThickness_mm} mm vs ${item.expectedThickness_mm} mm (${item.deltaPct}%, ${item.status})`,
    ),
    '',
    '## Gates',
    `- Beta numerica preliminar: ${contract.gates.canPublishBetaNumericQa ? 'permitida' : 'review'}`,
    '- Certificacion clinica: NO',
    '- DB-backed datasets requeridos: SI',
    '- Revision fisico medico/RSO: SI',
    '',
    '## Bloqueadores antes de uso clinico',
    ...contract.releaseBlockers.map((item) => `- ${item}`),
    '',
  ].join('\n');
}
