// =============================================================================
// validationEngine.ts — Formula Validation & Redundancy Checking Engine
// Validates shielding calculations against NCRP reference values
// =============================================================================

/** NCRP 151 Table B.1 TVL values (cm) for primary barrier — REF006 */
export const NCRP151_TVL_CM: Record<string, Record<string, number>> = {
  concrete: { '6MV': 37.0, '10MV': 37.0, '15MV': 41.0, '18MV': 45.0, '25MV': 50.0, 'Co60': 21.8 },
  steel: { '6MV': 8.5, '10MV': 9.0, '15MV': 10.0, '18MV': 11.0, '25MV': 12.5, 'Co60': 5.5 },
  lead: { '6MV': 5.5, '10MV': 6.0, '15MV': 7.0, '18MV': 8.0, '25MV': 9.5, 'Co60': 1.13 },
};

/** NCRP 147 HVL values (mm) for diagnostic energies */
export const NCRP147_HVL_MM: Record<string, Record<string, number>> = {
  lead: { '50kV': 0.39, '70kV': 0.65, '100kV': 1.1, '125kV': 1.6, '150kV': 2.2 },
  concrete: { '50kV': 4.0, '70kV': 10.0, '100kV': 17.0, '125kV': 23.0, '150kV': 28.0 },
  gypsum: { '50kV': 11.0, '70kV': 20.0, '100kV': 30.0, '125kV': 38.0, '150kV': 45.0 },
};

/** TG 108 exposure rate constants (mSv·m²/GBq·h) */
export const TG108_GAMMA_CONSTANTS: Record<string, number> = {
  'F-18': 0.143, 'Ga-68': 0.134, 'Cu-64': 0.120, 'Zr-89': 0.101,
  'Tc-99m': 0.030, 'I-131': 0.059, 'I-123': 0.036, 'In-111': 0.080,
  'Tl-201': 0.046, 'Lu-177': 0.005, 'Y-90': 0.001, 'Ra-223': 0.026,
};

/** NCRP 151 Occupancy Factors Table B.2 */
export const NCRP151_OCCUPANCY: Record<string, number> = {
  'Control room (full)': 1.0, 'Office (full)': 1.0, 'Patient waiting': 0.5,
  'Corridor (patient)': 0.25, 'Corridor (staff)': 0.2, 'Treatment vault': 0.25,
  'Utility room': 0.2, 'Outdoor (uncontrolled)': 0.025, 'Parking': 0.025,
  'Residential': 0.02, 'Attic': 0.05, 'Public toilet': 0.2,
};

/** NCRP 151 Use Factors */
export const NCRP151_USE_FACTORS: Record<string, number> = {
  primary: 1.0, scatter: 0.25, leakage: 1.0,
};

// ── Validation Functions ──

/** Validate TVL value against NCRP 151 reference */
export function validateTVL(
  material: string,
  energy: string,
  computedTVL_cm: number,
  tolerance = 0.1, // 10% tolerance
): { valid: boolean; expected: number; diff: number; message: string } {
  const ref = NCRP151_TVL_CM[material]?.[energy];
  if (!ref) return { valid: true, expected: 0, diff: 0, message: 'No NCRP reference for this material/energy' };
  const diff = Math.abs(computedTVL_cm - ref) / ref;
  const valid = diff <= tolerance;
  return {
    valid,
    expected: ref,
    diff,
    message: valid
      ? `TVL = ${computedTVL_cm.toFixed(1)} cm matches NCRP 151 (ref: ${ref} cm, diff: ${(diff * 100).toFixed(1)}%)`
      : `TVL mismatch: computed ${computedTVL_cm.toFixed(1)} cm vs NCRP ${ref} cm (${(diff * 100).toFixed(1)}% > ${(tolerance * 100).toFixed(0)}%)`,
  };
}

/** Validate shielding thickness calculation */
export function validateBarrierThickness(
  kerma_uSv: number,
  designGoal_uSv: number,
  occupancyFactor: number,
  useFactor: number,
  computedThickness_cm: number,
): { valid: boolean; message: string; requiredTVLs: number } {
  if (computedThickness_cm < 0) return { valid: false, message: 'Negative thickness not allowed', requiredTVLs: 0 };
  const B = (designGoal_uSv / occupancyFactor) / (kerma_uSv * useFactor);
  const nTVLs = B > 0 ? Math.max(0, -Math.log10(B)) : 0;
  if (computedThickness_cm === 0 && nTVLs > 0.1) {
    return { valid: false, message: `Thickness=0 but ${nTVLs.toFixed(2)} TVLs required`, requiredTVLs: nTVLs };
  }
  return {
    valid: computedThickness_cm >= 0,
    message: `Barrier: ${computedThickness_cm.toFixed(1)} cm covers ${nTVLs.toFixed(2)} TVLs (B=${B.toExponential(2)})`,
    requiredTVLs: nTVLs,
  };
}

