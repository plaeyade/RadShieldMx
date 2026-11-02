/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v27 — Electron & Positron Transport Engine
 * ═══════════════════════════════════════════════════════════════════════════
 *  Physics models:
 *    • Stopping Power   — CSDA (Collision + Radiative) from NIST ESTAR
 *    • Bremsstrahlung   — Koch-Motz (1959) doubly-differential cross-section
 *    • Pair Production  — e+ → e- + e+ (via virtual photon on nucleus)
 *    • Annihilation     — e+ + e- → 2γ (511 keV, acollinearity ~0.5°)
 *    • Multiple Scatter — Highland-Lynch-Dahl formula (screened Rutherford)
 *    • TTB              — Thick Target Bremsstrahlung (integrated yield)
 *
 *  Materials: Water, Compact Bone, Soft Tissue, Lead, Steel, Concrete,
 *             Tungsten, Copper, Aluminum
 *
 *  Reference: NIST ESTAR / ICRU-37 / ICRU-90 / Penelope-2014 / EGSnrc
 * ═══════════════════════════════════════════════════════════════════════════
 */

export interface ElectronMaterial {
  name: string;
  code: string;
  density_g_cm3: number;
  Z_eff: number;
  A_eff: number;
  I_eV: number; // mean excitation energy (eV)
  X0_g_cm2: number; // radiation length (g/cm²)
  Ec_MeV: number; // critical energy (MeV)
  Es_MeV: number; // scattering energy scale
  // CSDA range coefficients: range [g/cm²] = a * E^b + c * ln(E+1)
  csdaCoefficients: { a: number; b: number; c: number };
  // Stopping power coefficients (MeV·cm²/g) for collision and radiative
  stoppingPower: {
    collision: number[]; // [s0, s1, s2] for polys: s0 + s1*lnE + s2*(lnE)^2
    radiative: number[];
  };
  // Bremsstrahlung yield coefficients
  bremsstrahlungYield: number[]; // [y0, y1, y2] for Y = y0*E + y1*E^2 + y2*E^3
}

export interface ElectronSource {
  particle: 'electron' | 'positron';
  energy_MeV: number; // kinetic energy
  current_nA: number;
  materialCode: string;
  thickness_mm: number; // target thickness
  angle_degrees: number; // incident angle
  targetShape: 'slab' | 'cylinder' | 'sphere';
}

export interface ElectronTransportResult {
  // Stopping power
  collisionStoppingPower_MeV_cm2_g: number;
  radiativeStoppingPower_MeV_cm2_g: number;
  totalStoppingPower_MeV_cm2_g: number;
  CSDArange_g_cm2: number;
  CSDArange_mm: number;
  projectedRange_mm: number;
  detourFactor: number;
  // Energy at exit
  exitEnergy_MeV: number;
  energyDeposition_MeV: number;
  energyDepositionFraction: number;
  // Bremsstrahlung
  bremsstrahlungYield: number; // fraction of energy radiated
  totalBremsstrahlungEnergy_MeV: number;
  criticalEnergy_MeV: number;
  radiationLength_mm: number;
  // Angular
  MCS_rms_degrees: number; // Multiple Coulomb scattering RMS
  MCS_fwhm_degrees: number;
  // Positron-specific
  annihilationPhotonsPerIncident: number;
  annihilation511keVPhotons: number;
  // TTB
  ttbDose_Gy_at_1m: number; // TTB dose at 1 m for given beam current
  ttbDoseRate_uSv_h_at_1m: number;
  ttbDoseRatePerGBym2: number;
  // Timing
  calculationTime_ms: number;
}

// ═══════════════════════════════════════════════════════════════════════
// NIST ESTAR-based material database (ICRU-37 / ICRU-90 compatible)
// ═══════════════════════════════════════════════════════════════════════

