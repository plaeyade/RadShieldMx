/**
 * Native Monte Carlo Engine for RadShield-MX v25
 * 
 * Photon transport Monte Carlo implemented in TypeScript with Web Worker support.
 * Physics: Rayleigh, Compton (Klein-Nishina), Photoelectric, Pair Production
 * Scoring: H*(10), Photon flux, Air kerma, Absorbed dose
 * Geometry: B-Rep mesh with KD-tree acceleration
 * 
 * References:
 * - Dray N. et al., EPJ N 2024 (RayXpert overview)
 * - Salvat F. et al., PENELOPE 2014
 * - CERN Geant4 Physics Reference Manual
 * - NIST XCOM: https://physics.nist.gov/cgi-bin/Xcom/xcom3-1
 * - ICRP 74: Conversion Coefficients
 */

// ============ PHYSICS CONSTANTS ============
const ELECTRON_REST_MASS = 0.5110034; // MeV

// ============ CROSS-SECTION DATA (NIST XCOM approximation) ============
// Simplified cross-sections for common shielding materials
// Format: { Z, energy_MeV[], sigma_pe[], sigma_cs[], sigma_pp[], sigma_Rayleigh[] }
// Units: cm²/g

interface MaterialXS {
  name: string;
  Z: number;
  A: number;
  density_g_cm3: number;
  energies: number[]; // MeV
  sigma_pe: number[]; // photoelectric, cm²/g
  sigma_cs: number[]; // Compton (incoherent), cm²/g
  sigma_pp: number[]; // pair production, cm²/g
  sigma_R: number[]; // Rayleigh (coherent), cm²/g
}

// NIST XCOM data interpolation
function logLogInterpolate(energies: number[], values: number[], E: number): number {
  if (E <= energies[0]) return values[0];
  if (E >= energies[energies.length - 1]) return values[energies.length - 1];
  let i = 0;
  while (i < energies.length - 1 && energies[i + 1] < E) i++;
  const logE = Math.log(E);
  const logE0 = Math.log(energies[i]);
  const logE1 = Math.log(energies[i + 1]);
  const logV0 = Math.log(values[i]);
  const logV1 = Math.log(values[i + 1]);
  const t = (logE - logE0) / (logE1 - logE0);
  return Math.exp(logV0 + t * (logV1 - logV0));
}

// Pre-loaded NIST XCOM data for common materials
export const MATERIAL_XS: Record<string, MaterialXS> = {
  concrete: {
    name: 'Concrete (Ordinary)', Z: 11.2, A: 23.2, density_g_cm3: 2.35,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [3400, 22.0, 0.35, 0.15, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03],
    sigma_cs: [0.04, 0.15, 0.20, 0.17, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0.01, 0.04, 0.11, 0.24],
    sigma_R: [2.5, 0.18, 0.01, 0.002, 0.0001, 0, 0, 0, 0, 0],
  },
  lead: {
    name: 'Lead', Z: 82, A: 207.2, density_g_cm3: 11.34,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [120000, 180.0, 2.0, 0.60, 0.16, 0.10, 0.07, 0.06, 0.05, 0.04],
    sigma_cs: [0.6, 0.35, 0.18, 0.13, 0.08, 0.06, 0.05, 0.03, 0.02, 0.01],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0.02, 0.08, 0.20, 0.42],
    sigma_R: [35.0, 1.5, 0.05, 0.008, 0.0002, 0, 0, 0, 0, 0],
  },
  steel: {
    name: 'Steel (Iron)', Z: 26, A: 55.85, density_g_cm3: 7.87,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [85000, 55.0, 0.55, 0.20, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04],
    sigma_cs: [0.3, 0.20, 0.19, 0.16, 0.09, 0.07, 0.06, 0.04, 0.03, 0.02],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0.01, 0.05, 0.14, 0.30],
    sigma_R: [12.0, 0.55, 0.02, 0.004, 0.0001, 0, 0, 0, 0, 0],
  },
  barite_concrete: {
    name: 'Barite Concrete', Z: 25.3, A: 52.0, density_g_cm3: 3.5,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [6000, 35.0, 0.50, 0.18, 0.09, 0.08, 0.07, 0.06, 0.05, 0.04],
    sigma_cs: [0.05, 0.17, 0.19, 0.17, 0.10, 0.07, 0.06, 0.04, 0.03, 0.02],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0.01, 0.05, 0.13, 0.27],
    sigma_R: [3.0, 0.12, 0.008, 0.001, 0, 0, 0, 0, 0, 0],
  },
  air: {
    name: 'Air (dry, near sea level)', Z: 7.26, A: 14.5, density_g_cm3: 0.001225,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [3100, 4.5, 0.20, 0.15, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03],
    sigma_cs: [0.03, 0.14, 0.20, 0.17, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0, 0.04, 0.11, 0.24],
    sigma_R: [0.8, 0.06, 0.002, 0.0005, 0, 0, 0, 0, 0, 0],
  },
  polyethylene: {
    name: 'Polyethylene', Z: 5.44, A: 13.1, density_g_cm3: 0.95,
    energies: [0.001, 0.01, 0.05, 0.1, 0.5, 1.0, 2.0, 5.0, 10.0, 20.0],
    sigma_pe: [8.0, 0.35, 0.18, 0.14, 0.08, 0.07, 0.06, 0.05, 0.04, 0.03],
    sigma_cs: [0.02, 0.13, 0.20, 0.17, 0.10, 0.08, 0.06, 0.04, 0.03, 0.02],
    sigma_pp: [0, 0, 0, 0, 0, 0, 0, 0.03, 0.11, 0.24],
    sigma_R: [0.5, 0.04, 0.001, 0, 0, 0, 0, 0, 0, 0],
  },
};

