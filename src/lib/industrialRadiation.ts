// =============================================================================
// industrialRadiation.ts — Industrial Radiation Protection Module
// Industrial radiography, gauging, well-logging, NDT
// Based on: NCRP 144, IAEA RS-G-1.3, ISO 3999
// =============================================================================

export interface IndustrialSource {
  nuclide: string;
  name: string;
  halfLife_years: number;
  gammaEnergy_keV: number;
  gammaConstant_mSv_m2_GBq_h: number;
  activity_TBq: number; // typical industrial source
  HVL_steel_mm: number;
  HVL_concrete_mm: number;
  applications: string[];
  category: 'radiography' | 'gauging' | 'well_logging' | 'sterilization' | 'food_irradiation';
}

export const INDUSTRIAL_SOURCES: IndustrialSource[] = [
  { nuclide: 'Ir-192', name: 'Iridium-192', halfLife_years: 0.21, gammaEnergy_keV: 317, gammaConstant_mSv_m2_GBq_h: 0.130, activity_TBq: 4, HVL_steel_mm: 14, HVL_concrete_mm: 50, applications: ['Radiography (NDT)', 'Pipeline inspection', 'Welding QC'], category: 'radiography' },
  { nuclide: 'Co-60', name: 'Cobalt-60', halfLife_years: 5.27, gammaEnergy_keV: 1173, gammaConstant_mSv_m2_GBq_h: 0.308, activity_TBq: 0.4, HVL_steel_mm: 20, HVL_concrete_mm: 60, applications: ['Sterilization', 'Radiography thick steel', 'Food irradiation'], category: 'sterilization' },
  { nuclide: 'Cs-137', name: 'Cesium-137', halfLife_years: 30.0, gammaEnergy_keV: 662, gammaConstant_mSv_m2_GBq_h: 0.077, activity_TBq: 2, HVL_steel_mm: 18, HVL_concrete_mm: 55, applications: ['Level gauging', 'Density measurement', 'Thickness gauging'], category: 'gauging' },
  { nuclide: 'Am-241', name: 'Americium-241', halfLife_years: 432, gammaEnergy_keV: 59, gammaConstant_mSv_m2_GBq_h: 0.003, activity_TBq: 0.1, HVL_steel_mm: 0.4, HVL_concrete_mm: 8, applications: ['Smoke detectors', 'Moisture gauges', 'Ash analyzers'], category: 'gauging' },
  { nuclide: 'Se-75', name: 'Selenium-75', halfLife_years: 0.33, gammaEnergy_keV: 265, gammaConstant_mSv_m2_GBq_h: 0.202, activity_TBq: 3, HVL_steel_mm: 10, HVL_concrete_mm: 35, applications: ['Light alloy radiography', 'Aerospace NDT'], category: 'radiography' },
  { nuclide: 'Yb-169', name: 'Ytterbium-169', halfLife_years: 0.088, gammaEnergy_keV: 308, gammaConstant_mSv_m2_GBq_h: 0.125, activity_TBq: 0.5, HVL_steel_mm: 7, HVL_concrete_mm: 25, applications: ['Thin-wall radiography', 'Electronics NDT'], category: 'radiography' },
  { nuclide: 'Ra-226', name: 'Radium-226 (legacy)', halfLife_years: 1600, gammaEnergy_keV: 186, gammaConstant_mSv_m2_GBq_h: 0.069, activity_TBq: 0.01, HVL_steel_mm: 12, HVL_concrete_mm: 40, applications: ['Legacy well logging sources'], category: 'well_logging' },
  { nuclide: 'Pu-238', name: 'Plutonium-238', halfLife_years: 87.7, gammaEnergy_keV: 0, gammaConstant_mSv_m2_GBq_h: 0.0001, activity_TBq: 0.5, HVL_steel_mm: 0.1, HVL_concrete_mm: 1, applications: ['Neutron well logging (α,n)'], category: 'well_logging' },
];

export interface ControlZone {
  name: string;
  nameEs: string;
  distanceLimit_m: number;
  doseRateLimit_uSv_h: number;
  boundaryColor: string;
  accessRequirement: string;
}

export const INDUSTRIAL_CONTROL_ZONES: ControlZone[] = [
  { name: 'Exclusion Zone', nameEs: 'Zona de Exclusion', distanceLimit_m: 0, doseRateLimit_uSv_h: 500, boundaryColor: '#7f1d1d', accessRequirement: 'No personnel entry during operation' },
  { name: 'Restricted Zone', nameEs: 'Zona Restringida', distanceLimit_m: 0, doseRateLimit_uSv_h: 50, boundaryColor: '#dc2626', accessRequirement: 'Radiation monitor + stay-time limits' },
  { name: 'Controlled Area', nameEs: 'Area Controlada', distanceLimit_m: 0, doseRateLimit_uSv_h: 7.5, boundaryColor: '#ea580c', accessRequirement: 'Dosimetry badge required' },
  { name: 'Supervised Area', nameEs: 'Area Supervisada', distanceLimit_m: 0, doseRateLimit_uSv_h: 2.5, boundaryColor: '#ca8a04', accessRequirement: 'Occupancy monitoring' },
  { name: 'Free Area', nameEs: 'Area Libre', distanceLimit_m: Infinity, doseRateLimit_uSv_h: 0.5, boundaryColor: '#16a34a', accessRequirement: 'No restrictions' },
];

export function calculateControlDistance(
  activity_GBq: number,
  gammaConstant: number,
  doseRateLimit_uSv_h: number,
): number {
  return Math.sqrt((activity_GBq * gammaConstant * 1000) / doseRateLimit_uSv_h);
}

export function calculateIndustrialShielding(
  activity_GBq: number,
  gammaConstant: number,
  distance_m: number,
  designDose_uSv_h: number,
  hvl_mm: number,
): number {
  const unshieldedDose = (activity_GBq * gammaConstant * 1000) / (distance_m * distance_m);
  if (unshieldedDose <= designDose_uSv_h) return 0;
  const nHVLs = Math.log2(unshieldedDose / designDose_uSv_h);
  return nHVLs * hvl_mm;
}

export function calculateSafeOperatingTime(
  doseRate_uSv_h: number,
  annualLimit_uSv: number,
  alreadyUsed_uSv: number,
): number {
  const remaining = annualLimit_uSv - alreadyUsed_uSv;
  if (remaining <= 0) return 0;
  if (doseRate_uSv_h <= 0) return Infinity;
  return remaining / doseRate_uSv_h;
}

export interface NDTProject {
  technique: string;
  source: string;
  activity_GBq: number;
  objectThickness_mm: number;
  objectMaterial: string;
  sourceFilmDistance_mm: number;
  exposureTime_min: number;
  filmType: string;
  requiredDensity: number;
  screens: string;
}

export const NDT_TECHNIQUES = [
  { id: 'ir192_radio', name: 'Ir-192 Radiography', maxSteel_mm: 100, optimal_mm: '20-80' },
  { id: 'co60_radio', name: 'Co-60 Radiography', maxSteel_mm: 200, optimal_mm: '50-150' },
  { id: 'se75_radio', name: 'Se-75 Radiography', maxSteel_mm: 40, optimal_mm: '5-30' },
  { id: 'xray_300kv', name: 'X-ray 300 kV', maxSteel_mm: 60, optimal_mm: '5-40' },
  { id: 'xray_450kv', name: 'X-ray 450 kV', maxSteel_mm: 100, optimal_mm: '20-80' },
  { id: 'linac_6mev', name: 'Linac 6 MeV', maxSteel_mm: 300, optimal_mm: '100-250' },
];
