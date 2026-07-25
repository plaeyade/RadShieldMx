import {
  MATERIALS,
  MODALITIES,
  type Barrier,
  type FloorPlan,
  type RadiationSource,
  type ShieldingMaterial,
} from '@/types/radshield';
import {
  buildCalculationTrace,
  buildCalculationUnitSnapshot,
  buildConservativeCalculationComparison,
  calculateUnshieldedKerma,
  exponentialThickness,
  generateSamplePoints,
  getCalculationAuditWarnings,
  getShieldingEnergyKey,
  inverseArcher,
  tvlThickness,
} from './shieldingMath';
import { buildCalculationCacheKey } from './calculationCacheKey';
import { validateNormalizedCalculationUnits } from './unitNormalization';
import { buildF237CalculationEngineGovernance } from './f237CalculationEngineGovernance';

export type RealClinicalTrialStatus = 'pass' | 'review-required' | 'fail';

export interface RealClinicalTrialResult {
  id: string;
  modalityProfile: 'DX' | 'TX' | 'NM' | 'CY';
  scenario: string;
  floorPlan: FloorPlan;
  selectedBarrier: Barrier;
  selectedMaterial: ShieldingMaterial;
  selectedThickness_mm: number;
  maxKerma_mSv_per_wk: number;
  warningCount: number;
  errorCount: number;
  unitErrorCount: number;
  traceReady: boolean;
  citationReady: boolean;
  comparisonReady: boolean;
  cacheReady: boolean;
  status: RealClinicalTrialStatus;
  decision: string;
}

export interface RealClinicalTrialGate {
  phase: 'F264';
  schema: 'radshield-mx.real-clinical-trial.f264.v1';
  status: 'ready-for-real-app-testing' | 'blocked';
  generatedAt: string;
  caseCount: number;
  passCount: number;
  reviewRequiredCount: number;
  failCount: number;
  results: RealClinicalTrialResult[];
  nextActions: string[];
}

function modality(id: string) {
  const found = MODALITIES.find((item) => item.id === id);
  if (!found) throw new Error(`Missing modality ${id}`);
  return found;
}

function material(code: string): ShieldingMaterial {
  const found = MATERIALS.find((item) => item.code === code);
  if (!found) throw new Error(`Missing material ${code}`);
  return found;
}

function makeSource(id: string, modalityId: string, overrides: Partial<RadiationSource> = {}): RadiationSource {
  const mod = modality(modalityId);
  return {
    id,
    name: `Trial ${mod.name}`,
    x: 240,
    y: 180,
    modality: mod,
    workloadValue: mod.workloadDefault ?? 25,
    workloadUnit: mod.unit,
    isocenterHeight_m: mod.isocenterHeightDefault_m ?? 1,
    useFactor: 1,
    ...overrides,
  };
}

function makeBarrier(id: string, materialCode: string, overrides: Partial<Barrier> = {}): Barrier {
  return {
    id,
    name: `Trial barrier ${id}`,
    x1: 120,
    y1: 280,
    x2: 420,
    y2: 280,
    barrierType: 'primary',
    materialCode,
    thickness_mm: 0,
    occupancyFactor: 1,
    useFactor: 1,
    designGoal_mSv_per_wk: 0.02,
    ...overrides,
  };
}

function thicknessFor(source: RadiationSource, barrier: Barrier, maxKerma: number, mat: ShieldingMaterial, energyKey: string): number {
  if (source.modality.category === 'diagnostic') {
    const transmission = Math.max(1e-10, barrier.designGoal_mSv_per_wk / Math.max(maxKerma, 1e-10));
    return inverseArcher(transmission, mat);
  }
  if (source.modality.category === 'therapy') {
    return tvlThickness(maxKerma, barrier.designGoal_mSv_per_wk, mat, energyKey);
  }
  return exponentialThickness(maxKerma, barrier.designGoal_mSv_per_wk, mat, energyKey);
}