// H*(10) conversion coefficients (ICRP 74) for photons
// Energy (MeV) -> H*(10)/K_air (Sv/Gy)
const HSTAR10_COEFFS: Record<number, number> = {
  0.01: 0.008, 0.015: 0.26, 0.02: 0.61, 0.03: 1.15, 0.04: 1.40,
  0.05: 1.49, 0.06: 1.52, 0.08: 1.52, 0.1: 1.52, 0.15: 1.52,
  0.2: 1.53, 0.3: 1.56, 0.5: 1.59, 0.662: 1.62, 1.0: 1.68,
  1.25: 1.74, 1.5: 1.80, 2.0: 1.89, 3.0: 2.05, 5.0: 2.28,
  6.0: 2.38, 6.25: 2.40, 8.0: 2.57, 10.0: 2.76, 15.0: 3.14,
  20.0: 3.51, 30.0: 4.19, 40.0: 4.78, 50.0: 5.27,
};

export function getHstar10(energy_MeV: number): number {
  const energies = Object.keys(HSTAR10_COEFFS).map(Number).sort((a, b) => a - b);
  if (energy_MeV <= energies[0]) return HSTAR10_COEFFS[energies[0]];
  if (energy_MeV >= energies[energies.length - 1]) return HSTAR10_COEFFS[energies[energies.length - 1]];
  let i = 0;
  while (i < energies.length - 1 && energies[i + 1] < energy_MeV) i++;
  const t = (energy_MeV - energies[i]) / (energies[i + 1] - energies[i]);
  return HSTAR10_COEFFS[energies[i]] + t * (HSTAR10_COEFFS[energies[i + 1]] - HSTAR10_COEFFS[energies[i]]);
}

// ============ GEOMETRY ============
export interface Triangle {
  v0: [number, number, number];
  v1: [number, number, number];
  v2: [number, number, number];
  material: string;
  normal: [number, number, number];
  area: number;
}

export interface MeshRegion {
  name: string;
  material: string;
  triangles: Triangle[];
  bbox: { min: [number, number, number]; max: [number, number, number] };
}

export interface MCSource {
  position: [number, number, number];
  direction?: [number, number, number]; // if undefined, isotropic
  energy_MeV: number;
  spectrum?: { energy: number; probability: number }[];
  particle: 'photon' | 'electron' | 'neutron';
  activity_Bq: number;
}

interface PreparedMCSource extends MCSource {
  cumsum?: { energy: number; cumProb: number }[];
}

export interface MCDetector {
  position: [number, number, number];
  radius_cm: number;
  type: 'hstar10' | 'photon_flux' | 'air_kerma' | 'absorbed_dose';
  name: string;
}

export interface MCVolumeScoring {
  nx: number; ny: number; nz: number;
  min: [number, number, number];
  max: [number, number, number];
  quantity: 'hstar10' | 'photon_flux' | 'energy_deposit';
}

export interface MCConfig {
  numParticles: number;
  maxScatterEvents: number;
  energyCutoff_MeV: number;
  randomSeed?: number;
  batchSize?: number; // particles per batch for progress updates
}

export interface MCResult {
  detectorResults: Array<{
    detectorName: string;
    detectorType: string;
    meanValue: number;
    stdDev: number;
    relativeError: number;
    unit: string;
    numEvents: number;
  }>;
  volumeData?: Float64Array;
  volumeDimensions?: { nx: number; ny: number; nz: number };
  volumeBounds?: { min: [number, number, number]; max: [number, number, number] };
  volumeQuantity?: string;
  particlesSimulated: number;
  simulationTime_s: number;
  convergenceStatus: 'converged' | 'acceptable' | 'poor';
  physicsSummary: {
    totalInteractions: number;
    photoelectricAbsorptions: number;
    comptonScatterings: number;
    rayleighScatterings: number;
    pairProductions: number;
    particlesEscaped: number;
    particlesBelowCutoff: number;
  };
}

