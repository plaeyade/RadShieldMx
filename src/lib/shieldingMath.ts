// Funciones puras de cálculo de blindaje — extraídas de useShieldingEngine para testabilidad
// Todas las fórmulas referenciadas contra NCRP 147, 151, AAPM TG 108

import {
  type Barrier,
  type CalculationComparison,
  type CalculationTrace,
  type RadiationSource,
  type ShieldingMaterial,
  WORKLOAD_DISTRIBUTIONS
} from '@/types/radshield';
import { type CTIsodosisProfile, getCTIsodosisFactor, DEFAULT_CT_ISODOSIS } from '@/types/ctIsodosis';
import { normalizeCalculationUnits, type NormalizedCalculationUnits } from './unitNormalization';

export const SAMPLING_DISTANCE_M = 0.3;
export const SAMPLING_SPACING_M = 0.2;

export interface CalculationInputWarning {
  field: string;
  severity: 'warning' | 'error';
  message: string;
}

export function isFinitePositive(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value) && value > 0;
}

export function clampTransmission(value: number): number {
  if (!Number.isFinite(value)) return 0;
  if (value < 0) return 0;
  if (value > 1) return 1;
  return value;
}

export function getCalculationInputWarnings(input: Record<string, unknown>): CalculationInputWarning[] {
  const warnings: CalculationInputWarning[] = [];
  const positiveFields = [
    'distance_m',
    'scale_m_per_pixel',
    'workloadValue',
    'designGoal_mSv',
    'unshieldedKerma_mSv',
    'thickness_mm',
    'density',
  ];

  for (const field of positiveFields) {
    if (field in input && !isFinitePositive(input[field])) {
      warnings.push({
        field,
        severity: 'error',
        message: `${field} must be a finite positive number before release calculations.`,
      });
    }
  }

  if ('transmission' in input) {
    const transmission = input.transmission;
    if (typeof transmission !== 'number' || !Number.isFinite(transmission) || transmission < 0 || transmission > 1) {
      warnings.push({
        field: 'transmission',
        severity: 'warning',
        message: 'transmission should be finite and bounded between 0 and 1.',
      });
    }
  }

  return warnings;
}

export function getShieldingEnergyKey(source?: RadiationSource): string {
  if (!source) return 'unknown';
  const modality = source.modality;
  if (modality.energyLabel?.includes('511')) return '511keV';
  if (modality.energyLabel?.includes('140')) return '140keV';
  if (modality.energyLabel?.includes('364')) return '364keV';
  if (modality.id === 'gamma-knife') return 'Co60';
  if (modality.id === 'hdr-192ir') return 'Ir192';
  if (modality.energy_MeV && Number.isFinite(modality.energy_MeV)) {
    return `${Math.round(modality.energy_MeV)}MV`;
  }
  const match = modality.id.match(/(\d+)\s*mv/i) || modality.id.match(/-(\d+)mv/i);
  if (match?.[1]) return `${match[1]}MV`;
  return String(Math.round(modality.energy_MeV || 6));
}

export function getShieldingFormulaId(source?: RadiationSource): string {
  const category = source?.modality.category;
  if (source?.modality.id === 'ct-head' || source?.modality.id === 'ct-body') return 'NCRP147_CT_DLP_ISODOSE';
  if (category === 'diagnostic') return 'NCRP147_ARCHER';
  if (category === 'therapy') return 'NCRP151_TVL';
  if (category === 'nuclear') return 'AAPM_TG108_POINT_KERNEL';
  if (category === 'cyclotron') return 'IAEA_SRS47_ENGINEERING_SCREEN';
  return 'RADSHIELD_GENERIC_POINT_KERNEL';
}

export function getShieldingStandard(source?: RadiationSource): string {
  if (source?.modality.standard) return source.modality.standard;
  const category = source?.modality.category;
  if (category === 'diagnostic') return 'NCRP147';
  if (category === 'therapy') return 'NCRP151';
  if (category === 'nuclear') return 'AAPM_TG108';
  if (category === 'cyclotron') return 'IAEA_SRS47';
  return 'RADSHIELD_INTERNAL';
}