export function calculateRealClinicalTrialCase(params: {
  id: string;
  modalityProfile: RealClinicalTrialResult['modalityProfile'];
  scenario: string;
  source: RadiationSource;
  barrier: Barrier;
  selectedMaterial: ShieldingMaterial;
  scale_m_per_pixel?: number;
}): RealClinicalTrialResult {
  const scale = params.scale_m_per_pixel ?? 0.02;
  const points = generateSamplePoints(params.barrier, scale);
  let maxKerma = 0;
  let minSourceDistance_m = Infinity;

  for (const point of points) {
    const dx = (point.x - params.source.x) * scale;
    const dy = (point.y - params.source.y) * scale;
    const dz = params.source.isocenterHeight_m || 0;
    minSourceDistance_m = Math.min(minSourceDistance_m, Math.hypot(dx, dy, dz));
    maxKerma = Math.max(maxKerma, calculateUnshieldedKerma(params.source, point.x, point.y, scale));
  }

  const energyKey = getShieldingEnergyKey(params.source);
  const selectedThickness_mm = thicknessFor(params.source, params.barrier, maxKerma, params.selectedMaterial, energyKey);
  const requiredThickness_mm = { [params.selectedMaterial.code]: selectedThickness_mm };
  const calculationTrace = buildCalculationTrace({
    barrier: params.barrier,
    sources: [params.source],
    scale_m_per_pixel: scale,
    maxKerma_mSv_per_wk: maxKerma,
    requiredThickness_mm,
    samplePointCount: points.length,
  });
  const calculationWarnings = getCalculationAuditWarnings({
    barrier: params.barrier,
    sources: [params.source],
    scale_m_per_pixel: scale,
    maxKerma_mSv_per_wk: maxKerma,
    materialCount: 1,
    samplePointCount: points.length,
    materials: [params.selectedMaterial],
    energyKey,
    minSourceDistance_m,
  });
  const normalizedUnits = buildCalculationUnitSnapshot({
    barrier: params.barrier,
    sources: [params.source],
    material: params.selectedMaterial,
    scale_m_per_pixel: scale,
    maxKerma_mSv_per_wk: maxKerma,
    selectedThickness_mm,
    minSourceDistance_m,
  });
  const unitWarnings = validateNormalizedCalculationUnits(normalizedUnits);
  const calculationComparison = buildConservativeCalculationComparison({
    baseThickness_mm: selectedThickness_mm,
    maxKerma_mSv_per_wk: maxKerma,
    designGoal_mSv_per_wk: params.barrier.designGoal_mSv_per_wk,
    material: params.selectedMaterial,
    energyKey,
  });
  const floorPlan: FloorPlan = {
    id: `f264-${params.id}`,
    name: `F264 ${params.scenario}`,
    imageUrl: null,
    scale_m_per_pixel: scale,
    width_pixels: 640,
    height_pixels: 480,
    sources: [params.source],
    occupiedRegions: [],
    criticalPoints: [],
    barriers: [{
      ...params.barrier,
      maxKerma,
      requiredThickness_mm,
      calculationTrace,
      calculationWarnings: [...calculationWarnings, ...unitWarnings],
      calculationComparison,
      calculationUnitSnapshot: {
        scale_m_per_pixel: normalizedUnits.length.scale_m_per_pixel,
        barrierLength_m: normalizedUnits.length.barrierLength_m,
        sampleOffset_m: normalizedUnits.length.sampleOffset_m,
        minSourceDistance_m: normalizedUnits.length.minSourceDistance_m,
        maxKerma_mSv_per_wk: normalizedUnits.dose.maxKerma_mSv_per_wk,
        maxKerma_uSv_per_h_40h: normalizedUnits.dose.maxKerma_uSv_per_h_40h,
        selectedThickness_mm: normalizedUnits.material.selectedThickness_mm,
        selectedThickness_cm: normalizedUnits.material.selectedThickness_cm,
        density_g_cm3: normalizedUnits.material.density_g_cm3,
        density_kg_m3: normalizedUnits.material.density_kg_m3,
        mass_kg_per_m2: normalizedUnits.material.mass_kg_per_m2,
        cost_per_m2: normalizedUnits.material.cost_per_m2,
        structuralLoad_kPa: normalizedUnits.material.structuralLoad_kPa,
      },
      calculationCacheKey: '',
    }],
  };
  floorPlan.barriers[0].calculationCacheKey = buildCalculationCacheKey(floorPlan);
  const selectedBarrier = floorPlan.barriers[0];
  const errorCount = selectedBarrier.calculationWarnings?.filter((warning) => warning.severity === 'error').length ?? 0;
  const unitErrorCount = unitWarnings.filter((warning) => warning.severity === 'error').length;
  const traceReady = Boolean(calculationTrace.formulaId && calculationTrace.standard && calculationTrace.inputs && calculationTrace.outputs);
  const citationReady = Boolean(calculationTrace.citationIds.length);
  const comparisonReady = Number.isFinite(calculationComparison.conservativeThickness_mm);
  const cacheReady = Boolean(selectedBarrier.calculationCacheKey?.startsWith('calc:f196:'));
  const governance = buildF237CalculationEngineGovernance(floorPlan);
  const status: RealClinicalTrialStatus = errorCount > 0 || !traceReady || !citationReady || !comparisonReady || !cacheReady
    ? 'fail'
    : governance.reviewRequiredCount > 0 || governance.blockedCount > 0
      ? 'review-required'
      : 'pass';

  return {
    id: params.id,
    modalityProfile: params.modalityProfile,
    scenario: params.scenario,
    floorPlan,
    selectedBarrier,
    selectedMaterial: params.selectedMaterial,
    selectedThickness_mm,
    maxKerma_mSv_per_wk: maxKerma,
    warningCount: selectedBarrier.calculationWarnings?.length ?? 0,
    errorCount,
    unitErrorCount,
    traceReady,
    citationReady,
    comparisonReady,
    cacheReady,
    status,
    decision: status === 'fail'
      ? 'Blocked: calculation evidence has errors or missing release-facing metadata.'
      : 'Ready for controlled real-app testing; keep RSO/medical physicist review before signed reports.',
  };
}