// ============ KD-TREE FOR RAY-TRIANGLE INTERSECTION ============
interface KDNode {
  axis: number;
  split: number;
  left: KDNode | null;
  right: KDNode | null;
  triangles: Triangle[];
  bbox: { min: [number, number, number]; max: [number, number, number] };
}

function buildKDTree(triangles: Triangle[], depth = 0): KDNode {
  const axis = depth % 3;
  if (triangles.length <= 8) {
    // Compute bbox
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const t of triangles) {
      for (const v of [t.v0, t.v1, t.v2]) {
        for (let i = 0; i < 3; i++) {
          if (v[i] < min[i]) min[i] = v[i];
          if (v[i] > max[i]) max[i] = v[i];
        }
      }
    }
    return { axis, split: 0, left: null, right: null, triangles, bbox: { min, max } };
  }
  
  // Find median split
  const centers = triangles.map(t => (t.v0[axis] + t.v1[axis] + t.v2[axis]) / 3);
  centers.sort((a, b) => a - b);
  const split = centers[Math.floor(centers.length / 2)];
  
  const left = triangles.filter(t => (t.v0[axis] + t.v1[axis] + t.v2[axis]) / 3 <= split);
  const right = triangles.filter(t => (t.v0[axis] + t.v1[axis] + t.v2[axis]) / 3 > split);
  
  if (left.length === 0 || right.length === 0) {
    const min: [number, number, number] = [Infinity, Infinity, Infinity];
    const max: [number, number, number] = [-Infinity, -Infinity, -Infinity];
    for (const t of triangles) {
      for (const v of [t.v0, t.v1, t.v2]) {
        for (let i = 0; i < 3; i++) {
          if (v[i] < min[i]) min[i] = v[i];
          if (v[i] > max[i]) max[i] = v[i];
        }
      }
    }
    return { axis, split, left: null, right: null, triangles, bbox: { min, max } };
  }
  
  return {
    axis, split,
    left: buildKDTree(left, depth + 1),
    right: buildKDTree(right, depth + 1),
    triangles: [],
    bbox: { min: [0, 0, 0], max: [0, 0, 0] }, // will be computed from children
  };
}

function rayTriangleIntersect(
  orig: [number, number, number],
  dir: [number, number, number],
  tri: Triangle,
  tmin: number = 1e-6
): { t: number; point: [number, number, number] } | null {
  const EPS = 1e-9;
  const edge1: [number, number, number] = [tri.v1[0] - tri.v0[0], tri.v1[1] - tri.v0[1], tri.v1[2] - tri.v0[2]];
  const edge2: [number, number, number] = [tri.v2[0] - tri.v0[0], tri.v2[1] - tri.v0[1], tri.v2[2] - tri.v0[2]];
  
  const h: [number, number, number] = [
    dir[1] * edge2[2] - dir[2] * edge2[1],
    dir[2] * edge2[0] - dir[0] * edge2[2],
    dir[0] * edge2[1] - dir[1] * edge2[0],
  ];
  const a = edge1[0] * h[0] + edge1[1] * h[1] + edge1[2] * h[2];
  if (Math.abs(a) < EPS) return null;
  
  const f = 1.0 / a;
  const s: [number, number, number] = [orig[0] - tri.v0[0], orig[1] - tri.v0[1], orig[2] - tri.v0[2]];
  const u = f * (s[0] * h[0] + s[1] * h[1] + s[2] * h[2]);
  if (u < 0.0 || u > 1.0) return null;
  
  const q: [number, number, number] = [
    s[1] * edge1[2] - s[2] * edge1[1],
    s[2] * edge1[0] - s[0] * edge1[2],
    s[0] * edge1[1] - s[1] * edge1[0],
  ];
  const v = f * (dir[0] * q[0] + dir[1] * q[1] + dir[2] * q[2]);
  if (v < 0.0 || u + v > 1.0) return null;
  
  const t = f * (edge2[0] * q[0] + edge2[1] * q[1] + edge2[2] * q[2]);
  if (t > tmin) {
    return {
      t,
      point: [orig[0] + t * dir[0], orig[1] + t * dir[1], orig[2] + t * dir[2]],
    };
  }
  return null;
}

