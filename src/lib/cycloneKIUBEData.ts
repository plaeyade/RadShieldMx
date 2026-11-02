// ═══════════════════════════════════════════════════════════════════════════════
// Cyclone KIUBE Site Requirement Guide — Extracted Data (MID 55672 Rev G)
// IBA Ion Beam Applications SA — Site Requirement Guide
// ═══════════════════════════════════════════════════════════════════════════════

export interface CycloneKIUBEModel {
  model: string;
  protonEnergy_MeV: number;
  maxBeamCurrent_uA: number;
  maxBeamCurrent_dual_uA?: number; // dual beam: 2x half current
  weight_kg: number;
  dimensions_mm: { width: number; depth: number; height: number };
  pillarFootprint_mm: { width: number; depth: number };
  weightOnFloor_kg_cm2: number;
}

export interface CycloneKIUBEDoseRate {
  model: string;
  beamMode: 'single' | 'dual';
  at0deg_uSv_h: number;       // in front of target
  at90deg_uSv_h: number;      // perpendicular wall
  at180deg_uSv_h: number;    // opposite wall
}

export interface CycloneKIUBEShielding {
  concreteThickness_cm: number;
  concreteDensity_kg_m3: number;
  roofThickness_cm: number;
  doseRate_KIUBE100_uSv_h: number;
  doseRate_KIUBE150_uSv_h: number;
  doseRate_KIUBE180_uSv_h: number;
  doseRate_KIUBE300_uSv_h: number;
}

export interface CycloneKIUBENeutronData {
  reaction: string;
  maxNeutronEnergy_MeV: number;
  neutronEnergyPeak_MeV: number;
  fluence_n_per_p: number;      // neutrons per proton
  fluence_at40uA_n_per_s: number; // for 40 µA beam on 18O(p,n)18F
  gammaFluence_g_per_p: number;
}

export interface CycloneKIUBEVault {
  internalDimensions_min_mm: { length: number; width: number };
  internalDimensions_rec_mm: { length: number; width: number };
  height_mm: number;
  wallThicknessTotal_mm: number;     // 2000-2400
  roofThickness_mm: number;          // 1700-2300
  concreteDensity_kg_m3: number;
  doorMinWidth_mm: number;
  doorMinHeight_mm: number;
  pitDepth_mm: number;
  floorLevelTolerance_mm: number;
}

export interface CycloneKIUBERooms {
  powerSupplyRoom_min_mm: { length: number; width: number; height: number };
  controlRoom_window_mm: { width: number; height: number };
  heatExchangerRoom_doorMin_mm: number;
  heatExchangerRoom_wallMin_mm: number; // concrete thickness
  lobby_access: string;
}

export interface CycloneKIUBERadionuclide {
  isotope: string;
  targetType: 'liquid' | 'gas' | 'solid';
  standardProduction: boolean;
  halfLife_min?: number;
}

// ─────────────────────────────────────────────────────────
// MODELS
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_MODELS: CycloneKIUBEModel[] = [
  { model: 'Cyclone KIUBE 100', protonEnergy_MeV: 18, maxBeamCurrent_uA: 100, weight_kg: 18000, dimensions_mm: { width: 2000, depth: 2000, height: 1850 }, pillarFootprint_mm: { width: 220, depth: 220 }, weightOnFloor_kg_cm2: 10 },
  { model: 'Cyclone KIUBE 150', protonEnergy_MeV: 18, maxBeamCurrent_uA: 150, maxBeamCurrent_dual_uA: 75, weight_kg: 18000, dimensions_mm: { width: 2000, depth: 2000, height: 1850 }, pillarFootprint_mm: { width: 220, depth: 220 }, weightOnFloor_kg_cm2: 10 },
  { model: 'Cyclone KIUBE 180', protonEnergy_MeV: 18, maxBeamCurrent_uA: 180, maxBeamCurrent_dual_uA: 100, weight_kg: 18000, dimensions_mm: { width: 2000, depth: 2000, height: 1850 }, pillarFootprint_mm: { width: 220, depth: 220 }, weightOnFloor_kg_cm2: 10 },
  { model: 'Cyclone KIUBE 300', protonEnergy_MeV: 18, maxBeamCurrent_uA: 300, maxBeamCurrent_dual_uA: 150, weight_kg: 18000, dimensions_mm: { width: 2000, depth: 2000, height: 1850 }, pillarFootprint_mm: { width: 220, depth: 220 }, weightOnFloor_kg_cm2: 10 },
];

