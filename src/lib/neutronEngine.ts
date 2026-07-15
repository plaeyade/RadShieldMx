/**
 * Neutron Transport Engine for RadShield-MX v26
 * Simplified neutron transport for radiation shielding calculations.
 * Based on ENDF/B-VII.1 cross-sections.
 * 
 * References:
 * - ENDF/B-VII.1: Evaluated Nuclear Data File
 * - NCRP 144: Radiation Protection for Particle Accelerator Facilities
 * - IAEA SRS 47: Radiation Protection in Radiotherapy Facilities
 * - ICRP 116: Conversion Coefficients
 */

// Neutron cross-section data (barns) for common shielding materials
// Simplified from ENDF/B-VII.1 for protection-level calculations
export interface NeutronXS {
  energy_MeV: number;
  total: number;     // barns
  elastic: number;   // barns
  capture: number;   // barns
  inelastic: number; // barns
  fission: number;   // barns (for fissile materials)
}

// Macroscopic cross-sections (cm^-1) for materials
export interface NeutronMaterial {
  name: string;
  density_g_cm3: number;
  atoms_per_cm3: number; // N = rho * Na / A
  xs_data: NeutronXS[];
}

// Thermal neutron cross-sections at 0.0253 eV (~2200 m/s)
const THERMAL_XS: Record<string, { sigma_s: number; sigma_a: number; sigma_c: number }> = {
  // Format: scattering (b), absorption (b), capture (b)
  hydrogen:   { sigma_s: 38.0, sigma_a: 0.33,  sigma_c: 0.33 },
  carbon:     { sigma_s: 4.75, sigma_a: 0.0034, sigma_c: 0.0034 },
  nitrogen:   { sigma_s: 10.0, sigma_a: 1.85,  sigma_c: 1.85 },
  oxygen:     { sigma_s: 4.23, sigma_a: 0.00019, sigma_c: 0.00019 },
  aluminum:   { sigma_s: 1.50, sigma_a: 0.23,  sigma_c: 0.23 },
  silicon:    { sigma_s: 1.70, sigma_a: 0.17,  sigma_c: 0.17 },
  calcium:    { sigma_s: 3.00, sigma_a: 0.43,  sigma_c: 0.43 },
  iron:       { sigma_s: 11.2, sigma_a: 2.56,  sigma_c: 2.56 },
  nickel:     { sigma_s: 17.8, sigma_a: 4.43,  sigma_c: 4.43 },
  chromium:   { sigma_s: 3.60, sigma_a: 3.07,  sigma_c: 3.07 },
  lead:       { sigma_s: 11.1, sigma_a: 0.17,  sigma_c: 0.17 },
  boron10:    { sigma_s: 2.00, sigma_a: 3840,  sigma_c: 3840 }, // High capture
  cadmium:    { sigma_s: 3.40, sigma_a: 2520,  sigma_c: 2520 },
  tungsten:   { sigma_s: 4.80, sigma_a: 18.4,  sigma_c: 18.4 },
  concrete:   { sigma_s: 3.50, sigma_a: 0.15,  sigma_c: 0.15 },
  polyethylene: { sigma_s: 42.0, sigma_a: 0.30, sigma_c: 0.30 },
  borated_pe: { sigma_s: 40.0, sigma_a: 50.0,  sigma_c: 50.0 }, // 5% boron
  water:      { sigma_s: 103.0, sigma_a: 0.66, sigma_c: 0.66 },
};

// Fast neutron removal cross-sections (cm^-1) — for simplified attenuation calculations
const REMOVAL_XS: Record<string, number> = {
  concrete: 0.089,
  steel: 0.096,
  lead: 0.110,
  polyethylene: 0.122,
  borated_pe: 0.180,
  water: 0.103,
  iron: 0.096,
  aluminum: 0.075,
  earth: 0.075,
  wood: 0.065,
};

// Watt fission spectrum for neutron sources
function wattFissionSpectrum(E_MeV: number): number {
  const a = 0.988; const b = 2.249;
  return Math.exp(-E_MeV / a) * Math.sinh(Math.sqrt(b * E_MeV));
}

/**
 * Calculate neutron attenuation through shielding using removal cross-section method
 * Based on NCRP 144 and IAEA SRS 47
 */