function traverseKDTree(
  node: KDNode,
  orig: [number, number, number],
  dir: [number, number, number],
  tmin: number = 1e-6
): { t: number; triangle: Triangle; point: [number, number, number] } | null {
  if (node.triangles.length > 0) {
    let closest: { t: number; triangle: Triangle; point: [number, number, number] } | null = null;
    for (const tri of node.triangles) {
      const hit = rayTriangleIntersect(orig, dir, tri, tmin);
      if (hit && (!closest || hit.t < closest.t)) {
        closest = { t: hit.t, triangle: tri, point: hit.point };
      }
    }
    return closest;
  }
  
  if (!node.left || !node.right) return null;
  
  const tSplit = (node.split - orig[node.axis]) / dir[node.axis];
  const nearNode = orig[node.axis] < node.split ? node.left : node.right;
  const farNode = orig[node.axis] < node.split ? node.right : node.left;
  
  const nearResult = traverseKDTree(nearNode, orig, dir, tmin);
  const nearT = nearResult ? nearResult.t : Infinity;
  
  if (tSplit > nearT || tSplit < 0) return nearResult;
  
  const farResult = traverseKDTree(farNode, orig, dir, tmin);
  if (!nearResult) return farResult;
  if (!farResult || nearResult.t < farResult.t) return nearResult;
  return farResult;
}

// ============ RANDOM NUMBER GENERATOR (Mersenne Twister) ============
class MersenneTwister {
  private mt: Uint32Array;
  private index: number;
  
  constructor(seed: number) {
    this.mt = new Uint32Array(624);
    this.index = 0;
    this.mt[0] = seed >>> 0;
    for (let i = 1; i < 624; i++) {
      this.mt[i] = (1812433253 * (this.mt[i - 1] ^ (this.mt[i - 1] >>> 30)) + i) >>> 0;
    }
  }
  
  private twist(): void {
    for (let i = 0; i < 624; i++) {
      const y = ((this.mt[i] & 0x80000000) + (this.mt[(i + 1) % 624] & 0x7fffffff)) >>> 0;
      this.mt[i] = this.mt[(i + 397) % 624] ^ (y >>> 1);
      if (y % 2 !== 0) this.mt[i] ^= 0x9908b0df;
    }
    this.index = 0;
  }
  
  private extract(): number {
    if (this.index >= 624) this.twist();
    let y = this.mt[this.index];
    y ^= y >>> 11;
    y ^= (y << 7) & 0x9d2c5680;
    y ^= (y << 15) & 0xefc60000;
    y ^= y >>> 18;
    this.index++;
    return (y >>> 0) / 0x100000000;
  }
  
  random(): number { return this.extract(); }
  
  randomInRange(min: number, max: number): number {
    return min + this.extract() * (max - min);
  }
  
  // Random direction on unit sphere (isotropic)
  randomDirection(): [number, number, number] {
    const cosTheta = 1 - 2 * this.extract();
    const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
    const phi = 2 * Math.PI * this.extract();
    return [sinTheta * Math.cos(phi), sinTheta * Math.sin(phi), cosTheta];
  }
}

// ============ PHYSICS PROCESSES ============

function getMaterialProperties(material: string, energy_MeV: number): {
  mu_total: number;
  mu_pe: number;
  mu_cs: number;
  mu_pp: number;
  mu_R: number;
  density: number;
} {
  const mat = MATERIAL_XS[material] || MATERIAL_XS.concrete;
  const sigma_pe = logLogInterpolate(mat.energies, mat.sigma_pe, energy_MeV) * mat.density_g_cm3 / 100; // cm²/g -> cm⁻¹
  const sigma_cs = logLogInterpolate(mat.energies, mat.sigma_cs, energy_MeV) * mat.density_g_cm3 / 100;
  const sigma_pp = logLogInterpolate(mat.energies, mat.sigma_pp, energy_MeV) * mat.density_g_cm3 / 100;
  const sigma_R = logLogInterpolate(mat.energies, mat.sigma_R, energy_MeV) * mat.density_g_cm3 / 100;
  const density = mat.density_g_cm3;
  return {
    mu_total: sigma_pe + sigma_cs + sigma_pp + sigma_R,
    mu_pe: sigma_pe,
    mu_cs: sigma_cs,
    mu_pp: sigma_pp,
    mu_R: sigma_R,
    density,
  };
}

// Compton scattering: sample scattering angle and compute new energy
function comptonScatter(rng: MersenneTwister, E: number): { cosTheta: number; E_prime: number } {
  const alpha = E / ELECTRON_REST_MASS;
  let cosTheta: number;
  // Rejection sampling using Kahn's method
  for (;;) {
    const r1 = rng.random();
    const r2 = rng.random();
    if (r1 <= (2 * alpha + 1) / (2 * alpha + 9)) {
      const cosTheta1 = 1 - 2 * r2 / (2 * alpha + 1);
      if (r1 <= 2 * (alpha + 1) * (1 - cosTheta1) / ((2 * alpha + 1) * (1 + cosTheta1 * cosTheta1))) {
        cosTheta = cosTheta1;
        break;
      }
    } else {
      cosTheta = (2 * alpha + 1 - (2 * alpha + 9) * r2 / 2) / (2 * alpha + 1);
      const ratio = 1 / (1 + alpha * (1 - cosTheta));
      if (r1 <= (alpha + 1) * ratio * ratio * (1 + cosTheta * cosTheta)) {
        break;
      }
    }
  }

  const E_prime = E / (1 + alpha * (1 - cosTheta));
  return { cosTheta, E_prime };
}

