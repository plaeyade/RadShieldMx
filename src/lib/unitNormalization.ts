import type { Barrier, RadiationSource, ShieldingMaterial } from '@/types/radshield';

export interface NormalizedCalculationUnits {
  length: {
    scale_m_per_pixel: number;
    barrierLength_m: number;
    sampleOffset_m: number;
    minSourceDistance_m: number;
  };
  dose: {
    designGoal_mSv_per_wk: number;
    maxKerma_mSv_per_wk: number;
    maxKerma_uSv_per_h_40h: number;
  };
  material: {
    materialCode: string;
    density_g_cm3: number;
    density_kg_m3: number;
    selectedThickness_mm: number;
    selectedThickness_cm: number;
    mass_kg_per_m2: number;
    cost_per_m2: number;
    structuralLoad_kPa: number;
  };
  workload: {
    sourceCount: number;
    totalWorkload: number;
    totalUseWeightedWorkload: number;
    maxWorkloadHoursPerWeek: number;
  };
}

export function mmToCm(value: number): number {
  return Number.isFinite(value) ? value / 10 : 0;
}

export function cmToMm(value: number): number {
  return Number.isFinite(value) ? value * 10 : 0;
}

export function gCm3ToKgM3(value: number): number {
  return Number.isFinite(value) ? value * 1000 : 0;
}

export function mSvWeekToUSvHour(value: number, hoursPerWeek = 40): number {
  if (!Number.isFinite(value) || !Number.isFinite(hoursPerWeek) || hoursPerWeek <= 0) return 0;
  return (value * 1000) / hoursPerWeek;
}

export function kgM2FromDensityThickness(density_g_cm3: number, thickness_mm: number): number {
  if (!Number.isFinite(density_g_cm3) || !Number.isFinite(thickness_mm) || density_g_cm3 <= 0 || thickness_mm <= 0) return 0;
  return gCm3ToKgM3(density_g_cm3) * (thickness_mm / 1000);
}

export function structuralLoadKPaFromKgM2(kg_m2: number): number {
  if (!Number.isFinite(kg_m2) || kg_m2 <= 0) return 0;
  return (kg_m2 * 9.80665) / 1000;
}

export function costPerM2FromMaterial(material: ShieldingMaterial | undefined, thickness_mm: number): number {
  if (!material || !Number.isFinite(thickness_mm) || thickness_mm <= 0) return 0;
  const volume_m3_per_m2 = thickness_mm / 1000;
  if (Number.isFinite(material.cost_per_m3) && material.cost_per_m3 > 0) {
    return material.cost_per_m3 * volume_m3_per_m2;
  }
  if (Number.isFinite(material.cost_per_kg) && material.cost_per_kg > 0) {
    return kgM2FromDensityThickness(material.density, thickness_mm) * material.cost_per_kg;
  }
  return 0;
}

export function normalizeCalculationUnits(params: {
  barrier: Barrier;
  sources: RadiationSource[];
  material?: ShieldingMaterial;
  scale_m_per_pixel: number;
  maxKerma_mSv_per_wk: number;
  selectedThickness_mm: number;
  sampleOffset_m: number;
  minSourceDistance_m: number;
}): NormalizedCalculationUnits {
  const dx = params.barrier.x2 - params.barrier.x1;
  const dy = params.barrier.y2 - params.barrier.y1;
  const barrierLength_m = Math.hypot(dx, dy) * params.scale_m_per_pixel;
  const density_g_cm3 = params.material?.density ?? 0;
  const mass_kg_per_m2 = kgM2FromDensityThickness(density_g_cm3, params.selectedThickness_mm);
  const totalWorkload = params.sources.reduce((sum, source) => sum + (Number.isFinite(source.workloadValue) ? source.workloadValue : 0), 0);
  const totalUseWeightedWorkload = params.sources.reduce((sum, source) => {
    const workload = Number.isFinite(source.workloadValue) ? source.workloadValue : 0;
    const useFactor = Number.isFinite(source.useFactor) ? source.useFactor : 0;
    return sum + workload * useFactor;
  }, 0);

  return {
    length: {
      scale_m_per_pixel: params.scale_m_per_pixel,
      barrierLength_m,
      sampleOffset_m: params.sampleOffset_m,
      minSourceDistance_m: params.minSourceDistance_m,
    },
    dose: {
      designGoal_mSv_per_wk: params.barrier.designGoal_mSv_per_wk,
      maxKerma_mSv_per_wk: params.maxKerma_mSv_per_wk,
      maxKerma_uSv_per_h_40h: mSvWeekToUSvHour(params.maxKerma_mSv_per_wk, 40),
    },
    material: {
      materialCode: params.material?.code ?? params.barrier.materialCode,
      density_g_cm3,
      density_kg_m3: gCm3ToKgM3(density_g_cm3),
      selectedThickness_mm: params.selectedThickness_mm,
      selectedThickness_cm: mmToCm(params.selectedThickness_mm),
      mass_kg_per_m2,
      cost_per_m2: costPerM2FromMaterial(params.material, params.selectedThickness_mm),
      structuralLoad_kPa: structuralLoadKPaFromKgM2(mass_kg_per_m2),
    },
    workload: {
      sourceCount: params.sources.length,
      totalWorkload,
      totalUseWeightedWorkload,
      maxWorkloadHoursPerWeek: Math.max(0, ...params.sources.map((source) => source.workloadHoursPerWeek ?? 0)),
    },
  };
}
