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

export interface UnitNormalizationWarning {
  field: string;
  severity: 'warning' | 'error';
  message: string;
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

function closeEnough(a: number, b: number, tolerance: number): boolean {
  return Number.isFinite(a) && Number.isFinite(b) && Math.abs(a - b) <= tolerance;
}

export function validateNormalizedCalculationUnits(snapshot: NormalizedCalculationUnits): UnitNormalizationWarning[] {
  const warnings: UnitNormalizationWarning[] = [];
  const requiredPositive: Array<[string, number]> = [
    ['length.scale_m_per_pixel', snapshot.length.scale_m_per_pixel],
    ['length.barrierLength_m', snapshot.length.barrierLength_m],
    ['dose.designGoal_mSv_per_wk', snapshot.dose.designGoal_mSv_per_wk],
    ['material.density_g_cm3', snapshot.material.density_g_cm3],
  ];

  for (const [field, value] of requiredPositive) {
    if (!Number.isFinite(value) || value <= 0) {
      warnings.push({ field, severity: 'error', message: `${field} must be finite and positive for release-facing calculations.` });
    }
  }

  if (!closeEnough(snapshot.material.selectedThickness_cm, mmToCm(snapshot.material.selectedThickness_mm), 1e-6)) {
    warnings.push({ field: 'material.selectedThickness_cm', severity: 'error', message: 'Thickness cm/mm conversion mismatch.' });
  }
  if (!closeEnough(snapshot.material.density_kg_m3, gCm3ToKgM3(snapshot.material.density_g_cm3), 1e-6)) {
    warnings.push({ field: 'material.density_kg_m3', severity: 'error', message: 'Density g/cm3 to kg/m3 conversion mismatch.' });
  }
  const expectedMass = kgM2FromDensityThickness(snapshot.material.density_g_cm3, snapshot.material.selectedThickness_mm);
  if (!closeEnough(snapshot.material.mass_kg_per_m2, expectedMass, 1e-6)) {
    warnings.push({ field: 'material.mass_kg_per_m2', severity: 'error', message: 'Mass per area does not match density and thickness.' });
  }
  const expectedLoad = structuralLoadKPaFromKgM2(snapshot.material.mass_kg_per_m2);
  if (!closeEnough(snapshot.material.structuralLoad_kPa, expectedLoad, 1e-6)) {
    warnings.push({ field: 'material.structuralLoad_kPa', severity: 'error', message: 'Structural load does not match mass per area.' });
  }
  if (snapshot.material.selectedThickness_mm < 0) {
    warnings.push({ field: 'material.selectedThickness_mm', severity: 'error', message: 'Negative shielding thickness is not valid.' });
  }
  if (snapshot.material.selectedThickness_mm === 0 && snapshot.dose.maxKerma_mSv_per_wk > snapshot.dose.designGoal_mSv_per_wk) {
    warnings.push({ field: 'material.selectedThickness_mm', severity: 'warning', message: 'Zero thickness with kerma above design goal requires review.' });
  }
  if (!Number.isFinite(snapshot.dose.maxKerma_uSv_per_h_40h) || snapshot.dose.maxKerma_uSv_per_h_40h < 0) {
    warnings.push({ field: 'dose.maxKerma_uSv_per_h_40h', severity: 'error', message: 'Dose-rate normalization to uSv/h is invalid.' });
  }

  return warnings;
}