// ─────────────────────────────────────────────────────────
// DOSE RATES (Table 8) — Inside vault at 1m from cyclotron
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_DOSE_RATES: CycloneKIUBEDoseRate[] = [
  { model: 'KIUBE 100', beamMode: 'single', at0deg_uSv_h: 1.18e8, at90deg_uSv_h: 0.2e8, at180deg_uSv_h: 0.27e8 },
  { model: 'KIUBE 150', beamMode: 'dual', at0deg_uSv_h: 0.9e8, at90deg_uSv_h: 0.2e8, at180deg_uSv_h: 0.41e8 },
  { model: 'KIUBE 180', beamMode: 'dual', at0deg_uSv_h: 1.2e8, at90deg_uSv_h: 0.27e8, at180deg_uSv_h: 0.41e8 },
  { model: 'KIUBE 300', beamMode: 'dual', at0deg_uSv_h: 1.8e8, at90deg_uSv_h: 0.5e8, at180deg_uSv_h: 0.6e8 },
];

// ─────────────────────────────────────────────────────────
// SHIELDING — Dose rate after concrete thickness (Table 9)
// Concrete density: 2350 kg/m³
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_SHIELDING: CycloneKIUBEShielding[] = [
  { concreteThickness_cm: 200, concreteDensity_kg_m3: 2350, roofThickness_cm: 170, doseRate_KIUBE100_uSv_h: 3.20, doseRate_KIUBE150_uSv_h: 2.71, doseRate_KIUBE180_uSv_h: 3.62, doseRate_KIUBE300_uSv_h: 5.43 },
  { concreteThickness_cm: 220, concreteDensity_kg_m3: 2350, roofThickness_cm: 190, doseRate_KIUBE100_uSv_h: 0.77, doseRate_KIUBE150_uSv_h: 0.59, doseRate_KIUBE180_uSv_h: 0.79, doseRate_KIUBE300_uSv_h: 1.19 },
  { concreteThickness_cm: 230, concreteDensity_kg_m3: 2350, roofThickness_cm: 200, doseRate_KIUBE100_uSv_h: 0.36, doseRate_KIUBE150_uSv_h: 0.30, doseRate_KIUBE180_uSv_h: 0.40, doseRate_KIUBE300_uSv_h: 0.60 },
];

// ─────────────────────────────────────────────────────────
// NEUTRON DATA (Section 2.1.8.4)
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_NEUTRON: CycloneKIUBENeutronData = {
  reaction: '18O(p,n)18F',
  maxNeutronEnergy_MeV: 15,
  neutronEnergyPeak_MeV: 2,
  fluence_n_per_p: 6.9e-3,
  fluence_at40uA_n_per_s: 3.55e11,
  gammaFluence_g_per_p: 8.3e-3,
};

// ─────────────────────────────────────────────────────────
// VAULT REQUIREMENTS
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_VAULT: CycloneKIUBEVault = {
  internalDimensions_min_mm: { length: 3800, width: 3800 },
  internalDimensions_rec_mm: { length: 4000, width: 4000 },
  height_mm: 2500,
  wallThicknessTotal_mm: 2200,    // mid-range of 2000-2400
  roofThickness_mm: 2000,         // mid-range of 1700-2300
  concreteDensity_kg_m3: 2350,
  doorMinWidth_mm: 1000,
  doorMinHeight_mm: 2000,
  pitDepth_mm: 400,
  floorLevelTolerance_mm: 1,
};

// ─────────────────────────────────────────────────────────
// ROOMS
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_ROOMS: CycloneKIUBERooms = {
  powerSupplyRoom_min_mm: { length: 3200, width: 2700, height: 3000 },
  controlRoom_window_mm: { width: 1800, height: 800 },
  heatExchangerRoom_doorMin_mm: 800,
  heatExchangerRoom_wallMin_mm: 100,
  lobby_access: 'Cyclotron lobby with access to vault',
};