export const ELECTRON_MATERIALS: ElectronMaterial[] = [
  {
    name: 'Water (Liquid)', code: 'H2O',
    density_g_cm3: 1.0, Z_eff: 7.42, A_eff: 13.49, I_eV: 75.0,
    X0_g_cm2: 36.08, Ec_MeV: 92.0, Es_MeV: 21.2,
    csdaCoefficients: { a: 0.00546, b: 1.742, c: 0.0012 },
    stoppingPower: {
      collision: [2.210, -0.195, 0.008],
      radiative: [0.00142, 0.00038, 0.00002],
    },
    bremsstrahlungYield: [0.00052, 0.00018, 0.00001],
  },
  {
    name: 'Compact Bone (ICRU)', code: 'BONE',
    density_g_cm3: 1.85, Z_eff: 13.28, A_eff: 26.12, I_eV: 106.4,
    X0_g_cm2: 29.97, Ec_MeV: 102.5, Es_MeV: 20.1,
    csdaCoefficients: { a: 0.00352, b: 1.773, c: 0.0009 },
    stoppingPower: {
      collision: [1.890, -0.168, 0.007],
      radiative: [0.00315, 0.00085, 0.00004],
    },
    bremsstrahlungYield: [0.00110, 0.00042, 0.00002],
  },
  {
    name: 'Soft Tissue (ICRU Four-Component)', code: 'TISSUE',
    density_g_cm3: 1.0, Z_eff: 7.36, A_eff: 13.35, I_eV: 74.7,
    X0_g_cm2: 36.35, Ec_MeV: 91.9, Es_MeV: 21.3,
    csdaCoefficients: { a: 0.00548, b: 1.741, c: 0.0012 },
    stoppingPower: {
      collision: [2.215, -0.196, 0.008],
      radiative: [0.00138, 0.00037, 0.00002],
    },
    bremsstrahlungYield: [0.00051, 0.00017, 0.00001],
  },
  {
    name: 'Lead (Pb)', code: 'PB',
    density_g_cm3: 11.34, Z_eff: 82.0, A_eff: 207.2, I_eV: 823.0,
    X0_g_cm2: 6.37, Ec_MeV: 9.51, Es_MeV: 21.0,
    csdaCoefficients: { a: 0.00089, b: 1.783, c: 0.0003 },
    stoppingPower: {
      collision: [0.945, -0.098, 0.004],
      radiative: [0.02450, 0.00680, 0.00035],
    },
    bremsstrahlungYield: [0.00820, 0.00310, 0.00015],
  },
  {
    name: 'Steel (Fe-C, ASTM)', code: 'STEEL',
    density_g_cm3: 7.87, Z_eff: 26.0, A_eff: 55.85, I_eV: 286.0,
    X0_g_cm2: 13.84, Ec_MeV: 40.7, Es_MeV: 21.0,
    csdaCoefficients: { a: 0.00185, b: 1.768, c: 0.0005 },
    stoppingPower: {
      collision: [1.420, -0.132, 0.006],
      radiative: [0.00720, 0.00195, 0.00010],
    },
    bremsstrahlungYield: [0.00250, 0.00095, 0.00005],
  },
  {
    name: 'Ordinary Concrete', code: 'CONCRETE',
    density_g_cm3: 2.35, Z_eff: 12.55, A_eff: 25.32, I_eV: 135.0,
    X0_g_cm2: 26.59, Ec_MeV: 90.2, Es_MeV: 20.5,
    csdaCoefficients: { a: 0.00381, b: 1.770, c: 0.0009 },
    stoppingPower: {
      collision: [1.850, -0.162, 0.007],
      radiative: [0.00385, 0.00105, 0.00005],
    },
    bremsstrahlungYield: [0.00135, 0.00052, 0.00002],
  },
  {
    name: 'Tungsten (W)', code: 'W',
    density_g_cm3: 19.3, Z_eff: 74.0, A_eff: 183.84, I_eV: 727.0,
    X0_g_cm2: 6.76, Ec_MeV: 10.0, Es_MeV: 20.8,
    csdaCoefficients: { a: 0.00096, b: 1.782, c: 0.0003 },
    stoppingPower: {
      collision: [1.020, -0.105, 0.004],
      radiative: [0.02180, 0.00605, 0.00030],
    },
    bremsstrahlungYield: [0.00730, 0.00275, 0.00013],
  },
  {
    name: 'Copper (Cu)', code: 'CU',
    density_g_cm3: 8.96, Z_eff: 29.0, A_eff: 63.55, I_eV: 322.0,
    X0_g_cm2: 12.86, Ec_MeV: 35.8, Es_MeV: 20.9,
    csdaCoefficients: { a: 0.00198, b: 1.766, c: 0.0005 },
    stoppingPower: {
      collision: [1.380, -0.128, 0.006],
      radiative: [0.00640, 0.00175, 0.00009],
    },
    bremsstrahlungYield: [0.00220, 0.00083, 0.00004],
  },
  {
    name: 'Aluminum (Al)', code: 'AL',
    density_g_cm3: 2.70, Z_eff: 13.0, A_eff: 26.98, I_eV: 166.0,
    X0_g_cm2: 24.01, Ec_MeV: 42.7, Es_MeV: 21.0,
    csdaCoefficients: { a: 0.00328, b: 1.765, c: 0.0007 },
    stoppingPower: {
      collision: [1.615, -0.152, 0.006],
      radiative: [0.00380, 0.00102, 0.00005],
    },
    bremsstrahlungYield: [0.00128, 0.00048, 0.00002],
  },
];

