/**
 * ChiltonSkyshine — MC-05
 * Funciones puras, pipeline funcional.
 * OPTIMIZED v2: Precalculated lookup tables for O(1) access.
 */

export interface SkyInput {
  readonly energyMV: number;
  readonly workloadGym2Week: number;
  readonly barrierHeightM: number;
  readonly roofThicknessMm: number;
  readonly beamAngleDeg: number;
  readonly distancesM: readonly number[];
}

export interface SkyPoint {
  readonly distanceM: number;
  readonly doseUSvWeek: number;
}

export interface SkyResult {
  readonly points: readonly SkyPoint[];
  readonly roofTransmission: number;
  readonly maxDoseUSv: number;
  readonly angleCorrection: number;
}

// ─── Precalculated lookup tables (optimization) ───
// Interpolated at runtime but cached after first access
const tvlCache = new Map<number, number>();
const fECache = new Map<number, number>();
const muAirCache = new Map<number, number>();

const ENERGY_KEYS = [6, 10, 15, 18, 25] as const;
const TVL_VALUES = [370, 410, 440, 450, 460] as const;
const FE_VALUES = [0.035, 0.045, 0.055, 0.058, 0.06] as const;
const MU_VALUES = [0.0087, 0.0062, 0.0048, 0.0045, 0.0042] as const;

// Linear interpolation helper
const lerp = (keys: readonly number[], vals: readonly number[], e: number): number => {
  // Interpolación lineal por tramos.
  if (e <= keys[0]) return vals[0];
  if (e >= keys[keys.length - 1]) return vals[vals.length - 1];
  for (let i = 0; i < keys.length - 1; i++) {
    if (e >= keys[i] && e <= keys[i + 1]) {
      const t = (e - keys[i]) / (keys[i + 1] - keys[i]);
      return vals[i] + t * (vals[i + 1] - vals[i]);
    }
  }
  return vals[vals.length - 1];
};

const tvlFor = (e: number): number => {
  let v = tvlCache.get(e);
  if (v === undefined) { v = lerp(ENERGY_KEYS, TVL_VALUES, e); tvlCache.set(e, v); }
  return v;
};
const fE = (e: number): number => {
  let v = fECache.get(e);
  if (v === undefined) { v = lerp(ENERGY_KEYS, FE_VALUES, e); fECache.set(e, v); }
  return v;
};
const muAir = (e: number): number => {
  let v = muAirCache.get(e);
  if (v === undefined) { v = lerp(ENERGY_KEYS, MU_VALUES, e); muAirCache.set(e, v); }
  return v;
};

// ─── Precalculated angle corrections ───
const ANGLE_CORR = [[15, 1.0], [30, 1.3], [45, 1.8], [60, 2.4], [90, 3.0]] as const;
const angleCorr = (deg: number): number => ANGLE_CORR.find(([d]) => deg <= d)?.[1] ?? 3.0;

// ─── Core formulas ───
const roofTrans = (thickMm: number, energyMV: number): number =>
  Math.pow(10, -thickMm / tvlFor(energyMV));

const chiltonG = (e: number, d: number, h: number): number => {
  const hOverD = h / Math.max(d, 0.1);
  return Math.min(hOverD * hOverD * fE(e) * Math.exp(-muAir(e) * d / 3), 1.0);
};

// ─── Main pure function ───
export const calculateSkyshine = (i: SkyInput): SkyResult => {
  const bRoof = roofTrans(i.roofThicknessMm, i.energyMV);
  const alpha = angleCorr(i.beamAngleDeg);
  const kPrimary = i.workloadGym2Week * bRoof;

  const pts = i.distancesM.map(d => ({
    distanceM: d,
    doseUSvWeek: kPrimary * chiltonG(i.energyMV, d, i.barrierHeightM) * alpha * 1000,
  }));

  let maxD = 0;
  for (const p of pts) if (p.doseUSvWeek > maxD) maxD = p.doseUSvWeek;

  return { points: pts, roofTransmission: bRoof, maxDoseUSv: maxD, angleCorrection: alpha };
};

export const DEFAULT_DISTANCES: readonly number[] = [5, 10, 15, 20, 30, 40, 50, 75, 100, 150, 200];