export function calculateNeutronAttenuation(
  sourceEnergy_MeV: number,
  sourceIntensity_n_per_s: number,
  shieldMaterial: string,
  shieldThickness_cm: number,
  distance_m: number
): {
  transmittedFraction: number;
  doseRate_Sv_per_h: number;
  thermalFlux_cm2_per_s: number;
  fastFlux_cm2_per_s: number;
  tenthValueLayer_cm: number;
} {
  const mu_rem = REMOVAL_XS[shieldMaterial] || 0.089; // default concrete
  const n_tvl = shieldThickness_cm * mu_rem / Math.log(10);
  const transmitted = Math.pow(10, -n_tvl);

  // Dose conversion: 1 n/cm²/s ≈ 3.5-4.0 pSv for fast neutrons (ICRP 116)
  const doseCoeff_pSv_cm2 = sourceEnergy_MeV > 1 ? 4.0 : sourceEnergy_MeV > 0.1 ? 3.5 : 2.5;

  // Unshielded fluence at distance
  const area_cm2 = 4 * Math.PI * (distance_m * 100) * (distance_m * 100);
  const unshieldedFluence = sourceIntensity_n_per_s / area_cm2;
  const shieldedFluence = unshieldedFluence * transmitted;

  const doseRate_Sv_per_h = shieldedFluence * doseCoeff_pSv_cm2 * 1e-12 * 3600;

  // Thermal flux build-up (scattered neutrons thermalize)
  const thermalFraction = 0.1 * (1 - transmitted); // ~10% of removed neutrons become thermal
  const thermalFlux = shieldedFluence * 0.2 + thermalFraction * unshieldedFluence;

  const tvl_cm = Math.log(10) / mu_rem;

  return {
    transmittedFraction: transmitted,
    doseRate_Sv_per_h,
    thermalFlux_cm2_per_s: thermalFlux,
    fastFlux_cm2_per_s: shieldedFluence,
    tenthValueLayer_cm: tvl_cm,
  };
}

/**
 * Calculate borated polyethylene effectiveness for neutron shielding
 * Combines thermalization (H) + capture (B-10)
 */
export function calculateBoratedPEShielding(
  sourceEnergy_MeV: number,
  sourceIntensity_n_per_s: number,
  thickness_cm: number,
  boronPercent: number = 5
): {
  thermalAttenuation: number;
  fastAttenuation: number;
  combinedAttenuation: number;
  gammaDose_mSv_per_h: number; // Capture gamma from B-10(n,alpha)Li-7
  recommendedThickness_cm: number;
} {
  // Polyethylene thermalizes fast neutrons
  const peRemoval = REMOVAL_XS.polyethylene * (1 + boronPercent * 0.5);
  const fastAtt = Math.exp(-peRemoval * thickness_cm);

  // Boron captures thermal neutrons
  const boronDensity = boronPercent * 0.01 * 0.95; // g/cm³ of B in PE
  const boronAtoms = boronDensity * 6.022e23 / 10.81; // atoms/cm³
  const thermalCaptureXS = 3840e-24 * boronAtoms * 0.2; // 20% B-10 enrichment
  const thermalAtt = Math.exp(-thermalCaptureXS * thickness_cm);

  // Combined (fast thermalization then thermal capture)
  const combined = fastAtt + (1 - fastAtt) * thermalAtt;

  // Capture gamma: B-10(n,alpha)Li-7* → 0.478 MeV gamma, 94% branching
  const capturedNeutrons = sourceIntensity_n_per_s * (1 - combined) * 0.94;
  const gammaEnergy_MeV = 0.478;
  const gammaConstant = 2.6e-13; // approximate for 0.478 MeV
  const gammaDose_Gy_per_h = gammaConstant * capturedNeutrons * gammaEnergy_MeV;

  // Recommended thickness for 10x attenuation
  const recommended = Math.log(10) / (peRemoval + thermalCaptureXS * 0.1) * 1.5; // safety factor

  return {
    thermalAttenuation: thermalAtt,
    fastAttenuation: fastAtt,
    combinedAttenuation: combined,
    gammaDose_mSv_per_h: gammaDose_Gy_per_h * 1e6,
    recommendedThickness_cm: recommended,
  };
}

/**
 * Calculate TVL (Tenth-Value Layer) for neutrons
 * Based on NCRP 144 Table values
 */
export function getNeutronTVL(material: string, energy_MeV: number): number {
  // TVL in cm for various materials (NCRP 144)
  const tvlData: Record<string, Record<string, number>> = {
    concrete: { thermal: 2.5, fast: 30, e2: 35, e10: 40, e20: 42 },
    polyethylene: { thermal: 0.8, fast: 8, e2: 10, e10: 12, e20: 14 },
    steel: { thermal: 1.5, fast: 12, e2: 15, e10: 18, e20: 20 },
    water: { thermal: 1.0, fast: 10, e2: 12, e10: 14, e20: 15 },
    lead: { thermal: 3.0, fast: 20, e2: 25, e10: 30, e20: 35 },
    earth: { thermal: 3.5, fast: 40, e2: 45, e10: 50, e20: 55 },
  };

  const matData = tvlData[material] || tvlData.concrete;

  if (energy_MeV < 0.5e-6) return matData.thermal;
  if (energy_MeV < 1) return matData.fast;
  if (energy_MeV < 5) return matData.e2 || matData.fast;
  if (energy_MeV < 15) return matData.e10 || matData.e2;
  return matData.e20 || matData.e10;
}