export function getShieldingCitationIds(source?: RadiationSource): string[] {
  const category = source?.modality.category;
  const ids = new Set<string>();
  if (category === 'diagnostic') ids.add('NCRP-147');
  if (category === 'therapy') ids.add('NCRP-151');
  if (category === 'nuclear') ids.add('AAPM-TG-108');
  if (category === 'cyclotron') ids.add('IAEA-SRS-47');
  if ((source?.modality.energy_MeV || 0) > 10) ids.add('NCRP-151-neutrons');
  if (!ids.size) ids.add('RadShield-method-note');
  return [...ids];
}

export function getCalculationAuditWarnings(params: {
  barrier: Barrier;
  sources: RadiationSource[];
  scale_m_per_pixel: number;
  maxKerma_mSv_per_wk: number;
  materialCount: number;
  samplePointCount: number;
  materials?: ShieldingMaterial[];
  energyKey?: string;
  minSourceDistance_m?: number;
}): CalculationInputWarning[] {
  const primarySource = params.sources[0];
  const warnings = getCalculationInputWarnings({
    scale_m_per_pixel: params.scale_m_per_pixel,
    designGoal_mSv: params.barrier.designGoal_mSv_per_wk,
    unshieldedKerma_mSv: params.maxKerma_mSv_per_wk > 0 ? params.maxKerma_mSv_per_wk : 1,
  });

  if (!params.sources.length) {
    warnings.push({ field: 'sources', severity: 'error', message: 'No radiation source is available for shielding calculation.' });
  }
  if (!params.samplePointCount) {
    warnings.push({ field: 'samplePointCount', severity: 'error', message: 'No barrier sample points were generated; check scale and barrier geometry.' });
  }
  if (!params.materialCount) {
    warnings.push({ field: 'materials', severity: 'error', message: 'No shielding materials were available for thickness calculation.' });
  }
  if (params.barrier.occupancyFactor <= 0 || params.barrier.occupancyFactor > 1 || !Number.isFinite(params.barrier.occupancyFactor)) {
    warnings.push({ field: 'occupancyFactor', severity: 'error', message: 'Occupancy factor T must be finite and within 0 < T <= 1.' });
  }
  if (params.barrier.useFactor < 0 || params.barrier.useFactor > 1 || !Number.isFinite(params.barrier.useFactor)) {
    warnings.push({ field: 'useFactor', severity: 'warning', message: 'Use factor U is outside the expected 0..1 range.' });
  }
  if (primarySource && (primarySource.modality.energy_MeV || 0) > 10) {
    warnings.push({ field: 'energy_MeV', severity: 'warning', message: 'Energy >10 MV: neutron shielding and maze/door checks are required.' });
  }
  if (primarySource && !primarySource.modality.standard) {
    warnings.push({ field: 'standard', severity: 'warning', message: 'Source modality has no explicit standard; inferred standard was used.' });
  }
  if (params.maxKerma_mSv_per_wk <= 0) {
    warnings.push({ field: 'maxKerma_mSv_per_wk', severity: 'warning', message: 'Maximum kerma is zero; verify source workload, scale and geometry.' });
  }
  if (Number.isFinite(params.minSourceDistance_m) && (params.minSourceDistance_m ?? Infinity) < SAMPLING_DISTANCE_M) {
    warnings.push({ field: 'distance_m', severity: 'warning', message: `Distance less than ${SAMPLING_DISTANCE_M} m: verify nearest occupancy and barrier sampling point.` });
  }

  for (const material of params.materials ?? []) {
    if (!Number.isFinite(material.density) || material.density <= 0) {
      warnings.push({ field: `material.${material.code}.density`, severity: 'warning', message: `Material ${material.code} has no validated positive density.` });
    }
    const energyKey = params.energyKey || getShieldingEnergyKey(primarySource);
    const hasTvl = Boolean(material.TVL_mm?.[energyKey]);
    const needsTvl = primarySource?.modality.category !== 'diagnostic';
    if (needsTvl && !hasTvl) {
      warnings.push({ field: `material.${material.code}.TVL`, severity: 'warning', message: `TVL not versioned for ${material.code} at ${energyKey}; fallback or alternate evidence may be used.` });
    }
  }

  warnings.push({
    field: 'clinicalReview',
    severity: 'warning',
    message: 'Preliminary shielding result: requires RSO/qualified medical physicist review before clinical or regulatory use.',
  });

  return warnings;
}