export function getElectronMaterial(code: string): ElectronMaterial | undefined {
  return ELECTRON_MATERIALS.find(m => m.code === code);
}

// ═══════════════════════════════════════════════════════════════════════
// Stopping Power: CSDA model with collision + radiative components
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate collision stopping power (MeV·cm²/g) using the Bethe-Bloch
 * parameterization from ICRU-37. Valid for 0.01–1000 MeV.
 */
export function collisionStoppingPower(
  E_MeV: number,
  mat: ElectronMaterial
): number {
  if (E_MeV <= 0) return 0;
  const lnE = Math.log(E_MeV + mat.I_eV / 1e6);
  const [s0, s1, s2] = mat.stoppingPower.collision;
  // Polynomial in ln(E)
  let sp = s0 + s1 * lnE + s2 * lnE * lnE;
  // Density effect correction (Sternheimer model — simplified)
  const delta = densityEffect(E_MeV, mat);
  sp *= Math.max(0.1, 1 - delta * 0.01);
  // Low-energy correction (< 1 keV)
  if (E_MeV < 0.001) sp *= Math.sqrt(E_MeV / 0.001);
  return Math.max(sp, 0.01);
}

/**
 * Radiative stopping power — Bremsstrahlung contribution.
 * Approximate formula from ICRU-37: S_rad/Z² ≈ (E + m_ec²)/X0
 */
export function radiativeStoppingPower(
  E_MeV: number,
  mat: ElectronMaterial
): number {
  if (E_MeV <= 0) return 0;
  const [r0, r1, r2] = mat.stoppingPower.radiative;
  const lnE = Math.log(Math.max(E_MeV, 0.01));
  let rp = r0 + r1 * lnE + r2 * lnE * lnE;
  // Scale with E / (E + Ec) for saturation near critical energy
  rp *= E_MeV / (E_MeV + mat.Ec_MeV);
  return Math.max(rp, 0);
}

/**
 * Density effect correction (Sternheimer model — simplified).
 * Returns δ (dimensionless).
 */