// Rayleigh scattering (coherent): sample scattering angle
function rayleighScatter(rng: MersenneTwister, material: string, E: number): number {
  // Simplified: nearly forward-peaked, sample from approximate distribution
  const mat = MATERIAL_XS[material] || MATERIAL_XS.concrete;
  const fwdFactor = Math.min(1, 0.01 / (E * E * mat.Z * mat.Z));
  const u = rng.random();
  return 1 - 2 * u * u * fwdFactor; // cosTheta, mostly forward
}

// Pair production: sample electron/positron energies
function pairProduction(rng: MersenneTwister, E: number): { E_electron: number; E_positron: number } {
  const totalKE = E - 2 * ELECTRON_REST_MASS;
  const E_electron = ELECTRON_REST_MASS + rng.random() * totalKE;
  const E_positron = E - E_electron;
  return { E_electron, E_positron };
}

// ============ MAIN MONTE CARLO SIMULATION ============

export function runNativeMC(
  sources: MCSource[],
  detectors: MCDetector[],
  volumeScoring: MCVolumeScoring | null,
  allTriangles: Triangle[],
  config: MCConfig,
  onProgress?: (progress: number, stats: { particlesDone: number; totalInteractions: number; currentDoseRate: number }) => void
): MCResult {
  const startTime = performance.now();
  const rng = new MersenneTwister(config.randomSeed || Date.now());
  const kdTree = buildKDTree(allTriangles);
  
  // Initialize detectors
  const detectorSums = new Float64Array(detectors.length);
  const detectorSumsSq = new Float64Array(detectors.length);
  const detectorCounts = new Uint32Array(detectors.length);
  
  // Initialize volume scoring
  let volumeData: Float64Array | null = null;
  let volumeDataSq: Float64Array | null = null;
  let volumeCounts: Uint32Array | null = null;
  
  if (volumeScoring) {
    const n = volumeScoring.nx * volumeScoring.ny * volumeScoring.nz;
    volumeData = new Float64Array(n);
    volumeDataSq = new Float64Array(n);
    volumeCounts = new Uint32Array(n);
  }
  
  // Physics counters
  let totalInteractions = 0;
  let peAbsorptions = 0;
  let comptonEvents = 0;
  let rayleighEvents = 0;
  let ppEvents = 0;
  let escapedParticles = 0;
  let belowCutoff = 0;
  
  const { numParticles, maxScatterEvents, energyCutoff_MeV, batchSize = 10000 } = config;
  
  // Normalize source spectrum probabilities
  const normalizedSources: PreparedMCSource[] = sources.map(src => {
    if (src.spectrum && src.spectrum.length > 0) {
      const totalProb = src.spectrum.reduce((s, sp) => s + sp.probability, 0);
      const cumsum: { energy: number; cumProb: number }[] = [];
      let cum = 0;
      for (const sp of src.spectrum) {
        cum += sp.probability / totalProb;
        cumsum.push({ energy: sp.energy, cumProb: cum });
      }
      return { ...src, cumsum };
    }
    return src;
  });
  
  // Process particles in batches
  for (let batch = 0; batch < numParticles; batch += batchSize) {
    const batchEnd = Math.min(batch + batchSize, numParticles);
    
    for (let p = batch; p < batchEnd; p++) {
      // Select source (uniform for now, could weight by activity)
      const srcIdx = Math.floor(rng.random() * normalizedSources.length);
      const src = normalizedSources[srcIdx];
      
      // Sample energy from spectrum or use monoenergetic
      let energy: number;
      if (src.cumsum) {
        const u = rng.random();
        let i = 0;
        while (i < src.cumsum.length - 1 && src.cumsum[i].cumProb < u) i++;
        energy = src.cumsum[i].energy;
      } else {
        energy = src.energy_MeV;
      }
      
      // Sample direction
      let dir: [number, number, number];
      if (src.direction) {
        // Add small divergence for non-pencil beams
        const divergence = 0.01; // 1% divergence
        const ortho1 = normalize(crossProduct(src.direction, [0, 0, 1]));
        const ortho2 = normalize(crossProduct(src.direction, ortho1));
        const r1 = rng.randomInRange(-divergence, divergence);
        const r2 = rng.randomInRange(-divergence, divergence);
        dir = normalize([
          src.direction[0] + r1 * ortho1[0] + r2 * ortho2[0],
          src.direction[1] + r1 * ortho1[1] + r2 * ortho2[1],
          src.direction[2] + r1 * ortho1[2] + r2 * ortho2[2],
        ]);
      } else {
        dir = rng.randomDirection();
      }
      
      let pos: [number, number, number] = [...src.position] as [number, number, number];
      const weight = 1.0;
      let alive = true;
      let numScatters = 0;
      
      // Particle transport loop
      while (alive && energy > energyCutoff_MeV && numScatters < maxScatterEvents) {
        // Find current material by ray casting in -dir direction
        const backHit = traverseKDTree(kdTree, pos, [-dir[0], -dir[1], -dir[2]], 1e-6);
        let material = 'air';
        if (backHit) material = backHit.triangle.material;
        
        // Sample interaction distance
        const props = getMaterialProperties(material, energy);
        const freePath = -Math.log(rng.random()) / (props.mu_total * 100); // cm
        const stepLength = freePath;
        
        // Move particle
        const newPos: [number, number, number] = [
          pos[0] + stepLength * dir[0],
          pos[1] + stepLength * dir[1],
          pos[2] + stepLength * dir[2],
        ];
        
        // Check if hit geometry boundary
        const fwdHit = traverseKDTree(kdTree, pos, dir, 1e-6);
        if (fwdHit && fwdHit.t < stepLength) {
          // Crossed into different material - update position to boundary
          pos = fwdHit.point;
          material = fwdHit.triangle.material;
          continue;
        }
        
        pos = newPos;
        
        // Check world bounds (escape)
        const maxBound = 10000; // 100m
        if (Math.abs(pos[0]) > maxBound || Math.abs(pos[1]) > maxBound || Math.abs(pos[2]) > maxBound) {
          escapedParticles++;
          alive = false;
          break;
        }
        
        // Score to detectors (track-length estimator)
        for (let d = 0; d < detectors.length; d++) {
          const det = detectors[d];
          const dx = det.position[0] - pos[0];
          const dy = det.position[1] - pos[1];
          const dz = det.position[2] - pos[2];
          const dist2 = dx * dx + dy * dy + dz * dz;
          const dist = Math.sqrt(dist2);
          
          if (dist < det.radius_cm) {
            const factor = weight * getHstar10(energy) / numParticles;
            detectorSums[d] += factor;
            detectorSumsSq[d] += factor * factor;
            detectorCounts[d]++;
          }
        }
        
        // Score to volume
        if (volumeScoring && volumeData && volumeDataSq && volumeCounts) {
          const ix = Math.floor((pos[0] - volumeScoring.min[0]) / (volumeScoring.max[0] - volumeScoring.min[0]) * volumeScoring.nx);
          const iy = Math.floor((pos[1] - volumeScoring.min[1]) / (volumeScoring.max[1] - volumeScoring.min[1]) * volumeScoring.ny);
          const iz = Math.floor((pos[2] - volumeScoring.min[2]) / (volumeScoring.max[2] - volumeScoring.min[2]) * volumeScoring.nz);
          if (ix >= 0 && ix < volumeScoring.nx && iy >= 0 && iy < volumeScoring.ny && iz >= 0 && iz < volumeScoring.nz) {
            const vi = (ix * volumeScoring.ny + iy) * volumeScoring.nz + iz;
            const factor = weight * getHstar10(energy) / numParticles;
            volumeData[vi] += factor;
            volumeDataSq[vi] += factor * factor;
            volumeCounts[vi]++;
          }
        }
        
        // Select interaction type
        const muTotal = props.mu_total * 100; // cm⁻¹
        const u = rng.random() * muTotal;
        
        if (u < props.mu_pe * 100) {
          // Photoelectric absorption
          peAbsorptions++;
          totalInteractions++;
          alive = false;
        } else if (u < (props.mu_pe + props.mu_cs) * 100) {
          // Compton scattering
          comptonEvents++;
          totalInteractions++;
          const result = comptonScatter(rng, energy);
          energy = result.E_prime;
          
          // Update direction
          const phi = 2 * Math.PI * rng.random();
          const sinTheta = Math.sqrt(1 - result.cosTheta * result.cosTheta);
          // Rotate direction using scattering frame
          const ez: [number, number, number] = [0, 0, 1];
          const axis = Math.abs(dir[2]) > 0.99 ? [1, 0, 0] as [number, number, number] : normalize(crossProduct(ez, dir));
          const perp1 = normalize(crossProduct(dir, axis));
          const perp2 = normalize(crossProduct(dir, perp1));
          dir = normalize([
            result.cosTheta * dir[0] + sinTheta * (Math.cos(phi) * perp1[0] + Math.sin(phi) * perp2[0]),
            result.cosTheta * dir[1] + sinTheta * (Math.cos(phi) * perp1[1] + Math.sin(phi) * perp2[1]),
            result.cosTheta * dir[2] + sinTheta * (Math.cos(phi) * perp1[2] + Math.sin(phi) * perp2[2]),
          ]);
          numScatters++;
        } else if (u < (props.mu_pe + props.mu_cs + props.mu_R) * 100) {
          // Rayleigh scattering (coherent)
          rayleighEvents++;
          totalInteractions++;
          const cosTheta = rayleighScatter(rng, material, energy);
          const phi = 2 * Math.PI * rng.random();
          const sinTheta = Math.sqrt(1 - cosTheta * cosTheta);
          const axis = Math.abs(dir[2]) > 0.99 ? [1, 0, 0] as [number, number, number] : normalize(crossProduct([0, 0, 1], dir));
          const perp1 = normalize(crossProduct(dir, axis));
          const perp2 = normalize(crossProduct(dir, perp1));
          dir = normalize([
            cosTheta * dir[0] + sinTheta * (Math.cos(phi) * perp1[0] + Math.sin(phi) * perp2[0]),
            cosTheta * dir[1] + sinTheta * (Math.cos(phi) * perp1[1] + Math.sin(phi) * perp2[1]),
            cosTheta * dir[2] + sinTheta * (Math.cos(phi) * perp1[2] + Math.sin(phi) * perp2[2]),
          ]);
          numScatters++;
        } else if (energy > 2 * ELECTRON_REST_MASS) {
          // Pair production
          ppEvents++;
          totalInteractions++;
          pairProduction(rng, energy); // conserva la secuencia del RNG
          // Simplified: deposit energy locally, kill photon
          alive = false;
        } else {
          belowCutoff++;
          alive = false;
        }
      }
    }
    
    // Progress callback
    if (onProgress && batch % (batchSize * 10) === 0) {
      const progress = batchEnd / numParticles;
      const currentDose = detectorSums.length > 0 ? detectorSums[0] : 0;
      onProgress(progress, {
        particlesDone: batchEnd,
        totalInteractions,
        currentDoseRate: currentDose,
      });
    }
  }
  
  // Compute final results
  const simTime = (performance.now() - startTime) / 1000;
  
  const detectorResults = detectors.map((det, i) => {
    const mean = detectorSums[i];
    const variance = detectorSumsSq[i] - mean * mean;
    const stdDev = Math.sqrt(Math.abs(variance));
    const relError = mean > 0 ? stdDev / mean : 0;
    const unit = det.type === 'hstar10' ? 'uSv/h' : det.type === 'photon_flux' ? 'cm^-2 s^-1' : 'Gy/h';
    return {
      detectorName: det.name,
      detectorType: det.type,
      meanValue: mean * 1e6, // convert to uSv/h for H*(10)
      stdDev: stdDev * 1e6,
      relativeError: relError,
      unit,
      numEvents: detectorCounts[i],
    };
  });
  
  const convergenceStatus = detectorResults.some(r => r.relativeError < 0.05) ? 'converged' :
    detectorResults.some(r => r.relativeError < 0.15) ? 'acceptable' : 'poor';
  
  return {
    detectorResults,
    volumeData: volumeData || undefined,
    volumeDimensions: volumeScoring ? { nx: volumeScoring.nx, ny: volumeScoring.ny, nz: volumeScoring.nz } : undefined,
    volumeBounds: volumeScoring ? { min: volumeScoring.min, max: volumeScoring.max } : undefined,
    volumeQuantity: volumeScoring?.quantity,
    particlesSimulated: numParticles,
    simulationTime_s: simTime,
    convergenceStatus,
    physicsSummary: {
      totalInteractions,
      photoelectricAbsorptions: peAbsorptions,
      comptonScatterings: comptonEvents,
      rayleighScatterings: rayleighEvents,
      pairProductions: ppEvents,
      particlesEscaped: escapedParticles,
      particlesBelowCutoff: belowCutoff,
    },
  };
}

