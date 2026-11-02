/**
 * McGinley Scatter-Primary Ratios and Shielding Data
 * Source: McGinley, P.H. "Shielding Techniques for Radiation Oncology Facilities"
 *         2nd Edition, Medical Physics Publishing, 2002
 *
 * Table 2-1: Scatter-primary ratio (a) at 1m from phantom
 * Table 2-2: Occupancy factors (T) — already in NCRP 49/151
 * Table 2-3: Shielding material properties
 * Chapter 6: Laminated barrier design
 * Chapter 7: Half-beam blocking
 */

// Table 2-1: Scatter-primary ratio (a) at one meter from human-size phantom
// for a 400 cm² field size at the phantom, target-to-phantom distance = 1m
// Values from NCRP 49 and Weber & van de Geijn (1963)
export interface ScatterPrimaryRatio {
  scatteringAngle_deg: number;
  ratio_6MV: number;   // a for 6 MV
  ratio_10MV: number;  // a for 10 MV
  ratio_18MV: number;  // a for 18 MV (extrapolated)
  ratio_24MV: number;  // a for 24 MV (extrapolated)
}

export const SCATTER_PRIMARY_RATIOS: ScatterPrimaryRatio[] = [
  { scatteringAngle_deg: 30,  ratio_6MV: 0.0070,  ratio_10MV: 0.0030, ratio_18MV: 0.0015, ratio_24MV: 0.0010 },
  { scatteringAngle_deg: 45,  ratio_6MV: 0.0018,  ratio_10MV: 0.0010, ratio_18MV: 0.0005, ratio_24MV: 0.0003 },
  { scatteringAngle_deg: 60,  ratio_6MV: 0.0011,  ratio_10MV: 0.0005, ratio_18MV: 0.0003, ratio_24MV: 0.0002 },
  { scatteringAngle_deg: 90,  ratio_6MV: 0.0006,  ratio_10MV: 0.0003, ratio_18MV: 0.00015, ratio_24MV: 0.0001 },
  { scatteringAngle_deg: 135, ratio_6MV: 0.0004,  ratio_10MV: 0.0002, ratio_18MV: 0.0001, ratio_24MV: 0.00008 },
  { scatteringAngle_deg: 150, ratio_6MV: 0.00035, ratio_10MV: 0.00018, ratio_18MV: 0.00009, ratio_24MV: 0.00007 },
];

// Interpolate scatter-primary ratio for given angle and energy
export function getScatterPrimaryRatio(
  angle_deg: number,
  energy_MeV: number
): number {
  // Clamp angle to available range
  const clampedAngle = Math.max(30, Math.min(150, angle_deg));

  // Find bracketing angles
  const sorted = [...SCATTER_PRIMARY_RATIOS].sort((a, b) => a.scatteringAngle_deg - b.scatteringAngle_deg);
  let lower = sorted[0];
  let upper = sorted[sorted.length - 1];
  for (let i = 0; i < sorted.length - 1; i++) {
    if (clampedAngle >= sorted[i].scatteringAngle_deg && clampedAngle <= sorted[i + 1].scatteringAngle_deg) {
      lower = sorted[i];
      upper = sorted[i + 1];
      break;
    }
  }

  // Interpolate by angle
  const angleT = (upper.scatteringAngle_deg === lower.scatteringAngle_deg) ? 0 :
    (clampedAngle - lower.scatteringAngle_deg) / (upper.scatteringAngle_deg - lower.scatteringAngle_deg);

  // Select energy column
  let lowerVal: number, upperVal: number;
  if (energy_MeV <= 6) {
    lowerVal = lower.ratio_6MV; upperVal = upper.ratio_6MV;
  } else if (energy_MeV <= 10) {
    const t = (energy_MeV - 6) / 4;
    lowerVal = lower.ratio_6MV * (1 - t) + lower.ratio_10MV * t;
    upperVal = upper.ratio_6MV * (1 - t) + upper.ratio_10MV * t;
  } else if (energy_MeV <= 18) {
    const t = (energy_MeV - 10) / 8;
    lowerVal = lower.ratio_10MV * (1 - t) + lower.ratio_18MV * t;
    upperVal = upper.ratio_10MV * (1 - t) + upper.ratio_18MV * t;
  } else {
    const t = Math.min(1, (energy_MeV - 18) / 6);
    lowerVal = lower.ratio_18MV * (1 - t) + lower.ratio_24MV * t;
    upperVal = upper.ratio_18MV * (1 - t) + upper.ratio_24MV * t;
  }

  return lowerVal + angleT * (upperVal - lowerVal);
}