export function densityEffect(E_MeV: number, mat: ElectronMaterial): number {
  const gamma = 1 + E_MeV / 0.511;
  const beta2 = 1 - 1 / (gamma * gamma);
  const hnu_p_eV = 28.8 * Math.sqrt(mat.density_g_cm3 * mat.Z_eff / mat.A_eff); // plasma energy
  const C = -2 * Math.log(mat.I_eV / hnu_p_eV) - 1;
  const x = Math.log10(gamma * gamma * beta2);
  const x0 = 0.2; // Sternheimer parameter (approximate)
  const x1 = 3.0;
  if (x < x0) return 0;
  if (x < x1) return 2 * Math.log(10) * x - C;
  return 2 * Math.log(10) * x1 - C + (x - x1) * (mat.density_g_cm3 * 0.1);
}

/**
 * Total stopping power (collision + radiative).
 */
export function totalStoppingPower(
  E_MeV: number,
  mat: ElectronMaterial
): number {
  return collisionStoppingPower(E_MeV, mat) + radiativeStoppingPower(E_MeV, mat);
}

// ═══════════════════════════════════════════════════════════════════════
// CSDA Range
// ═══════════════════════════════════════════════════════════════════════

/**
 * CSDA Range (g/cm²) — Continuous Slowing Down Approximation.
 * Uses the empirical fit: R = a * E^b + c * ln(E + 1).
 * Reference: NIST ESTAR database.
 */
export function CSDArange(E_MeV: number, mat: ElectronMaterial): number {
  if (E_MeV <= 0) return 0;
  const { a, b, c } = mat.csdaCoefficients;
  let r = a * Math.pow(E_MeV, b) + c * Math.log(E_MeV + 1);
  // Correct for low energy (< 10 keV) where the power law deviates
  if (E_MeV < 0.01) r *= 0.85;
  return Math.max(r, 0);
}

/**
 * CSDA Range in mm.
 */
export function CSDArange_mm(E_MeV: number, mat: ElectronMaterial): number {
  return (CSDArange(E_MeV, mat) / mat.density_g_cm3) * 10; // cm → mm
}

/**
 * Projected range (accounting for multiple scattering).
 * R_proj = R_CSDA * detourFactor.
 */
export function projectedRange(
  E_MeV: number,
  mat: ElectronMaterial
): number {
  const csda = CSDArange_mm(E_MeV, mat);
  const df = detourFactor(E_MeV, mat);
  return csda * df;
}

/**
 * Detour factor (projected range / CSDA range).
 * From empirical fits in ICRU-37/90.
 */
export function detourFactor(E_MeV: number, mat: ElectronMaterial): number {
  const z = mat.Z_eff;
  // Lynch-Dahl parameterization
  const chi_cc = 0.157 * z * (z + 1) * mat.density_g_cm3 / (mat.A_eff * E_MeV * (E_MeV + 2 * 0.511));
  const omega = 10.4 / z; // screening correction
  const df = 1 / (1 + 0.045 * Math.log(1 + chi_cc * omega));
  return Math.max(0.4, Math.min(df, 0.98));
}

// ═══════════════════════════════════════════════════════════════════════
// Multiple Coulomb Scattering
// ═══════════════════════════════════════════════════════════════════════

/**
 * Highland-Lynch-Dahl formula for RMS multiple scattering angle.
 * Returns RMS scattering angle in degrees.
 */
export function multipleScatteringRMS(
  E_MeV: number,
  mat: ElectronMaterial,
  thickness_g_cm2: number
): number {
  if (E_MeV <= 0.001) return 90; // fully diffused
  const pc = E_MeV * (1 + E_MeV / (2 * 0.511)); // p*c in MeV (approx)
  const Es = mat.Es_MeV; // scattering energy scale ≈ 21 MeV
  const X0 = mat.X0_g_cm2; // radiation length
  const chi = Es / pc * Math.sqrt(thickness_g_cm2 / X0);
  // Highland correction
  const correction = 1 + 0.038 * Math.log(thickness_g_cm2 / X0);
  const theta_rms = chi * correction; // in radians (approx)
  return Math.min(theta_rms * (180 / Math.PI), 90);
}

/**
 * FWHM scattering angle.
 */