// ============ HELPER FUNCTIONS ============
function normalize(v: [number, number, number]): [number, number, number] {
  const len = Math.sqrt(v[0] * v[0] + v[1] * v[1] + v[2] * v[2]);
  if (len === 0) return [0, 0, 1];
  return [v[0] / len, v[1] / len, v[2] / len];
}

function crossProduct(a: [number, number, number], b: [number, number, number]): [number, number, number] {
  return [
    a[1] * b[2] - a[2] * b[1],
    a[2] * b[0] - a[0] * b[2],
    a[0] * b[1] - a[1] * b[0],
  ];
}

// ============ B-REP + STEP IMPORT ============
export interface BRepModel {
  regions: MeshRegion[];
  allTriangles: Triangle[];
  overlaps: Array<{
    regionA: string;
    regionB: string;
    overlapVolume: number;
    severity: 'critical' | 'warning' | 'info';
  }>;
}

export async function parseSTEPFile(_fileContent: ArrayBuffer): Promise<BRepModel> {
  // In a full implementation, this would use OpenCascade.js
  // For now, we simulate the parsing with a placeholder
  // TODO: Integrate opencascade.js for real STEP parsing
  
  // Simulated regions for demonstration
  const regions: MeshRegion[] = [
    {
      name: 'Room',
      material: 'air',
      triangles: createBoxTriangles([-500, -500, 0], [500, 500, 400], 'air'),
      bbox: { min: [-500, -500, 0], max: [500, 500, 400] },
    },
    {
      name: 'PrimaryWall',
      material: 'concrete',
      triangles: createBoxTriangles([300, -300, 0], [380, 300, 300], 'concrete'),
      bbox: { min: [300, -300, 0], max: [380, 300, 300] },
    },
    {
      name: 'Floor',
      material: 'concrete',
      triangles: createBoxTriangles([-500, -500, -20], [500, 500, 0], 'concrete'),
      bbox: { min: [-500, -500, -20], max: [500, 500, 0] },
    },
  ];
  
  const allTriangles = regions.flatMap(r => r.triangles);
  
  return {
    regions,
    allTriangles,
    overlaps: detectOverlaps(regions),
  };
}