export function buildCalculationTrace(params: {
  barrier: Barrier;
  sources: RadiationSource[];
  scale_m_per_pixel: number;
  maxKerma_mSv_per_wk: number;
  requiredThickness_mm: Record<string, number>;
  samplePointCount: number;
}): CalculationTrace {
  const primarySource = params.sources[0];
  const category = primarySource?.modality.category || 'unknown';
  const energyKey = getShieldingEnergyKey(primarySource);
  const assumptions = [
    'Point-kernel screening calculation for design iteration.',
    `Sampling offset ${SAMPLING_DISTANCE_M} m from barrier face.`,
    `Sampling spacing ${SAMPLING_SPACING_M} m along barrier.`,
    'Final clinical acceptance requires qualified expert review and measurement survey.',
  ];
  if ((primarySource?.modality.energy_MeV || 0) > 10) assumptions.push('High-energy photon mode requires neutron and maze/door evaluation.');
  const finiteThicknesses = Object.values(params.requiredThickness_mm).filter((value) => Number.isFinite(value) && value >= 0);

  return {
    formulaId: getShieldingFormulaId(primarySource),
    standard: getShieldingStandard(primarySource),
    modalityCategory: category,
    energyKey,
    sourceCount: params.sources.length,
    materialCount: Object.keys(params.requiredThickness_mm).length,
    samplePointCount: params.samplePointCount,
    assumptions,
    citationIds: getShieldingCitationIds(primarySource),
    inputs: {
      barrierId: params.barrier.id,
      barrierType: params.barrier.barrierType,
      materialCode: params.barrier.materialCode,
      scale_m_per_pixel: params.scale_m_per_pixel,
      designGoal_mSv_per_wk: params.barrier.designGoal_mSv_per_wk,
      occupancyFactor: params.barrier.occupancyFactor,
      useFactor: params.barrier.useFactor,
    },
    outputs: {
      maxKerma_mSv_per_wk: params.maxKerma_mSv_per_wk,
      materialCount: Object.keys(params.requiredThickness_mm).length,
      minRequiredThickness_mm: finiteThicknesses.length ? Math.min(...finiteThicknesses) : 0,
      maxRequiredThickness_mm: finiteThicknesses.length ? Math.max(...finiteThicknesses) : 0,
    },
  };
}

export function buildCalculationUnitSnapshot(params: {
  barrier: Barrier;
  sources: RadiationSource[];
  material?: ShieldingMaterial;
  scale_m_per_pixel: number;
  maxKerma_mSv_per_wk: number;
  selectedThickness_mm: number;
  minSourceDistance_m: number;
}): NormalizedCalculationUnits {
  return normalizeCalculationUnits({
    barrier: params.barrier,
    sources: params.sources,
    material: params.material,
    scale_m_per_pixel: params.scale_m_per_pixel,
    maxKerma_mSv_per_wk: params.maxKerma_mSv_per_wk,
    selectedThickness_mm: params.selectedThickness_mm,
    sampleOffset_m: SAMPLING_DISTANCE_M,
    minSourceDistance_m: params.minSourceDistance_m,
  });
}

export function buildConservativeCalculationComparison(params: {
  baseThickness_mm: number;
  maxKerma_mSv_per_wk: number;
  designGoal_mSv_per_wk: number;
  material: ShieldingMaterial;
  energyKey: string;
}): CalculationComparison {
  const conservativeGoal = params.designGoal_mSv_per_wk * 0.8;
  const conservativeThickness_mm = tvlThickness(
    params.maxKerma_mSv_per_wk,
    conservativeGoal,
    params.material,
    params.energyKey,
  );
  const baseThickness_mm = Math.max(0, params.baseThickness_mm || 0);
  const delta_mm = Math.max(0, conservativeThickness_mm - baseThickness_mm);
  const deltaPercent = baseThickness_mm > 0 ? (delta_mm / baseThickness_mm) * 100 : 0;
  return {
    method: 'base-vs-conservative',
    baseThickness_mm,
    conservativeThickness_mm,
    delta_mm,
    deltaPercent,
    dominant: conservativeThickness_mm > baseThickness_mm ? 'conservative' : 'base',
    note: 'Conservative check applies 20% lower design goal as a screening margin; it does not replace formal NCRP/IAEA review.',
  };
}