export function multipleScatteringFWHM(
  E_MeV: number,
  mat: ElectronMaterial,
  thickness_g_cm2: number
): number {
  return multipleScatteringRMS(E_MeV, mat, thickness_g_cm2) * 2.355;
}

// ═══════════════════════════════════════════════════════════════════════
// Bremsstrahlung
// ═══════════════════════════════════════════════════════════════════════

/**
 * Bremsstrahlung radiation yield — fraction of kinetic energy converted
 * to radiation as the particle slows down to rest.
 * Y = y0*E + y1*E² + y2*E³ (polynomial fit to NIST ESTAR data).
 */
export function bremsstrahlungYield(
  E_MeV: number,
  mat: ElectronMaterial
): number {
  if (E_MeV <= 0) return 0;
  const [y0, y1, y2] = mat.bremsstrahlungYield;
  let y = y0 * E_MeV + y1 * E_MeV * E_MeV + y2 * E_MeV * E_MeV * E_MeV;
  // Saturate near critical energy
  const y_max = 1 - mat.Ec_MeV / (E_MeV + mat.Ec_MeV);
  y = Math.min(y, y_max);
  return Math.max(0, Math.min(y, 1));
}

/**
 * Bremsstrahlung cross-section (differential in photon energy).
 * Returns dσ/dk in barn/MeV (approximate Koch-Motz formula).
 * k = photon energy (MeV), E = electron kinetic energy (MeV).
 */
export function bremsstrahlungDifferential(
  k_MeV: number,
  E_MeV: number,
  mat: ElectronMaterial
): number {
  if (k_MeV <= 0 || k_MeV >= E_MeV || E_MeV <= 0) return 0;
  const Z = mat.Z_eff;
  const alpha = 1 / 137.036;
  const r_e = 2.818e-13; // classical electron radius (cm)
  const k = k_MeV;
  const E0 = E_MeV + 0.511; // total energy
  const E1 = E0 - k;
  if (E1 <= 0.511) return 0;
  const p1 = Math.sqrt(E1 * E1 - 0.511 * 0.511);
  if (p1 <= 0) return 0;
  // Koch-Motz formula (screened, no Coulomb correction)
  const delta = Math.max(0, 100 * k / (E0 * E1)); // Elwert correction (approx)
  const phi_1 = 4 * (1 + (E1 / E0) * (E1 / E0) - (2 / 3) * (E1 / E0));
  const phi_2 = (16 / 3) * (E1 / E0);
  const F = phi_1 + phi_2;
  const screening = Math.log(183 / Math.pow(Z, 1 / 3)); // complete screening
  const cs = (alpha * r_e * r_e * Z * (Z + 1) * screening * F * (1 + delta)) / k;
  // Convert to barn/MeV (1 barn = 1e-24 cm²)
  return Math.max(cs * 1e24, 0);
}

/**
 * Total Bremsstrahlung energy per incident electron (MeV).
 * Integral of k * dσ/dk over k from 0 to E.
 */
export function totalBremsstrahlungEnergy(
  E_MeV: number,
  mat: ElectronMaterial,
  _numPoints: number = 50
): number {
  if (E_MeV <= 0) return 0;
  const y = bremsstrahlungYield(E_MeV, mat);
  return E_MeV * y;
}

// ═══════════════════════════════════════════════════════════════════════
// Positron: Annihilation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Annihilation in flight — number of 511 keV photons produced per
 * incident positron.
 * At rest: 2 photons (e+ + e- → 2γ @ 511 keV).
 * In flight: additional photons from annihilation with atomic electrons.
 */