// ─────────────────────────────────────────────────────────
// RADIONUCLIDES (Section 2.1.8.3)
// ─────────────────────────────────────────────────────────
export const CYCLOONE_KIUBE_RADIONUCLIDES: CycloneKIUBERadionuclide[] = [
  { isotope: '18F-', targetType: 'liquid', standardProduction: true, halfLife_min: 109.8 },
  { isotope: '68Ga', targetType: 'liquid', standardProduction: true, halfLife_min: 67.7 },
  { isotope: '11C', targetType: 'gas', standardProduction: true, halfLife_min: 20.4 },
  { isotope: '15O2', targetType: 'gas', standardProduction: true, halfLife_min: 2.0 },
  { isotope: '13N', targetType: 'gas', standardProduction: true, halfLife_min: 10.0 },
  { isotope: '18F2', targetType: 'gas', standardProduction: true, halfLife_min: 109.8 },
  { isotope: '124I', targetType: 'solid', standardProduction: false, halfLife_min: 4.2 * 24 * 60 },
  { isotope: '123I', targetType: 'solid', standardProduction: false, halfLife_min: 13.2 * 60 },
  { isotope: '64Cu', targetType: 'solid', standardProduction: false, halfLife_min: 12.7 * 60 },
  { isotope: '89Zr', targetType: 'solid', standardProduction: false, halfLife_min: 78.4 * 60 },
  { isotope: '99mTc', targetType: 'solid', standardProduction: false, halfLife_min: 6.0 * 60 },
];

// ─────────────────────────────────────────────────────────
// CALCULATION FUNCTIONS
// ─────────────────────────────────────────────────────────

export interface CycloneConcreteThicknessResult {
  thickness_cm: number;
  interpolationUsed: boolean;
  /** El objetivo cae fuera del rango 200–230 cm de la Tabla 9: valor extrapolado (log-lineal). */
  extrapolated: boolean;
  /** Factor angular aplicado (tasa interna en la dirección / tasa a 0°); 1 a 0°. */
  directionFactor: number;
  /** Modelo de la Tabla 8 que se usó, o null si no se reconoció (se devuelve el máximo de la tabla). */
  model: string | null;
  notes: string[];
}

/**
 * Espesor de concreto (2350 kg/m³) para una tasa de dosis objetivo fuera del búnker KIUBE.
 *
 * Base: IBA Cyclone KIUBE Site Requirement Guide (MID 55672 Rev G), Tabla 9 (tasa tras 200, 220 y
 * 230 cm) interpolada log-linealmente, es decir, con atenuación exponencial entre puntos.
 *
 * Dirección: la Tabla 9 se toma como la dirección más desfavorable (0°, frente al blanco). Para
 * 90° y 180° el término fuente se escala con la razón de la Tabla 8 (tasa interna a 1 m en esa
 * dirección / tasa a 0°). Es una aproximación: a 90° y 180° el espectro es más blando y la
 * atenuación real es igual o mayor, así que el resultado sigue siendo conservador respecto a
 * esa hipótesis. Es un tamizaje de ingeniería; el diseño final se valida con Monte Carlo
 * (Cyclotron-SIM) y la revisión de un físico médico calificado.
 */
export function calculateCycloneConcreteThickness(
  model: string,
  targetDoseRate_uSv_h: number,
  direction: '0deg' | '90deg' | '180deg' = '0deg'
): CycloneConcreteThicknessResult {
  const notes: string[] = [];
  const normalizado = model.replace(/^\s*cyclone\s+/i, '').trim().toUpperCase();
  const doseData = CYCLOONE_KIUBE_DOSE_RATES.find(d => d.model.toUpperCase() === normalizado);
  const shieldingData = CYCLOONE_KIUBE_SHIELDING;
  if (!(targetDoseRate_uSv_h > 0) || !Number.isFinite(targetDoseRate_uSv_h)) {
    throw new RangeError('targetDoseRate_uSv_h debe ser positivo y finito');
  }
  if (!doseData) {
    notes.push(`Modelo «${model}» no reconocido: se usa el espesor máximo de la Tabla 9 sin interpolar.`);
    const max = shieldingData[shieldingData.length - 1].concreteThickness_cm;
    return { thickness_cm: max, interpolationUsed: false, extrapolated: false, directionFactor: 1, model: null, notes };
  }

  const directionFactor =
    direction === '90deg' ? doseData.at90deg_uSv_h / doseData.at0deg_uSv_h
    : direction === '180deg' ? doseData.at180deg_uSv_h / doseData.at0deg_uSv_h
    : 1;
  // Objetivo equivalente a 0°: la tabla describe la fuente a 0°.
  const objetivo = targetDoseRate_uSv_h / directionFactor;

  const key = `doseRate_${doseData.model.replace(' ', '')}_uSv_h` as keyof CycloneKIUBEShielding;
  const puntos = shieldingData.map(d => ({ x: d.concreteThickness_cm, D: d[key] as number }));

  // Tramo que contiene el objetivo; fuera del rango se extrapola con el tramo extremo.
  let i = puntos.findIndex(p => p.D <= objetivo);
  let extrapolated = false;
  if (i === -1) { i = puntos.length - 1; extrapolated = true; }
  else if (i === 0) {
    if (puntos[0].D === objetivo) {
      return { thickness_cm: puntos[0].x, interpolationUsed: false, extrapolated: false, directionFactor, model: doseData.model, notes };
    }
    i = 1; extrapolated = true;
  }
  const a = puntos[i - 1], b = puntos[i];
  const frac = Math.log(objetivo / a.D) / Math.log(b.D / a.D);
  const thickness = a.x + frac * (b.x - a.x);
  if (extrapolated) notes.push('Objetivo fuera del rango 200–230 cm de la Tabla 9: valor extrapolado, confirmar con Monte Carlo.');
  if (direction !== '0deg') notes.push(`Dirección ${direction}: término fuente escalado ×${directionFactor.toFixed(3)} (Tabla 8).`);

  return {
    thickness_cm: Math.ceil(thickness),
    interpolationUsed: true,
    extrapolated,
    directionFactor,
    model: doseData.model,
    notes,
  };
}