// Predefined neutron sources for medical/industrial use
export const NEUTRON_SOURCES = [
  { name: 'D-T Generator (14.1 MeV)', energy_MeV: 14.1, spectrumType: 'mono', typicalYield_n_per_s: 1e10 },
  { name: 'D-D Generator (2.45 MeV)', energy_MeV: 2.45, spectrumType: 'mono', typicalYield_n_per_s: 1e9 },
  { name: 'LINAC >10 MV (x,n)', energy_MeV: 1.5, spectrumType: 'watt', typicalYield_n_per_s: 1e8 },
  { name: 'LINAC 15 MV (x,n)', energy_MeV: 2.0, spectrumType: 'watt', typicalYield_n_per_s: 1e9 },
  { name: 'LINAC 18 MV (x,n)', energy_MeV: 3.0, spectrumType: 'watt', typicalYield_n_per_s: 5e9 },
  { name: 'Cf-252 (spontaneous fission)', energy_MeV: 2.1, spectrumType: 'watt', typicalYield_n_per_s: 2.3e12 },
  { name: 'Am-Be (alpha,n)', energy_MeV: 4.5, spectrumType: 'continuous', typicalYield_n_per_s: 2.2e6 },
  { name: 'Pu-Be (alpha,n)', energy_MeV: 4.2, spectrumType: 'continuous', typicalYield_n_per_s: 1.5e6 },
] as const;

/**
 * Calculate maze dose for neutrons (multiple scattering)
 * Based on Kersey method (NCRP 144)
 */
export function calculateNeutronMazeDose(
  sourceEnergy_MeV: number,
  sourceIntensity_n_per_s: number,
  mazeWidth_m: number,
  mazeLength_m: number,
  numLegs: number,
  wallMaterial: string = 'concrete'
): { doseAtMazeEnd_Sv_per_h: number; dosePerScatter_Sv_per_h: number } {
  // Kersey approximation: each scatter reduces flux by ~1/4
  const scatterFactor = Math.pow(0.25, numLegs);

  // Source term at maze entrance
  const entranceArea_m2 = mazeWidth_m * mazeWidth_m;
  const sourceTerm = sourceIntensity_n_per_s / entranceArea_m2;

  // Attenuation along maze
  const matMu = REMOVAL_XS[wallMaterial] || 0.089;
  const pathAttenuation = Math.exp(-matMu * mazeLength_m * 100);

  const doseCoeff = sourceEnergy_MeV > 1 ? 4.0e-12 : 2.5e-12; // Sv per n/cm²
  const fluenceAtEnd = sourceTerm * scatterFactor * pathAttenuation * 1e-4; // convert to cm²
  const doseAtEnd = fluenceAtEnd * doseCoeff * 3600; // per hour

  return {
    doseAtMazeEnd_Sv_per_h: doseAtEnd,
    dosePerScatter_Sv_per_h: doseAtEnd / Math.max(numLegs, 1),
  };
}

/**
 * Calculate skyshine dose from neutron source
 * Based on NCRP 144 methodology
 */
export function calculateNeutronSkyshine(
  sourceEnergy_MeV: number,
  sourceIntensity_n_per_s: number,
  roofThickness_cm: number,
  roofMaterial: string,
  sourceToRoofDistance_m: number,
  distanceFromWall_m: number
): { doseRate_Sv_per_h: number; dosePerNeutron_Sv: number } {
  const mu = REMOVAL_XS[roofMaterial] || 0.089;
  const roofAtt = Math.exp(-mu * roofThickness_cm);

  // Albedo (reflected fraction)
  const albedo = 0.05 + 0.1 * Math.exp(-sourceEnergy_MeV / 5); // ~5-15%

  // Scattered fluence at distance from wall
  const scatteredNeutrons = sourceIntensity_n_per_s * roofAtt * albedo;
  const area = 2 * Math.PI * (distanceFromWall_m * 100) * (distanceFromWall_m * 100);
  const fluence = scatteredNeutrons / area;

  const doseCoeff = sourceEnergy_MeV > 1 ? 4.0e-12 : 2.5e-12;
  const doseRate = fluence * doseCoeff * 3600;

  return {
    doseRate_Sv_per_h: doseRate,
    dosePerNeutron_Sv: doseRate / sourceIntensity_n_per_s,
  };
}
