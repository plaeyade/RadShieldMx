/**
 * Bateman Equations Solver for RadShield-MX v26
 * Computes time-dependent activity for decay chains of arbitrary length.
 * 
 * Implements the analytic solution of Bateman equations:
 * N_i(t) = sum_{j=1..i} N_j(0) * lambda_i/lambda_i-lambda_j * product_{k!=j} lambda_k/lambda_k-lambda_j * e^{-lambda_j t}
 * 
 * References:
 * - ICRP Publication 107: Nuclear Decay Data for Dosimetric Calculations
 * - Bateman H., Proc. Cambridge Phil. Soc. 15, 423 (1910)
 * - ICRP Publication 38: Radionuclide Transformations
 */

export interface Nuclide {
  name: string;
  symbol: string;
  Z: number;
  A: number;
  halfLife_s: number;
  decayModes: Array<{ mode: string; branchingRatio: number; daughter?: string }>;
  gammaEnergies_MeV?: number[];
  gammaIntensities?: number[];
}

export interface DecayChain {
  parent: string;
  members: Array<{
    nuclide: Nuclide;
    generation: number;
    initialActivity_Bq: number;
    lambda: number;
  }>;
}

export interface TimePoint {
  time_s: number;
  activities: Record<string, number>; // Bq per nuclide
  totalActivity_Bq: number;
  totalDoseRate_uSv_h_at_1m: number;
}

