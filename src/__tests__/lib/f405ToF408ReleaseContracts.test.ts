import { describe, expect, it } from 'vitest';
import { buildF405CalculationTraceabilityBundle } from '@/lib/f405CalculationTraceabilityBundle';
import { buildF407ReportableHeatmapSnapshot } from '@/lib/f407ReportableHeatmap';
import { buildF408UnitySceneExport, validateF408UnitySceneExport } from '@/lib/f408UnitySceneExport';
import type { Barrier, FloorPlan, RadiationSource } from '@/types/radshield';

const traceableBarrier: Barrier = {
  id: 'b-f405',
  name: 'Barrera norte',
  x1: 0,
  y1: 0,
  x2: 400,
  y2: 0,
  barrierType: 'primary',
  useFactor: 1,
  occupancyFactor: 0.25,
  designGoal_mSv_per_wk: 0.02,
  materialCode: 'CONCRETE235',
  requiredThickness_mm: { CONCRETE235: 1200, PB: 160 },
  calculationTrace: {
    formulaId: 'NCRP151_TVL',
    standard: 'NCRP151',
    modalityCategory: 'therapy',
    energyKey: '15MV',
    sourceCount: 1,
    materialCount: 2,
    samplePointCount: 16,
    assumptions: ['Point-kernel screening calculation.'],
    citationIds: ['NCRP-151', 'NCRP-151-neutrons'],
    inputs: { P: 0.02, T: 0.25, U: 1 },
    outputs: { maxKerma_mSv_per_wk: 20, maxRequiredThickness_mm: 1200 },
  },
  calculationWarnings: [
    { field: 'clinicalReview', severity: 'warning', message: 'Preliminary shielding result: requires RSO/qualified medical physicist review before clinical or regulatory use.' },
  ],
  calculationComparison: {
    method: 'base-vs-conservative',
    baseThickness_mm: 1200,
    conservativeThickness_mm: 1260,
    delta_mm: 60,
    deltaPercent: 5,
    dominant: 'conservative',
    note: 'Conservative margin applied.',
  },
  calculationUnitSnapshot: {
    scale_m_per_pixel: 0.01,
    barrierLength_m: 4,
    sampleOffset_m: 0.3,
    minSourceDistance_m: 2.1,
    maxKerma_mSv_per_wk: 20,
    maxKerma_uSv_per_h_40h: 500,
    selectedThickness_mm: 1200,
    selectedThickness_cm: 120,
    density_g_cm3: 2.35,
    density_kg_m3: 2350,
    mass_kg_per_m2: 2820,
    cost_per_m2: 216,
    structuralLoad_kPa: 27.65,
  },
  calculationCacheKey: 'calc:f196:abc123',
};

const linacSource: RadiationSource = {
  id: 's-f405',
  x: 200,
  y: 180,
  name: 'Elekta Versa HD 15 MV',
  modality: {
    id: 'linac-15mv',
    name: 'LINAC 15 MV',
    category: 'therapy',
    standard: 'NCRP151',
    doseRateConstant: 2,
    unit: 'Gy/fraction',
    energy_MeV: 15,
    energyLabel: '15 MV X-rays',
  },
  workloadValue: 500,
  workloadUnit: 'Gy/week',
  useFactor: 1,
  isocenterHeight_m: 1.3,
};

const floorPlan: FloorPlan = {
  id: 'fp-f405',
  name: 'F405 QA floorplan',
  imageUrl: null,
  scale_m_per_pixel: 0.01,
  width_pixels: 900,
  height_pixels: 700,
  barriers: [traceableBarrier],
  sources: [linacSource],
  occupiedRegions: [
    {
      id: 'z-control',
      name: 'Zona controlada',
      points: [{ x: 40, y: 40 }, { x: 260, y: 40 }, { x: 260, y: 220 }],
      occupancyFactor: 1,
      designGoal_mSv_per_wk: 0.02,
    },
  ],
  criticalPoints: [],
};

describe('F405, F407, F408 release contracts', () => {
  it('bundles calculation traceability for Memoria IA, PDF and Evidence Pack', () => {
    const bundle = buildF405CalculationTraceabilityBundle(floorPlan);

    expect(bundle.status).toBe('calculation-traceability-ready');
    expect(bundle.readyCount).toBe(1);
    expect(bundle.traceableResults[0].citationIds).toContain('NCRP-151');
    expect(bundle.requiredFields).toContain('calculationUnitSnapshot');
  });

  it('builds reportable heatmap snapshot from sample lines and regulatory legend', () => {
    const snapshot = buildF407ReportableHeatmapSnapshot(
      floorPlan,
      [{ barrierId: 'b-f405', maxKermaRate_mGy_per_wk: 0.015 } as any],
      [{
        barrierId: 'b-f405',
        points: [
          { x: 1, y: 2, kermaRate: 0.001, barrierThicknessPbMm: 1, material: 'PB' },
          { x: 3, y: 4, kermaRate: 0.12, barrierThicknessPbMm: 2, material: 'PB' },
        ],
        maxKermaPoint: null,
        maxThicknessPoint: null,
      }],
      2,
    );

    expect(snapshot.points.length).toBe(3);
    expect(snapshot.legend.levels.map((level) => level.id)).toContain('exceed');
    expect(snapshot.exportTargets).toContain('Evidence Pack');
  });

  it('exports a Unity-compatible 3D scene contract with finite wall geometry', () => {
    const scene = buildF408UnitySceneExport(floorPlan, 'linac');
    const warnings = validateF408UnitySceneExport(scene);

    expect(scene.schema).toBe('radshield-mx.f408.unity-scene-export.v1');
    expect(scene.coordinateSystem.units).toBe('meters');
    expect(scene.walls[0].material.renderHint).toBe('concrete');
    expect(scene.equipment[0].name).toContain('Versa');
    expect(warnings).toEqual([]);
  });
});
