import { describe, expect, it } from 'vitest';
import { buildF237CalculationEngineGovernance, buildF237CalculationEngineGovernanceSection } from '@/lib/f237CalculationEngineGovernance';
import type { Barrier, FloorPlan } from '@/types/radshield';

const readyBarrier: Barrier = {
  id: 'b-ready',
  name: 'Barrera primaria norte',
  x1: 0,
  y1: 0,
  x2: 400,
  y2: 0,
  barrierType: 'primary',
  useFactor: 1,
  occupancyFactor: 0.25,
  designGoal_mSv_per_wk: 0.02,
  materialCode: 'CONCRETE235',
  calculationTrace: {
    formulaId: 'NCRP151_TVL',
    standard: 'NCRP151',
    modalityCategory: 'therapy',
    energyKey: '6MV',
    sourceCount: 1,
    materialCount: 2,
    samplePointCount: 12,
    assumptions: ['Point-kernel screening calculation.'],
    citationIds: ['NCRP-151'],
    inputs: { P: 0.02, T: 0.25, U: 1 },
    outputs: { maxKerma_mSv_per_wk: 12, maxRequiredThickness_mm: 1020 },
  },
  calculationWarnings: [
    {
      field: 'clinicalReview',
      severity: 'warning',
      message: 'Preliminary shielding result: requires RSO/qualified medical physicist review before clinical or regulatory use.',
    },
  ],
  calculationComparison: {
    method: 'base-vs-conservative',
    baseThickness_mm: 1020,
    conservativeThickness_mm: 1071,
    delta_mm: 51,
    deltaPercent: 5,
    dominant: 'conservative',
    note: 'Conservative margin applied.',
  },
  calculationUnitSnapshot: {
    scale_m_per_pixel: 0.01,
    barrierLength_m: 4,
    sampleOffset_m: 0.3,
    minSourceDistance_m: 2,
    maxKerma_mSv_per_wk: 12,
    maxKerma_uSv_per_h_40h: 300,
    selectedThickness_mm: 1020,
    selectedThickness_cm: 102,
    density_g_cm3: 2.35,
    density_kg_m3: 2350,
    mass_kg_per_m2: 2397,
    cost_per_m2: 183.6,
    structuralLoad_kPa: 23.5,
  },
  calculationCacheKey: 'calc:f196:ready123',
};

function floorPlanWith(barriers: Barrier[]): FloorPlan {
  return {
    id: 'fp-f237',
    name: 'F237 QA floorplan',
    imageUrl: null,
    scale_m_per_pixel: 0.01,
    width_pixels: 1200,
    height_pixels: 800,
    barriers,
    sources: [],
    occupiedRegions: [],
    criticalPoints: [],
  };
}

describe('F237 calculation engine governance', () => {
  it('marks barriers ready when trace, units, warnings, comparison, citations and cache are present', () => {
    const gate = buildF237CalculationEngineGovernance(floorPlanWith([readyBarrier]));

    expect(gate.status).toBe('implemented-calculation-engine-governance');
    expect(gate.readyCount).toBe(1);
    expect(gate.reviewRequiredCount).toBe(0);
    expect(gate.blockedCount).toBe(0);
    expect(gate.numericCasesReady).toBeGreaterThanOrEqual(5);
    expect(gate.engineImprovements.map((item) => item.id)).toContain('unit-normalization');
    expect(gate.barriers[0].clinicalReviewPresent).toBe(true);
  });

  it('holds signed output when calculation evidence is incomplete', () => {
    const gate = buildF237CalculationEngineGovernance(floorPlanWith([{ ...readyBarrier, id: 'b-gap', calculationComparison: undefined }]));

    expect(gate.readyCount).toBe(0);
    expect(gate.reviewRequiredCount).toBe(1);
    expect(gate.barriers[0].gaps).toContain('missing base-vs-conservative comparison');
    expect(gate.decision).toContain('review');
  });

  it('renders a report section for Memoria IA and Evidence Pack', () => {
    const section = buildF237CalculationEngineGovernanceSection(floorPlanWith([readyBarrier]));

    expect(section).toContain('F237 GOBIERNO DEL MOTOR DE CALCULO');
    expect(section).toContain('trace-formula-standard');
    expect(section).toContain('MemoriaAIWizard');
  });
});