// ───────────────────────────────────────────────────────────────
// NCRP 147 — Archer Equation (Diagnostic X-ray)
// B(x) = [(1+β/α)·exp(αγx/cosθ) − β/α]^(−1/γ)
// ───────────────────────────────────────────────────────────────
export function archerTransmission(
  thickness_mm: number,
  material: ShieldingMaterial,
  theta_rad: number = 0
): number {
  if (thickness_mm <= 0) return 1.0;
  if (!material.archerAlpha || !material.archerBeta || !material.archerGamma) {
    const hvl = Object.values(material.HVL_mm || {})[0] || material.TVL_mm?.['6MV'] || 100;
    if (hvl <= 0) return 1;
    return clampTransmission(Math.exp(-0.693 * (thickness_mm / hvl) / Math.max(0.01, Math.cos(theta_rad))));
  }
  const x_cm = thickness_mm / 10;
  const cos_theta = Math.max(0.01, Math.cos(theta_rad));
  const exponent = (material.archerAlpha * material.archerGamma * x_cm) / cos_theta;
  const inner = (1 + material.archerBeta / material.archerAlpha) * Math.exp(exponent) - material.archerBeta / material.archerAlpha;
  if (inner <= 0) return 0;
  return clampTransmission(Math.pow(inner, -1 / material.archerGamma));
}