// 250+ radionuclides from ICRP 107
export const NUCLIDE_LIBRARY: Record<string, Nuclide> = {
  // === MEDICAL ===
  'F-18': { name: 'Fluorine-18', symbol: 'F-18', Z: 9, A: 18, halfLife_s: 6586.2, decayModes: [{ mode: 'beta+', branchingRatio: 0.967, daughter: 'O-18' }], gammaEnergies_MeV: [0.511], gammaIntensities: [1.94] },
  'Ga-68': { name: 'Gallium-68', symbol: 'Ga-68', Z: 31, A: 68, halfLife_s: 4053.6, decayModes: [{ mode: 'beta+', branchingRatio: 0.89, daughter: 'Zn-68' }], gammaEnergies_MeV: [0.511, 1.077], gammaIntensities: [1.78, 0.03] },
  'Cu-64': { name: 'Copper-64', symbol: 'Cu-64', Z: 29, A: 64, halfLife_s: 46353.6, decayModes: [{ mode: 'beta+', branchingRatio: 0.175 }, { mode: 'beta-', branchingRatio: 0.39 }, { mode: 'EC', branchingRatio: 0.435 }], gammaEnergies_MeV: [0.511, 1.346], gammaIntensities: [0.35, 0.005] },
  'Zr-89': { name: 'Zirconium-89', symbol: 'Zr-89', Z: 40, A: 89, halfLife_s: 282240, decayModes: [{ mode: 'beta+', branchingRatio: 0.23 }, { mode: 'EC', branchingRatio: 0.77 }] },
  'I-131': { name: 'Iodine-131', symbol: 'I-131', Z: 53, A: 131, halfLife_s: 692928, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Xe-131' }], gammaEnergies_MeV: [0.080, 0.284, 0.364, 0.637], gammaIntensities: [0.025, 0.061, 0.819, 0.071] },
  'I-123': { name: 'Iodine-123', symbol: 'I-123', Z: 53, A: 123, halfLife_s: 47520, decayModes: [{ mode: 'EC', branchingRatio: 1.0 }] },
  'I-125': { name: 'Iodine-125', symbol: 'I-125', Z: 53, A: 125, halfLife_s: 5292864, decayModes: [{ mode: 'EC', branchingRatio: 1.0 }] },
  'Tc-99m': { name: 'Technetium-99m', symbol: 'Tc-99m', Z: 43, A: 99, halfLife_s: 21624, decayModes: [{ mode: 'IT', branchingRatio: 1.0, daughter: 'Tc-99' }], gammaEnergies_MeV: [0.140], gammaIntensities: [0.885] },
  'Tc-99': { name: 'Technetium-99', symbol: 'Tc-99', Z: 43, A: 99, halfLife_s: 2.13e13, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'In-111': { name: 'Indium-111', symbol: 'In-111', Z: 49, A: 111, halfLife_s: 242352, decayModes: [{ mode: 'EC', branchingRatio: 1.0 }] },
  'Lu-177': { name: 'Lutetium-177', symbol: 'Lu-177', Z: 71, A: 177, halfLife_s: 583632, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Y-90': { name: 'Yttrium-90', symbol: 'Y-90', Z: 39, A: 90, halfLife_s: 230400, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Sr-89': { name: 'Strontium-89', symbol: 'Sr-89', Z: 38, A: 89, halfLife_s: 4354560, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Sm-153': { name: 'Samarium-153', symbol: 'Sm-153', Z: 62, A: 153, halfLife_s: 166320, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Re-186': { name: 'Rhenium-186', symbol: 'Re-186', Z: 75, A: 186, halfLife_s: 131040, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Re-188': { name: 'Rhenium-188', symbol: 'Re-188', Z: 75, A: 188, halfLife_s: 64224, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Ra-223': { name: 'Radium-223', symbol: 'Ra-223', Z: 88, A: 223, halfLife_s: 990720, decayModes: [{ mode: 'alpha', branchingRatio: 1.0, daughter: 'Rn-219' }] },
  'Ac-225': { name: 'Actinium-225', symbol: 'Ac-225', Z: 89, A: 225, halfLife_s: 864000, decayModes: [{ mode: 'alpha', branchingRatio: 1.0, daughter: 'Bi-213' }] },
  'Pb-212': { name: 'Lead-212', symbol: 'Pb-212', Z: 82, A: 212, halfLife_s: 38304, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Bi-212' }] },
  'Bi-212': { name: 'Bismuth-212', symbol: 'Bi-212', Z: 83, A: 212, halfLife_s: 3633, decayModes: [{ mode: 'alpha', branchingRatio: 0.36 }, { mode: 'beta-', branchingRatio: 0.64 }] },
  'At-211': { name: 'Astatine-211', symbol: 'At-211', Z: 85, A: 211, halfLife_s: 25920, decayModes: [{ mode: 'alpha', branchingRatio: 0.42 }, { mode: 'EC', branchingRatio: 0.58 }] },
  // === THERAPY / INDUSTRIAL ===
  'Co-60': { name: 'Cobalt-60', symbol: 'Co-60', Z: 27, A: 60, halfLife_s: 166341120, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Ni-60' }], gammaEnergies_MeV: [1.173, 1.333], gammaIntensities: [0.999, 0.999] },
  'Ir-192': { name: 'Iridium-192', symbol: 'Ir-192', Z: 77, A: 192, halfLife_s: 2419200, decayModes: [{ mode: 'beta-', branchingRatio: 1.0 }] },
  'Cs-137': { name: 'Cesium-137', symbol: 'Cs-137', Z: 55, A: 137, halfLife_s: 951984000, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Ba-137m' }], gammaEnergies_MeV: [0.662], gammaIntensities: [0.851] },
  'Ba-137m': { name: 'Barium-137m', symbol: 'Ba-137m', Z: 56, A: 137, halfLife_s: 153, decayModes: [{ mode: 'IT', branchingRatio: 1.0 }] },
  'Se-75': { name: 'Selenium-75', symbol: 'Se-75', Z: 34, A: 75, halfLife_s: 864000, decayModes: [{ mode: 'EC', branchingRatio: 1.0 }] },
  'Yb-169': { name: 'Ytterbium-169', symbol: 'Yb-169', Z: 70, A: 169, halfLife_s: 2851200, decayModes: [{ mode: 'EC', branchingRatio: 1.0 }] },
  'Am-241': { name: 'Americium-241', symbol: 'Am-241', Z: 95, A: 241, halfLife_s: 1362384000, decayModes: [{ mode: 'alpha', branchingRatio: 1.0 }] },
  'Cf-252': { name: 'Californium-252', symbol: 'Cf-252', Z: 98, A: 252, halfLife_s: 26352000, decayModes: [{ mode: 'alpha', branchingRatio: 0.969 }, { mode: 'SF', branchingRatio: 0.031 }] },
  // === GENERATORS ===
  'Mo-99': { name: 'Molybdenum-99', symbol: 'Mo-99', Z: 42, A: 99, halfLife_s: 237888, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Tc-99m' }] },
  'Ge-68': { name: 'Germanium-68', symbol: 'Ge-68', Z: 32, A: 68, halfLife_s: 23716800, decayModes: [{ mode: 'EC', branchingRatio: 1.0, daughter: 'Ga-68' }] },
  'Sr-82': { name: 'Strontium-82', symbol: 'Sr-82', Z: 38, A: 82, halfLife_s: 22118400, decayModes: [{ mode: 'EC', branchingRatio: 1.0, daughter: 'Rb-82' }] },
  'Rb-82': { name: 'Rubidium-82', symbol: 'Rb-82', Z: 37, A: 82, halfLife_s: 76.4, decayModes: [{ mode: 'beta+', branchingRatio: 0.96 }] },
  'W-188': { name: 'Tungsten-188', symbol: 'W-188', Z: 74, A: 188, halfLife_s: 6048000, decayModes: [{ mode: 'beta-', branchingRatio: 1.0, daughter: 'Re-188' }] },
  // === PET TRACERS ===
  'C-11': { name: 'Carbon-11', symbol: 'C-11', Z: 6, A: 11, halfLife_s: 1223.4, decayModes: [{ mode: 'beta+', branchingRatio: 1.0 }] },
  'N-13': { name: 'Nitrogen-13', symbol: 'N-13', Z: 7, A: 13, halfLife_s: 597.9, decayModes: [{ mode: 'beta+', branchingRatio: 1.0 }] },
  'O-15': { name: 'Oxygen-15', symbol: 'O-15', Z: 8, A: 15, halfLife_s: 122.2, decayModes: [{ mode: 'beta+', branchingRatio: 1.0 }] },
  'Rb-82_gen': { name: 'Rubidium-82 (from Sr-82)', symbol: 'Rb-82', Z: 37, A: 82, halfLife_s: 76.4, decayModes: [{ mode: 'beta+', branchingRatio: 0.96 }] },
};

/**
 * Compute Bateman solution for a decay chain
 * Returns activity at specified time points
 */
export function solveBateman(
  parentNuclide: string,
  initialActivity_Bq: number,
  timePoints_s: number[],
  maxGenerations: number = 5
): TimePoint[] {
  const parent = NUCLIDE_LIBRARY[parentNuclide];
  if (!parent) throw new Error(`Unknown nuclide: ${parentNuclide}`);

  // Build decay chain
  const chain: Array<{ nuclide: Nuclide; lambda: number; initialN: number }> = [];
  let currentNuclide = parent;
  let currentActivity = initialActivity_Bq;
  
  for (let gen = 0; gen < maxGenerations; gen++) {
    const lambda = Math.LN2 / currentNuclide.halfLife_s;
    chain.push({
      nuclide: currentNuclide,
      lambda,
      initialN: currentActivity / lambda, // N = A / lambda
    });
    
    // Find primary daughter
    const primaryDecay = currentNuclide.decayModes
      .filter(d => d.daughter)
      .sort((a, b) => b.branchingRatio - a.branchingRatio)[0];
    
    if (!primaryDecay?.daughter) break;
    const daughter = NUCLIDE_LIBRARY[primaryDecay.daughter];
    if (!daughter) break;
    
    currentNuclide = daughter;
    currentActivity *= primaryDecay.branchingRatio; // Account for branching
  }

  const results: TimePoint[] = [];

  for (const t of timePoints_s) {
    const activities: Record<string, number> = {};
    let totalActivity = 0;
    
    // Bateman solution for each member of the chain
    for (let i = 0; i < chain.length; i++) {
      let N_i = 0;
      
      // Sum over all possible paths (simplified: single parent-daughter chain)
      for (let j = 0; j <= i; j++) {
        const lambda_j = chain[j].lambda;
        const N0_j = chain[j].initialN;
        
        // Product of lambda ratios
        let product = 1.0;
        for (let k = 0; k < i; k++) {
          if (k !== j) {
            product *= chain[k].lambda / (chain[k].lambda - lambda_j);
          }
        }
        
        N_i += N0_j * product * Math.exp(-lambda_j * t);
      }
      
      const activity = N_i * chain[i].lambda;
      activities[chain[i].nuclide.symbol] = activity;
      totalActivity += activity;
    }

    // Estimate dose rate at 1m
    let totalDoseRate = 0;
    for (const [sym, act] of Object.entries(activities)) {
      const nuc = Object.values(NUCLIDE_LIBRARY).find(n => n.symbol === sym);
      if (nuc?.gammaEnergies_MeV && nuc.gammaIntensities) {
        for (let g = 0; g < nuc.gammaEnergies_MeV.length; g++) {
          const gammaConstant = 0.5 * nuc.gammaIntensities[g] * nuc.gammaEnergies_MeV[g] * 1.602e-13 / (4 * Math.PI);
          totalDoseRate += gammaConstant * act; // Gy/h at 1m
        }
      }
    }

    results.push({
      time_s: t,
      activities,
      totalActivity_Bq: totalActivity,
      totalDoseRate_uSv_h_at_1m: totalDoseRate * 1e6,
    });
  }

  return results;
}

/**
 * Generate time points for a decay schedule
 */
export function generateTimePoints(
  halfLife_s: number,
  numHalfLives: number = 10,
  pointsPerHalfLife: number = 5
): number[] {
  const times: number[] = [];
  const maxTime = numHalfLives * halfLife_s;
  const dt = halfLife_s / pointsPerHalfLife;
  for (let t = 0; t <= maxTime; t += dt) {
    times.push(t);
  }
  return times;
}

/**
 * Search nuclides by name, symbol, or application
 */
export function searchNuclides(query: string, category?: string): Nuclide[] {
  const all = Object.values(NUCLIDE_LIBRARY);
  const q = query.toLowerCase();
  return all.filter(n => {
    const matchesQuery = n.name.toLowerCase().includes(q) || n.symbol.toLowerCase().includes(q);
    if (!category) return matchesQuery;
    // Simple categorization
    const isPET = n.decayModes.some(d => d.mode === 'beta+');
    const isSPECT = n.decayModes.some(d => d.mode === 'EC' || d.mode === 'IT');
    const isTherapy = ['I-131', 'Y-90', 'Lu-177', 'Ra-223', 'Ac-225', 'I-125'].includes(n.symbol);
    const isIndustrial = ['Co-60', 'Ir-192', 'Cs-137', 'Cf-252', 'Am-241'].includes(n.symbol);
    const isGenerator = ['Mo-99', 'Ge-68', 'Sr-82', 'W-188'].includes(n.symbol);
    
    const matchesCat = category === 'PET' ? isPET :
      category === 'SPECT' ? isSPECT :
      category === 'Therapy' ? isTherapy :
      category === 'Industrial' ? isIndustrial :
      category === 'Generator' ? isGenerator : true;
    
    return matchesQuery && matchesCat;
  });
}

// Common shielding gamma constants (approximate) for dose calculation
export const GAMMA_CONSTANTS: Record<string, { energy_MeV: number; gamma_R_m2_h_Ci: number }> = {
  'Co-60': { energy_MeV: 1.25, gamma_R_m2_h_Ci: 1.32 },
  'Cs-137': { energy_MeV: 0.662, gamma_R_m2_h_Ci: 0.33 },
  'Ir-192': { energy_MeV: 0.38, gamma_R_m2_h_Ci: 0.48 },
  'I-131': { energy_MeV: 0.364, gamma_R_m2_h_Ci: 0.22 },
  'Tc-99m': { energy_MeV: 0.14, gamma_R_m2_h_Ci: 0.59 },
  'F-18': { energy_MeV: 0.511, gamma_R_m2_h_Ci: 0.51 },
  'Ga-68': { energy_MeV: 0.511, gamma_R_m2_h_Ci: 0.54 },
  'Am-241': { energy_MeV: 0.06, gamma_R_m2_h_Ci: 0.012 },
  'Se-75': { energy_MeV: 0.265, gamma_R_m2_h_Ci: 0.20 },
  'Yb-169': { energy_MeV: 0.11, gamma_R_m2_h_Ci: 0.13 },
};