// McGinley Chapter 6: Laminated Barrier Design
// For barriers with two materials (e.g., lead + concrete)
// B_total = B1 * B2 where B1 = 10^(-x1/TVL1), B2 = 10^(-x2/TVL2)
export interface LaminatedLayer {
  material: string;
  thickness_mm: number;
  tvl_mm: number;
}

export function calculateLaminatedTransmission(layers: LaminatedLayer[]): number {
  return layers.reduce((B, layer) => {
    if (layer.tvl_mm <= 0) return B;
    return B * Math.pow(10, -layer.thickness_mm / layer.tvl_mm);
  }, 1.0);
}

export function calculateLaminatedThickness(
  targetTransmission: number,
  layers: Omit<LaminatedLayer, 'thickness_mm'>[]
): number[] {
  // Distribute thickness proportionally by TVL
  const totalTVL = layers.reduce((sum, l) => sum + l.tvl_mm, 0);
  if (totalTVL <= 0) return layers.map(() => 0);

  const totalN = -Math.log10(targetTransmission);
  return layers.map(l => (l.tvl_mm / totalTVL) * totalN * l.tvl_mm);
}

// McGinley Chapter 7: Half-Beam Blocking
// When primary beam is blocked to half the patient, workload is halved
// U_eff = U * (field_size_half / field_size_full)
export function calculateHalfBeamUseFactor(
  fullUseFactor: number,
  fullFieldArea_cm2: number,
  blockedArea_cm2: number
): number {
  return fullUseFactor * (1 - blockedArea_cm2 / fullFieldArea_cm2);
}

// McGinley Chapter 3: Maze calculations
// Capture gamma dose at maze entrance from neutron thermalization
export function calculateCaptureGammaDose(
  neutronDose_mSv: number,
  mazeLength_m: number,
  wallThickness_cm: number,
  _concreteDensity_g_cm3: number
): number {
  // Simplified: capture gamma attenuated through maze walls
  const tvlCaptureGamma_cm = 21; // TVL for 2.2 MeV capture gamma in concrete
  const nTVL = wallThickness_cm / tvlCaptureGamma_cm;
  const transmission = Math.pow(10, -nTVL);
  // Additional attenuation from maze length (scatter)
  const scatterFactor = Math.max(0.01, 1 / (mazeLength_m * mazeLength_m));
  return neutronDose_mSv * transmission * scatterFactor;
}

// McGinley Chapter 4: Photoneutron production threshold
// Neutrons are produced when photon energy > threshold (~8-10 MeV)
export function producesPhotoneutrons(energy_MeV: number): boolean {
  return energy_MeV >= 10;
}

// Neutron dose equivalent per Gy at isocenter (McGinley Table 4-1)
export function getNeutronDosePerGy(energy_MeV: number): number {
  if (energy_MeV < 10) return 0;
  // Approximate values from McGinley Fig 4-1
  const data = [
    { e: 10, d: 0.5 }, { e: 15, d: 1.0 }, { e: 18, d: 2.0 },
    { e: 20, d: 3.0 }, { e: 25, d: 5.0 },
  ];
  for (let i = 0; i < data.length - 1; i++) {
    if (energy_MeV >= data[i].e && energy_MeV <= data[i + 1].e) {
      const t = (energy_MeV - data[i].e) / (data[i + 1].e - data[i].e);
      return data[i].d + t * (data[i + 1].d - data[i].d);
    }
  }
  return energy_MeV >= 25 ? 5.0 : 0;
}