/** Calculate neutron TVL for concrete (empirical from IBA data) */
export function getNeutronTVLConcrete_KIUBE(): { TVL1_cm: number; TVLe_cm: number } {
  // From IBA data: 200-230 cm reduces dose from ~10^8 to <1 µSv/h
  // Approximate TVL for fast neutrons in concrete (2350 kg/m³)
  return { TVL1_cm: 25, TVLe_cm: 18 }; // First TVL ~25 cm, equilibrium ~18 cm
}

/** Calculate gamma TVL for concrete */
export function getGammaTVLConcrete_KIUBE(): number {
  // For capture gamma from neutron interactions
  return 22; // cm in concrete (2350 kg/m³)
}

/** Calculate total neutron fluence for given beam current */
export function calculateNeutronFluence_KIUBE(
  beamCurrent_uA: number,
  targetMaterial: string = '18O'
): { fluence_n_per_s: number; fluence_n_per_proton: number } {
  const protons_per_s = beamCurrent_uA * 1e-6 / (1.602e-19); // protons/second
  const n_per_p = targetMaterial === '18O' ? CYCLOONE_KIUBE_NEUTRON.fluence_n_per_p : 6.9e-3;
  return {
    fluence_n_per_s: protons_per_s * n_per_p,
    fluence_n_per_proton: n_per_p,
  };
}

/** Calculate decommissioning layer thickness recommendation */
export function calculateDecommissioningLayer_KIUBE(
  yearsOfOperation: number,
  beamCurrent_uA: number,
  operatingHoursPerYear: number = 4000
): { minThickness_cm: number; recommendedThickness_cm: number } {
  // Based on IBA recommendation: inner layer activation depth
  // Empirical: ~30-50 cm for typical PET cyclotron operation
  const activationFactor = (yearsOfOperation * operatingHoursPerYear * beamCurrent_uA) / (10 * 4000 * 100);
  const minThickness = Math.max(30, 30 * activationFactor);
  const recThickness = Math.max(50, 50 * activationFactor);
  return {
    minThickness_cm: Math.round(minThickness),
    recommendedThickness_cm: Math.round(recThickness),
  };
}

/** Get all KIUBE data as a summary object */
export function getKIUBESummary(model: string = 'KIUBE 180'): {
  model: CycloneKIUBEModel | undefined;
  doseRate: CycloneKIUBEDoseRate | undefined;
  vault: CycloneKIUBEVault;
  neutron: CycloneKIUBENeutronData;
  radionuclides: CycloneKIUBERadionuclide[];
} {
  return {
    model: CYCLOONE_KIUBE_MODELS.find(m => m.model.includes(model.replace('KIUBE ', ''))),
    doseRate: CYCLOONE_KIUBE_DOSE_RATES.find(d => d.model === model),
    vault: CYCLOONE_KIUBE_VAULT,
    neutron: CYCLOONE_KIUBE_NEUTRON,
    radionuclides: CYCLOONE_KIUBE_RADIONUCLIDES,
  };
}