export function runRealClinicalTrialCases(): RealClinicalTrialResult[] {
  return [
    calculateRealClinicalTrialCase({
      id: 'linac-6mv-primary-public',
      modalityProfile: 'TX',
      scenario: 'LINAC 6 MV primary barrier to public area',
      source: makeSource('trial-linac-6mv', 'linac-6mv', { workloadValue: 25, useFactor: 1 }),
      barrier: makeBarrier('linac-primary', 'CONCRETE235', { designGoal_mSv_per_wk: 0.02, barrierType: 'primary' }),
      selectedMaterial: material('CONCRETE235'),
    }),
    calculateRealClinicalTrialCase({
      id: 'linac-18mv-secondary-neutron-review',
      modalityProfile: 'TX',
      scenario: 'LINAC 18 MV secondary barrier with neutron review flag',
      source: makeSource('trial-linac-18mv', 'linac-18mv', { workloadValue: 25, useFactor: 0.25 }),
      barrier: makeBarrier('linac-secondary', 'CONCRETEBARITE', { designGoal_mSv_per_wk: 0.02, barrierType: 'secondary', useFactor: 0.25 }),
      selectedMaterial: material('CONCRETEBARITE'),
    }),
    calculateRealClinicalTrialCase({
      id: 'ct-body-public-control',
      modalityProfile: 'DX',
      scenario: 'CT body room public-side barrier',
      source: makeSource('trial-ct-body', 'ct-body', { workloadValue: 40, ctDLP_mGy_cm: 350, ctScansPerPatient: 1 }),
      barrier: makeBarrier('ct-public', 'PB', { designGoal_mSv_per_wk: 0.02, barrierType: 'secondary' }),
      selectedMaterial: material('PB'),
    }),
    calculateRealClinicalTrialCase({
      id: 'pet-f18-uptake-room',
      modalityProfile: 'NM',
      scenario: 'PET F-18 uptake/injection room barrier',
      source: makeSource('trial-pet-f18', 'pet-f18', { workloadValue: 7.4, nuclearActivity_GBq: 7.4, workloadHoursPerWeek: 40 }),
      barrier: makeBarrier('pet-uptake', 'PB', { designGoal_mSv_per_wk: 0.02, barrierType: 'nuclear' }),
      selectedMaterial: material('PB'),
    }),
    calculateRealClinicalTrialCase({
      id: 'gamma-knife-co60-primary',
      modalityProfile: 'TX',
      scenario: 'Gamma Knife Co-60 primary screening barrier',
      source: makeSource('trial-gamma-knife', 'gamma-knife', { workloadValue: 20, useFactor: 1 }),
      barrier: makeBarrier('gamma-knife-primary', 'CONCRETE235', { designGoal_mSv_per_wk: 0.02, barrierType: 'primary' }),
      selectedMaterial: material('CONCRETE235'),
    }),
    calculateRealClinicalTrialCase({
      id: 'hdr-ir192-control-room',
      modalityProfile: 'TX',
      scenario: 'HDR Ir-192 control-room barrier',
      source: makeSource('trial-hdr-ir192', 'hdr-192ir', { workloadValue: 10, workloadHoursPerWeek: 8 }),
      barrier: makeBarrier('hdr-control', 'PB', { designGoal_mSv_per_wk: 0.02, barrierType: 'nuclear' }),
      selectedMaterial: material('PB'),
    }),
  ];
}