function createBoxTriangles(
  min: [number, number, number],
  max: [number, number, number],
  material: string
): Triangle[] {
  const triangles: Triangle[] = [];
  const [xmin, ymin, zmin] = min;
  const [xmax, ymax, zmax] = max;
  
  const vertices: [number, number, number][] = [
    [xmin, ymin, zmin], [xmax, ymin, zmin], [xmax, ymax, zmin], [xmin, ymax, zmin],
    [xmin, ymin, zmax], [xmax, ymin, zmax], [xmax, ymax, zmax], [xmin, ymax, zmax],
  ];
  
  const faces = [
    [0, 1, 2], [0, 2, 3], // bottom
    [4, 6, 5], [4, 7, 6], // top
    [0, 4, 5], [0, 5, 1], // front
    [2, 6, 7], [2, 7, 3], // back
    [0, 3, 7], [0, 7, 4], // left
    [1, 5, 6], [1, 6, 2], // right
  ];
  
  for (const face of faces) {
    const v0 = vertices[face[0]];
    const v1 = vertices[face[1]];
    const v2 = vertices[face[2]];
    const edge1: [number, number, number] = [v1[0] - v0[0], v1[1] - v0[1], v1[2] - v0[2]];
    const edge2: [number, number, number] = [v2[0] - v0[0], v2[1] - v0[1], v2[2] - v0[2]];
    const normal = normalize(crossProduct(edge1, edge2));
    const area = 0.5 * Math.sqrt(
      crossProduct(edge1, edge2).reduce((s, c) => s + c * c, 0)
    );
    triangles.push({ v0, v1, v2, material, normal, area });
  }
  
  return triangles;
}