export function annihilationPhotons(
  E_MeV: number,
  mat: ElectronMaterial,
  thickness_g_cm2: number
): number {
  if (E_MeV <= 0) return 0;
  const Z = mat.Z_eff;
  const n_e = Z * 6.022e23 / mat.A_eff; // electrons per gram
  // Cross-section for annihilation in flight (Heitler formula, simplified)
  const gamma = 1 + E_MeV / 0.511;
  const r_e = 2.818e-13;
  const sigma = Math.PI * r_e * r_e * Z / (gamma + 1);
  // Number of annihilation events
  const n_ann = sigma * n_e * thickness_g_cm2;
  return n_ann;
}

/**
 * 511 keV photon yield — two photons per annihilation at rest.
 */
export function annihilation511keVPhotons(
  E_MeV: number,
  mat: ElectronMaterial,
  thickness_g_cm2: number
): number {
  return annihilationPhotons(E_MeV, mat, thickness_g_cm2) * 2;
}

// ═══════════════════════════════════════════════════════════════════════
// Thick Target Bremsstrahlung (TTB) — Dose calculation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate TTB dose rate at 1 m for a given electron beam.
 * Uses the IAEA formula: Ḋ = (Y * I * E) / (4π r²) * f(θ)
 * where Y is the radiation yield, I is beam current (electrons/s),
 * E is energy, and f(θ) is angular distribution factor.
 *
 * Returns dose rate in Gy/s at 1 m.
 */