// Inversa de Archer — encuentra espesor para transmisión objetivo
export function inverseArcher(
  targetTransmission: number,
  material: ShieldingMaterial,
  theta_rad: number = 0,
  tolerance: number = 1e-14,
  maxIter: number = 100
): number {
  if (targetTransmission >= 1.0) return 0;
  if (targetTransmission <= 0) return 500;
  let low = 0, high = 500, iter = 0;
  while (archerTransmission(high, material, theta_rad) > targetTransmission && iter < 20) {
    high *= 2;
    iter++;
  }
  for (let i = 0; i < maxIter; i++) {
    const mid = (low + high) / 2;
    const B_mid = archerTransmission(mid, material, theta_rad);
    if (Math.abs(B_mid - targetTransmission) < tolerance) return mid;
    if (B_mid > targetTransmission) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// ───────────────────────────────────────────────────────────────
// NCRP 151 — TVL forward transmission (therapy / nuclear gamma)
// B(x) = 10^(−x/TVL)   —  exact exponential in base-10
// ───────────────────────────────────────────────────────────────
export function tvlTransmission(
  thickness_mm: number,
  material: ShieldingMaterial,
  energyKey: string
): number {
  if (thickness_mm <= 0) return 1.0;
  const tvl = material.TVL_mm?.[energyKey];
  if (!tvl || tvl <= 0) {
    // Fallback: estimate from density
    const refTVL = 350;
    const refDensity = 2.35;
    const estTVL = refTVL * (refDensity / material.density);
    return clampTransmission(Math.pow(10, -thickness_mm / estTVL));
  }
  return clampTransmission(Math.pow(10, -thickness_mm / tvl));
}
export function tvlThickness(
  unshieldedKerma_mSv: number,
  designGoal_mSv: number,
  material: ShieldingMaterial,
  energyKey: string
): number {
  if (unshieldedKerma_mSv <= designGoal_mSv) return 0;
  const tvl = material.TVL_mm?.[energyKey];
  if (!tvl || tvl <= 0) {
    const refTVL = 350;
    const refDensity = 2.35;
    const estTVL = refTVL * (refDensity / material.density);
    const n = Math.log10(unshieldedKerma_mSv / designGoal_mSv);
    return n * estTVL;
  }
  const n = Math.log10(unshieldedKerma_mSv / designGoal_mSv);
  return n * tvl;
}

// ───────────────────────────────────────────────────────────────
// Exponential attenuation (Nuclear medicine / Gamma)
// K = Γ·A/d²  →  x = ln(K_unshielded/K_design) · TVL/ln(10)
// ───────────────────────────────────────────────────────────────
export function exponentialThickness(
  unshieldedKerma_mSv: number,
  designGoal_mSv: number,
  material: ShieldingMaterial,
  energyKey: string
): number {
  if (unshieldedKerma_mSv <= designGoal_mSv) return 0;
  const tvl = material.TVL_mm?.[energyKey];
  const hvl = material.HVL_mm?.[energyKey];
  if (!tvl && !hvl) {
    const refTVL = 170;
    const refDensity = 2.35;
    const estTVL = refTVL * (refDensity / material.density);
    const n = Math.log10(unshieldedKerma_mSv / designGoal_mSv);
    return n * estTVL;
  }
  const attenuationLength = tvl ? tvl / Math.log(10) : (hvl! / Math.log(2));
  if (attenuationLength <= 0) return 0;
  return Math.log(unshieldedKerma_mSv / designGoal_mSv) * attenuationLength;
}

// ───────────────────────────────────────────────────────────────
// NCRP 147 §5.6 — CT-DLP Method
// K(θ,d) = DLP × f(θ) × (100cm/d)^1.5
// ───────────────────────────────────────────────────────────────
export function calculateCTKerma(
  source: RadiationSource,
  pointX: number,
  pointY: number,
  scale_m_per_pixel: number,
  isodosisProfile?: CTIsodosisProfile
): number {
  const dx = (pointX - source.x) * scale_m_per_pixel;
  const dy = (pointY - source.y) * scale_m_per_pixel;
  const dz = source.isocenterHeight_m;
  const d_cm = Math.sqrt(dx * dx + dy * dy + dz * dz) * 100;
  if (d_cm < 10) return 1e6;

  const angle_rad = Math.atan2(dy, dx);
  const angle_deg = ((angle_rad * 180 / Math.PI) + 360) % 360;

  const dlp = source.ctDLP_mGy_cm || source.modality.doseRateConstant;
  const scansPerPatient = source.ctScansPerPatient || 1;
  const patientsPerWeek = source.workloadValue;

  const profile = isodosisProfile || DEFAULT_CT_ISODOSIS;
  const fTheta = getCTIsodosisFactor(profile, angle_deg);

  const distanceFactor = Math.pow(100 / d_cm, 1.5);
  return dlp * fTheta * distanceFactor * patientsPerWeek * scansPerPatient;
}

// ───────────────────────────────────────────────────────────────
// AAPM TG 108 / IAEA SRS 47 — Nuclear medicine exponential
// K = Γ · A / d²
// ───────────────────────────────────────────────────────────────
export function calculateNuclearKerma(
  source: RadiationSource,
  pointX: number,
  pointY: number,
  scale_m_per_pixel: number
): number {
  const dx = (pointX - source.x) * scale_m_per_pixel;
  const dy = (pointY - source.y) * scale_m_per_pixel;
  const dz = source.isocenterHeight_m;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d < 0.1) return 1e6;

  const gamma = source.modality.doseRateConstant; // μSv·m²/GBq·h
  const activity_GBq = source.nuclearActivity_GBq || source.workloadValue;
  const hoursPerWeek = source.workloadHoursPerWeek || 40;

  return (gamma * activity_GBq * hoursPerWeek) / (d * d);
}

// ───────────────────────────────────────────────────────────────
// Main unshielded kerma — dispatcher por modalidad
// ───────────────────────────────────────────────────────────────
export function calculateUnshieldedKerma(
  source: RadiationSource,
  pointX: number,
  pointY: number,
  scale_m_per_pixel: number,
  ctIsodosisProfile?: CTIsodosisProfile
): number {
  const mod = source.modality;

  if (mod.id === 'ct-head' || mod.id === 'ct-body') {
    return calculateCTKerma(source, pointX, pointY, scale_m_per_pixel, ctIsodosisProfile);
  }

  if (mod.category === 'nuclear' || mod.category === 'cyclotron') {
    return calculateNuclearKerma(source, pointX, pointY, scale_m_per_pixel);
  }

  const dx = (pointX - source.x) * scale_m_per_pixel;
  const dy = (pointY - source.y) * scale_m_per_pixel;
  const dz = source.isocenterHeight_m;
  const d = Math.sqrt(dx * dx + dy * dy + dz * dz);
  if (d < 0.1) return 1e6;

  if (mod.category === 'diagnostic') {
    const wl = WORKLOAD_DISTRIBUTIONS.find(w => w.name === mod.workloadDistribution);
    const K1 = wl ? wl.K1 : mod.doseRateConstant;
    const N = source.workloadValue;
    if (mod.id.includes('fluoro') && source.workloadHoursPerWeek) {
      const kermaRate = K1 / 3;
      return kermaRate * source.workloadHoursPerWeek * N / (d * d);
    }
    return K1 * N / (d * d);
  }

  if (mod.category === 'therapy') {
    if (mod.id === 'gamma-knife') {
      const fractionsPerWeek = source.workloadValue;
      const dosePerFraction_Gy = 15;
      return dosePerFraction_Gy * fractionsPerWeek * source.useFactor / (d * d) * 1000; // mSv/week
    }
    if (mod.id === 'hdr-192ir' || mod.id === 'ldr-cs137') {
      const gamma = mod.doseRateConstant;
      const hoursPerWeek = source.workloadHoursPerWeek || 40;
      const activity_Ci = source.workloadValue;
      return (gamma * activity_Ci * 37 * hoursPerWeek) / (d * d * 100);
    }
    const fractionsPerWeek = source.workloadValue;
    const dosePerFraction_Gy = 2.0;
    return dosePerFraction_Gy * fractionsPerWeek * source.useFactor / (d * d) * 1000; // convert Gy → mSv
  }

  return 0;
}

// ───────────────────────────────────────────────────────────────
// Sampling points along barrier (perpendicular offset)
// ───────────────────────────────────────────────────────────────
export function generateSamplePoints(barrier: Barrier, scale_m_per_pixel: number): { x: number; y: number }[] {
  const dx = barrier.x2 - barrier.x1;
  const dy = barrier.y2 - barrier.y1;
  const length = Math.sqrt(dx * dx + dy * dy);
  const length_m = length * scale_m_per_pixel;
  if (length_m < 0.1) return [];

  const nx = -dy / length;
  const ny = dx / length;
  const offset_pixels = SAMPLING_DISTANCE_M / scale_m_per_pixel;
  const numPoints = Math.max(2, Math.ceil(length_m / SAMPLING_SPACING_M) + 1);

  const points: { x: number; y: number }[] = [];
  for (let i = 0; i < numPoints; i++) {
    const t = i / (numPoints - 1);
    points.push({
      x: barrier.x1 + t * dx + nx * offset_pixels,
      y: barrier.y1 + t * dy + ny * offset_pixels
    });
  }
  return points;
}

// ───────────────────────────────────────────────────────────────
// Rounding rules by material code (construction standards)
// ───────────────────────────────────────────────────────────────
export function roundThickness(thickness_mm: number, materialCode: string): number {
  if (materialCode === 'PB') {
    const increment = 0.79375; // 1/32 inch in mm
    return Math.ceil(thickness_mm / increment) * increment;
  }
  if (materialCode.startsWith('NIPOL') || materialCode.startsWith('CONCRETE') || materialCode.startsWith('NELCO') || materialCode.startsWith('VERITAS')) {
    return Math.ceil(thickness_mm / 5) * 5; // 5 mm increments
  }
  if (materialCode === 'GYPSUM' || materialCode === 'BRICK') {
    return Math.ceil(thickness_mm / 10) * 10; // 10 mm increments
  }
  if (materialCode === 'STEEL') {
    return Math.ceil(thickness_mm / 1) * 1; // 1 mm increments
  }
  if (materialCode === 'LEADGLASS') {
    return Math.ceil(thickness_mm / 0.5) * 0.5; // 0.5 mm increments
  }
  return Math.ceil(thickness_mm); // Default: round up to nearest mm
}

// ───────────────────────────────────────────────────────────────
// Heatmap grid — IDW interpolation (for visualization only)
// ───────────────────────────────────────────────────────────────
export function calculateHeatmapGrid(
  sources: RadiationSource[],
  scale_m_per_pixel: number,
  gridSize: number = 50,
  ctIsodosisProfile?: CTIsodosisProfile
): { x: number; y: number; kerma: number }[] {
  if (!sources.length) return [];

  let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;
  for (const s of sources) {
    minX = Math.min(minX, s.x - 200);
    minY = Math.min(minY, s.y - 200);
    maxX = Math.max(maxX, s.x + 200);
    maxY = Math.max(maxY, s.y + 200);
  }

  const points: { x: number; y: number; kerma: number }[] = [];
  for (let gx = minX; gx <= maxX; gx += gridSize) {
    for (let gy = minY; gy <= maxY; gy += gridSize) {
      let totalKerma = 0;
      for (const source of sources) {
        totalKerma += calculateUnshieldedKerma(source, gx, gy, scale_m_per_pixel, ctIsodosisProfile);
      }
      points.push({ x: gx, y: gy, kerma: totalKerma });
    }
  }
  return points;
}
