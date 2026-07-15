/**
 * B.12: Log-linear interpolation for TVL/HVL values
 * Handles energies not explicitly tabulated in NCRP tables
 */

// TVL in mm (from NCRP 151 Table B.1)
const TVL_DATA: Record<string, Record<number, number>> = {
  concrete: { 1: 210, 4: 290, 6: 370, 10: 370, 15: 440, 18: 450, 20: 460, 24: 480 },
  barite:   { 1: 130, 4: 180, 6: 210, 10: 240, 15: 280, 18: 300, 20: 320, 24: 350 },
  steel:    { 1:  50, 4:  70, 6: 100, 10: 110, 15: 110, 18: 110, 20: 110, 24: 110 },
  lead:     { 1:  40, 4:  40, 6:  57, 10:  57, 15:  57, 18:  57, 20:  57, 24:  57 },
};

const ENERGIES = [1, 4, 6, 10, 15, 18, 20, 24];

/**
 * Log-linear interpolation of TVL between two energy points.
 * Uses: TVL(E) = TVL(E1) * (TVL(E2)/TVL(E1)) ^ log(E/E1)/log(E2/E1)
 */
export function interpolateTVL(material: string, energy_MeV: number): number {
  const mat = TVL_DATA[material];
  if (!mat) throw new Error(`Material desconocido: ${material}`);

  // Direct match
  const exact = mat[energy_MeV];
  if (exact !== undefined) return exact;

  // Out of range — clamp
  if (energy_MeV <= ENERGIES[0]) return mat[ENERGIES[0]];
  if (energy_MeV >= ENERGIES[ENERGIES.length - 1]) return mat[ENERGIES[ENERGIES.length - 1]];

  // Find bracketing energies
  let eLow = ENERGIES[0], eHigh = ENERGIES[ENERGIES.length - 1];
  for (let i = 0; i < ENERGIES.length - 1; i++) {
    if (ENERGIES[i] <= energy_MeV && ENERGIES[i + 1] >= energy_MeV) {
      eLow = ENERGIES[i];
      eHigh = ENERGIES[i + 1];
      break;
    }
  }

  const tvlLow = mat[eLow];
  const tvlHigh = mat[eHigh];

  // Log-linear interpolation
  const logRatio = Math.log(energy_MeV / eLow) / Math.log(eHigh / eLow);
  const logTvl = Math.log(tvlLow) + logRatio * (Math.log(tvlHigh) - Math.log(tvlLow));
  return Math.round(Math.exp(logTvl));
}

/**
 * Get TVL with interpolation, returning metadata about the calculation
 */
export function getTVLWithMeta(material: string, energy_MeV: number): {
  tvl_mm: number; interpolated: boolean; fromEnergy: number; toEnergy: number; method: string;
} {
  const mat = TVL_DATA[material];
  if (!mat) throw new Error(`Material desconocido: ${material}`);

  const exact = mat[energy_MeV];
  if (exact !== undefined) {
    return { tvl_mm: exact, interpolated: false, fromEnergy: energy_MeV, toEnergy: energy_MeV, method: 'exact' };
  }

  let eLow = ENERGIES[0], eHigh = ENERGIES[ENERGIES.length - 1];
  for (let i = 0; i < ENERGIES.length - 1; i++) {
    if (ENERGIES[i] <= energy_MeV && ENERGIES[i + 1] >= energy_MeV) {
      eLow = ENERGIES[i]; eHigh = ENERGIES[i + 1]; break;
    }
  }

  const tvl = interpolateTVL(material, energy_MeV);
  return { tvl_mm: tvl, interpolated: true, fromEnergy: eLow, toEnergy: eHigh, method: 'log-linear' };
}

/**
 * Get all available materials
 */
export function getAvailableMaterials(): string[] {
  return Object.keys(TVL_DATA);
}

/**
 * Get energy range for a material
 */
export function getEnergyRange(material: string): { min: number; max: number } | null {
  const mat = TVL_DATA[material];
  if (!mat) return null;
  const energies = Object.keys(mat).map(Number).sort((a, b) => a - b);
  return { min: energies[0], max: energies[energies.length - 1] };
}