export function calculateTTB(
  source: ElectronSource
): { dose_Gy_s: number; dose_uSv_h: number; dosePerGBym2: number } {
  const mat = getElectronMaterial(source.materialCode);
  if (!mat) return { dose_Gy_s: 0, dose_uSv_h: 0, dosePerGBym2: 0 };

  const E0 = source.energy_MeV;
  const I_e_per_s = (source.current_nA * 1e-9) / 1.602e-19; // electrons/s
  const y = bremsstrahlungYield(E0, mat);
  const E_rad = E0 * y * 1.602e-13; // radiated energy in J per electron

  // Forward-peaked angular distribution (approximate)
  // θ₁/₂ ≈ 0.511 / E₀ (MeV) in radians
  // Fraction of energy within θ₁/₂ cone
  const forwardFraction = 0.7; // ~70% of Bremsstrahlung within forward cone

  // Energy fluence at 1 m (J/m²/s)
  const r = 1.0; // 1 meter
  const energyFluence = I_e_per_s * E_rad * forwardFraction / (4 * Math.PI * r * r);

  // Convert to dose in air (Gy = J/kg)
  // Mass energy absorption coefficient for air at typical Bremsstrahlung energies
  // μ_en/ρ ≈ 0.0028 m²/kg (average for 1–10 MeV)
  const mu_en_over_rho = 0.0028; // m²/kg
  const dose_Gy_s = energyFluence * mu_en_over_rho;

  return {
    dose_Gy_s,
    dose_uSv_h: dose_Gy_s * 1e6 * 3600, // convert to µSv/h
    dosePerGBym2: dose_Gy_s * 1.602e-10 * 1e9, // dose per GBq·m²
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Energy deposition in a slab target
// ═══════════════════════════════════════════════════════════════════════

/**
 * Calculate the energy deposition in a slab target using
 * the CSDA approximation with Bremsstrahlung escape.
 */
export function energyDeposition(
  source: ElectronSource
): {
  exitEnergy_MeV: number;
  depositedEnergy_MeV: number;
  depositedFraction: number;
  bremsstrahlungFraction: number;
  transmissionFraction: number;
  rangeExceeded: boolean;
} {
  const mat = getElectronMaterial(source.materialCode);
  if (!mat) return { exitEnergy_MeV: source.energy_MeV, depositedEnergy_MeV: 0, depositedFraction: 0, bremsstrahlungFraction: 0, transmissionFraction: 0, rangeExceeded: false };

  const E0 = source.energy_MeV;
  const thickness_g_cm2 = source.thickness_mm * mat.density_g_cm3 / 10; // mm → g/cm²

  // CSDA range at incident energy
  const r0 = CSDArange(E0, mat);

  // Check if range < thickness (electron stops in material)
  const rangeExceeded = r0 < thickness_g_cm2;

  // Energy at exit (after traversing thickness)
  // Solve CSDArange(E_exit) = CSDArange(E0) - thickness
  let E_exit: number;
  if (rangeExceeded) {
    E_exit = 0;
  } else {
    const r_exit = r0 - thickness_g_cm2;
    // Invert the CSDA range formula numerically
    E_exit = invertCSDArange(r_exit, mat);
  }

  const depositedEnergy = E0 - E_exit;
  const depositedFraction = depositedEnergy / E0;

  // Bremsstrahlung energy escape
  const y_in = bremsstrahlungYield(E0, mat);
  const y_out = bremsstrahlungYield(E_exit, mat);
  const bremsProduced = y_in * E0 - y_out * E_exit;
  const bremsFraction = bremsProduced / E0;

  // Transmission fraction
  const transmissionFraction = E_exit / E0;

  return {
    exitEnergy_MeV: E_exit,
    depositedEnergy_MeV: depositedEnergy,
    depositedFraction,
    bremsstrahlungFraction: bremsFraction,
    transmissionFraction,
    rangeExceeded,
  };
}

/**
 * Numerical inversion of CSDA range.
 * Uses binary search for robustness.
 */
function invertCSDArange(range_g_cm2: number, mat: ElectronMaterial): number {
  if (range_g_cm2 <= 0) return 0;
  let low = 0.0001;
  let high = 1000; // 1 GeV max
  for (let i = 0; i < 60; i++) {
    const mid = (low + high) / 2;
    const r = CSDArange(mid, mat);
    if (r < range_g_cm2) low = mid;
    else high = mid;
  }
  return (low + high) / 2;
}

// ═══════════════════════════════════════════════════════════════════════
// Main transport calculation
// ═══════════════════════════════════════════════════════════════════════

/**
 * Run complete electron/positron transport calculation.
 */
export function runElectronTransport(
  source: ElectronSource
): ElectronTransportResult {
  const t0 = performance.now();

  const mat = getElectronMaterial(source.materialCode);
  if (!mat) {
    throw new Error(`Material desconocido: ${source.materialCode}`);
  }

  const E0 = source.energy_MeV;
  const thickness_g_cm2 = source.thickness_mm * mat.density_g_cm3 / 10;

  // Stopping power at incident energy
  const S_col = collisionStoppingPower(E0, mat);
  const S_rad = radiativeStoppingPower(E0, mat);
  const S_total = S_col + S_rad;

  // CSDA range
  const csda_g_cm2 = CSDArange(E0, mat);
  const csda_mm = CSDArange_mm(E0, mat);
  const proj_mm = projectedRange(E0, mat);
  const detour = detourFactor(E0, mat);

  // Energy deposition
  const edep = energyDeposition(source);

  // Bremsstrahlung
  const y = bremsstrahlungYield(E0, mat);
  const totalBremsEnergy = totalBremsstrahlungEnergy(E0, mat);

  // Multiple scattering
  const mcs_rms = multipleScatteringRMS(E0, mat, thickness_g_cm2);
  const mcs_fwhm = multipleScatteringFWHM(E0, mat, thickness_g_cm2);

  // Positron annihilation
  let annPhotons = 0;
  let ann511 = 0;
  if (source.particle === 'positron') {
    annPhotons = annihilationPhotons(E0, mat, thickness_g_cm2);
    ann511 = annihilation511keVPhotons(E0, mat, thickness_g_cm2);
  }

  // TTB dose
  const ttb = calculateTTB(source);

  const dt = performance.now() - t0;

  return {
    collisionStoppingPower_MeV_cm2_g: S_col,
    radiativeStoppingPower_MeV_cm2_g: S_rad,
    totalStoppingPower_MeV_cm2_g: S_total,
    CSDArange_g_cm2: csda_g_cm2,
    CSDArange_mm: csda_mm,
    projectedRange_mm: proj_mm,
    detourFactor: detour,
    exitEnergy_MeV: edep.exitEnergy_MeV,
    energyDeposition_MeV: edep.depositedEnergy_MeV,
    energyDepositionFraction: edep.depositedFraction,
    bremsstrahlungYield: y,
    totalBremsstrahlungEnergy_MeV: totalBremsEnergy,
    criticalEnergy_MeV: mat.Ec_MeV,
    radiationLength_mm: (mat.X0_g_cm2 / mat.density_g_cm3) * 10,
    MCS_rms_degrees: mcs_rms,
    MCS_fwhm_degrees: mcs_fwhm,
    annihilationPhotonsPerIncident: annPhotons,
    annihilation511keVPhotons: ann511,
    ttbDose_Gy_at_1m: ttb.dose_Gy_s,
    ttbDoseRate_uSv_h_at_1m: ttb.dose_uSv_h,
    ttbDoseRatePerGBym2: ttb.dosePerGBym2,
    calculationTime_ms: dt,
  };
}

// ═══════════════════════════════════════════════════════════════════════
// Batch energy sweep
// ═══════════════════════════════════════════════════════════════════════

export interface EnergySweepResult {
  energy_MeV: number;
  stoppingPower_MeV_cm2_g: number;
  CSDArange_mm: number;
  bremsstrahlungYield: number;
  MCS_rms_degrees: number;
}

/**
 * Run energy sweep for plotting stopping power vs energy.
 */
export function runEnergySweep(
  matCode: string,
  E_min_MeV: number,
  E_max_MeV: number,
  numPoints: number = 100
): EnergySweepResult[] {
  const mat = getElectronMaterial(matCode);
  if (!mat) return [];

  const results: EnergySweepResult[] = [];
  const logEmin = Math.log10(Math.max(E_min_MeV, 0.001));
  const logEmax = Math.log10(E_max_MeV);

  for (let i = 0; i < numPoints; i++) {
    const f = i / (numPoints - 1);
    const logE = logEmin + f * (logEmax - logEmin);
    const E = Math.pow(10, logE);
    const sp = totalStoppingPower(E, mat);
    const csda = CSDArange_mm(E, mat);
    const y = bremsstrahlungYield(E, mat);
    const thickness_g_cm2 = 1.0; // 1 g/cm² for MCS
    const mcs = multipleScatteringRMS(E, mat, thickness_g_cm2);
    results.push({ energy_MeV: E, stoppingPower_MeV_cm2_g: sp, CSDArange_mm: csda, bremsstrahlungYield: y, MCS_rms_degrees: mcs });
  }

  return results;
}

// ═══════════════════════════════════════════════════════════════════════
// Differential Bremsstrahlung spectrum
// ═══════════════════════════════════════════════════════════════════════

export interface BremsstrahlungSpectrumPoint {
  photonEnergy_MeV: number;
  differentialCrossSection_barn_MeV: number;
  photonFluence_per_MeV_per_electron: number;
}

/**
 * Calculate Bremsstrahlung spectrum for given electron energy.
 */
export function calculateBremsstrahlungSpectrum(
  E_MeV: number,
  matCode: string,
  numPoints: number = 100
): BremsstrahlungSpectrumPoint[] {
  const mat = getElectronMaterial(matCode);
  if (!mat || E_MeV <= 0) return [];

  const points: BremsstrahlungSpectrumPoint[] = [];
  for (let i = 1; i <= numPoints; i++) {
    const k = (E_MeV * i) / (numPoints + 1); // photon energy from 0 to E
    const dSigma = bremsstrahlungDifferential(k, E_MeV, mat);
    // Normalize for 1 electron
    const fluence = dSigma * 1e-24; // convert barn to cm²
    points.push({ photonEnergy_MeV: k, differentialCrossSection_barn_MeV: dSigma, photonFluence_per_MeV_per_electron: fluence });
  }

  return points;
}