/** Validate occupancy factor is in NCRP 151 range */
export function validateOccupancyFactor(T: number): { valid: boolean; message: string } {
  const values = Object.values(NCRP151_OCCUPANCY);
  const min = Math.min(...values);
  if (T < 0 || T > 1) return { valid: false, message: `Occupancy factor ${T} outside [0,1] range` };
  if (T < min / 2) return { valid: true, message: `Warning: T=${T} unusually low (NCRP min: ${min})` };
  return { valid: true, message: `Occupancy factor T=${T} valid` };
}

/** Validate distance is physically reasonable */
export function validateDistance(d_m: number): { valid: boolean; message: string } {
  if (d_m <= 0) return { valid: false, message: `Distance ${d_m}m must be > 0` };
  if (d_m < 0.3) return { valid: false, message: `Distance ${d_m}m too small (min: 0.3m for point source)` };
  if (d_m > 100) return { valid: true, message: `Warning: Distance ${d_m}m unusually large` };
  return { valid: true, message: `Distance ${d_m}m valid` };
}

/** Validate nuclear medicine gamma constant */
export function validateGammaConstant(nuclide: string, value: number): { valid: boolean; expected: number; message: string } {
  const expected = TG108_GAMMA_CONSTANTS[nuclide];
  if (!expected) return { valid: true, expected: 0, message: `No reference for ${nuclide}` };
  const diff = Math.abs(value - expected) / expected;
  const valid = diff <= 0.05; // 5% tolerance
  return {
    valid,
    expected,
    message: valid
      ? `Γ(${nuclide}) = ${value} matches TG 108 ref ${expected} (${(diff * 100).toFixed(1)}%)`
      : `Γ mismatch: ${value} vs TG 108 ${expected} (${(diff * 100).toFixed(1)}%)`,
  };
}

/** Run full validation suite on a calculation */
export interface ValidationReport {
  passed: boolean;
  checks: ValidationCheck[];
  summary: string;
}

export interface ValidationCheck {
  name: string;
  passed: boolean;
  message: string;
  severity: 'error' | 'warning' | 'info';
}

export function runFullValidation(params: {
  material: string;
  energy: string;
  tvl_cm: number;
  kerma_uSv: number;
  designGoal_uSv: number;
  occupancyFactor: number;
  useFactor: number;
  thickness_cm: number;
  distance_m: number;
  nuclide?: string;
  gammaConstant?: number;
}): ValidationReport {
  const checks: ValidationCheck[] = [];

  // 1. TVL validation
  const tvlCheck = validateTVL(params.material, params.energy, params.tvl_cm);
  checks.push({ name: 'NCRP 151 TVL', passed: tvlCheck.valid, message: tvlCheck.message, severity: tvlCheck.valid ? 'info' : 'error' });

  // 2. Barrier thickness
  const thickCheck = validateBarrierThickness(params.kerma_uSv, params.designGoal_uSv, params.occupancyFactor, params.useFactor, params.thickness_cm);
  checks.push({ name: 'Barrier Thickness', passed: thickCheck.valid, message: thickCheck.message, severity: thickCheck.valid ? 'info' : 'error' });

  // 3. Occupancy factor
  const occCheck = validateOccupancyFactor(params.occupancyFactor);
  checks.push({ name: 'Occupancy Factor', passed: occCheck.valid, message: occCheck.message, severity: 'info' });

  // 4. Distance
  const distCheck = validateDistance(params.distance_m);
  checks.push({ name: 'Distance', passed: distCheck.valid, message: distCheck.message, severity: distCheck.valid ? 'info' : 'warning' });

  // 5. Gamma constant (if nuclide provided)
  if (params.nuclide && params.gammaConstant) {
    const gammaCheck = validateGammaConstant(params.nuclide, params.gammaConstant);
    checks.push({ name: 'TG 108 Gamma Constant', passed: gammaCheck.valid, message: gammaCheck.message, severity: gammaCheck.valid ? 'info' : 'warning' });
  }

  const passed = checks.every(c => c.passed || c.severity !== 'error');
  const errors = checks.filter(c => !c.passed && c.severity === 'error').length;
  const warnings = checks.filter(c => !c.passed && c.severity === 'warning').length;

  return {
    passed,
    checks,
    summary: errors > 0
      ? `FAILED: ${errors} error(s), ${warnings} warning(s)`
      : warnings > 0
        ? `PASSED with ${warnings} warning(s)`
        : 'All validations passed',
  };
}

/** Check for redundant or duplicate entries */
export function checkRedundancy<T>(items: T[], keyFn: (item: T) => string): { duplicates: string[]; unique: T[] } {
  const seen = new Set<string>();
  const duplicates: string[] = [];
  const unique: T[] = [];
  for (const item of items) {
    const key = keyFn(item);
    if (seen.has(key)) { duplicates.push(key); }
    else { seen.add(key); unique.push(item); }
  }
  return { duplicates, unique };
}