export function buildF264RealClinicalTrialGate(results = runRealClinicalTrialCases()): RealClinicalTrialGate {
  const passCount = results.filter((result) => result.status === 'pass').length;
  const reviewRequiredCount = results.filter((result) => result.status === 'review-required').length;
  const failCount = results.filter((result) => result.status === 'fail').length;
  return {
    phase: 'F264',
    schema: 'radshield-mx.real-clinical-trial.f264.v1',
    status: failCount === 0 ? 'ready-for-real-app-testing' : 'blocked',
    generatedAt: new Date().toISOString(),
    caseCount: results.length,
    passCount,
    reviewRequiredCount,
    failCount,
    results,
    nextActions: [
      'Run one real project per modality profile: DX, TX, NM and CY when available.',
      'Compare exported Memoria IA/PDF/Evidence against one prior signed analytic memory.',
      'Record any deviation as calculation bug, data/source gap, UI workflow gap or documentation gap.',
      'Do not sign clinical/regulatory output without RSO/qualified medical physicist review.',
    ],
  };
}

export function summarizeF264RealClinicalTrialGate(gate = buildF264RealClinicalTrialGate()): string {
  return [
    'F264 REAL CLINICAL TRIAL GATE',
    `Status: ${gate.status}`,
    `Cases: ${gate.caseCount} | pass: ${gate.passCount} | review: ${gate.reviewRequiredCount} | fail: ${gate.failCount}`,
    ...gate.results.map((result) => [
      `- ${result.id} [${result.status}] ${result.scenario}`,
      `  profile=${result.modalityProfile} material=${result.selectedMaterial.code} thickness_mm=${result.selectedThickness_mm.toFixed(2)} kerma_mSv_wk=${result.maxKerma_mSv_per_wk.toFixed(4)}`,
      `  trace=${result.traceReady} citations=${result.citationReady} comparison=${result.comparisonReady} cache=${result.cacheReady} warnings=${result.warningCount} errors=${result.errorCount}`,
    ].join('\n')),
  ].join('\n');
}