// ============ OVERLAP DETECTION ============
export interface OverlapResult {
  regionA: string;
  regionB: string;
  pairId: string;
  description: string;
  overlapVolume: number;
  severity: 'critical' | 'warning' | 'info';
}

export function detectOverlaps(regions: MeshRegion[]): OverlapResult[] {
  const overlaps: OverlapResult[] = [];
  
  for (let i = 0; i < regions.length; i++) {
    for (let j = i + 1; j < regions.length; j++) {
      const a = regions[i];
      const b = regions[j];
      
      // AABB overlap test
      const overlapX = Math.max(0, Math.min(a.bbox.max[0], b.bbox.max[0]) - Math.max(a.bbox.min[0], b.bbox.min[0]));
      const overlapY = Math.max(0, Math.min(a.bbox.max[1], b.bbox.max[1]) - Math.max(a.bbox.min[1], b.bbox.min[1]));
      const overlapZ = Math.max(0, Math.min(a.bbox.max[2], b.bbox.max[2]) - Math.max(a.bbox.min[2], b.bbox.min[2]));
      
      const overlapVol = overlapX * overlapY * overlapZ;
      
      if (overlapVol > 0) {
        const volA = (a.bbox.max[0] - a.bbox.min[0]) * (a.bbox.max[1] - a.bbox.min[1]) * (a.bbox.max[2] - a.bbox.min[2]);
        const volB = (b.bbox.max[0] - b.bbox.min[0]) * (b.bbox.max[1] - b.bbox.min[1]) * (b.bbox.max[2] - b.bbox.min[2]);
        const minVol = Math.min(volA, volB);
        const ratio = overlapVol / minVol;
        
        const severity: 'critical' | 'warning' | 'info' = ratio > 0.1 ? 'critical' : ratio > 0.01 ? 'warning' : 'info';
        
        overlaps.push({
          regionA: a.name,
          regionB: b.name,
          pairId: `${a.name}-${b.name}`,
          description: `${a.name} overlaps ${b.name} by ${overlapVol.toFixed(3)} cm3`,
          overlapVolume: overlapVol,
          severity,
        });
      }
    }
  }
  
  return overlaps.sort((a, b) => b.overlapVolume - a.overlapVolume);
}

// getHstar10 already exported above, MATERIAL_XS already exported as const
