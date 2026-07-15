// =============================================================================
// gumUncertainty.ts — GUM Uncertainty Propagation (JCGM 100:2008)
// Propagacion de incertidumbre para calculos de blindaje
// =============================================================================

export interface UncertaintyInput {
  name: string;
  value: number;
  unit: string;
  standardUncertainty: number; // u(x)
  distribution: 'normal' | 'rectangular' | 'triangular' | 'lognormal';
  degreesOfFreedom?: number;
  source: string; // calibration, resolution, drift, etc.
}

export interface UncertaintyBudget {
  inputs: UncertaintyInput[];
  result: {
    name: string;
    value: number;
    combinedUncertainty: number;
    expandedUncertainty: number; // k=2 (95%)
    coverageFactor: number;
    effectiveDoF: number;
    relativeUncertainty_percent: number;
  };
  contributions: { inputName: string; contribution_percent: number; sensitivityCoeff: number }[];
  correlationMatrix?: number[][];
}

export function computeUncertaintyBudget(
  shieldingThickness_cm: number,
  params: {
    activity_GBq: number; u_activity: number;
    distance_m: number; u_distance: number;
    tvl_cm: number; u_tvl: number;
    occupancyFactor: number; u_occupancy: number;
    useFactor: number; u_useFactor: number;
  },
): UncertaintyBudget {
  const { activity_GBq, u_activity, distance_m, u_distance, tvl_cm, u_tvl, occupancyFactor, u_occupancy, useFactor, u_useFactor } = params;
  const n = shieldingThickness_cm / tvl_cm;
  const B = Math.pow(10, -n);

  // Sensitivity coefficients (partial derivatives)
  const dBdA = B / activity_GBq; // ∂B/∂A
  const dBdd = -2 * B / distance_m; // ∂B/∂d
  const dBdtvl = (n * Math.LN10 * B) / tvl_cm; // ∂B/∂TVL
  const dBdT = B / occupancyFactor; // ∂B/∂T
  const dBdU = B / useFactor; // ∂B/∂U

  // Combined uncertainty squared (GUM Eq. 10)
  const u_c_squared =
    (dBdA * u_activity) ** 2 +
    (dBdd * u_distance) ** 2 +
    (dBdtvl * u_tvl) ** 2 +
    (dBdT * u_occupancy) ** 2 +
    (dBdU * u_useFactor) ** 2;

  const u_c = Math.sqrt(u_c_squared);
  const k = 2; // Coverage factor for 95%
  const U = k * u_c;
  const relPct = (u_c / B) * 100;

  // Welch-Satterthwaite for effective DoF
  const dof_eff = Math.floor(
    u_c_squared ** 2 / (
      (dBdA * u_activity) ** 4 / Infinity +
      (dBdd * u_distance) ** 4 / 50 +
      (dBdtvl * u_tvl) ** 4 / 30 +
      (dBdT * u_occupancy) ** 4 / 20 +
      (dBdU * u_useFactor) ** 4 / 20
    )
  );

  return {
    inputs: [
      { name: 'Activity', value: activity_GBq, unit: 'GBq', standardUncertainty: u_activity, distribution: 'normal', source: 'calibration' },
      { name: 'Distance', value: distance_m, unit: 'm', standardUncertainty: u_distance, distribution: 'normal', source: 'measurement' },
      { name: 'TVL', value: tvl_cm, unit: 'cm', standardUncertainty: u_tvl, distribution: 'normal', source: 'NCRP_tables' },
      { name: 'Occupancy Factor', value: occupancyFactor, unit: '', standardUncertainty: u_occupancy, distribution: 'rectangular', source: 'estimation' },
      { name: 'Use Factor', value: useFactor, unit: '', standardUncertainty: u_useFactor, distribution: 'rectangular', source: 'estimation' },
    ],
    result: {
      name: 'Transmission Factor B',
      value: B,
      combinedUncertainty: u_c,
      expandedUncertainty: U,
      coverageFactor: k,
      effectiveDoF: Math.min(dof_eff, 100),
      relativeUncertainty_percent: relPct,
    },
    contributions: [
      { inputName: 'Activity', contribution_percent: ((dBdA * u_activity) ** 2 / u_c_squared) * 100, sensitivityCoeff: dBdA },
      { inputName: 'Distance', contribution_percent: ((dBdd * u_distance) ** 2 / u_c_squared) * 100, sensitivityCoeff: dBdd },
      { inputName: 'TVL', contribution_percent: ((dBdtvl * u_tvl) ** 2 / u_c_squared) * 100, sensitivityCoeff: dBdtvl },
      { inputName: 'Occupancy', contribution_percent: ((dBdT * u_occupancy) ** 2 / u_c_squared) * 100, sensitivityCoeff: dBdT },
      { inputName: 'Use Factor', contribution_percent: ((dBdU * u_useFactor) ** 2 / u_c_squared) * 100, sensitivityCoeff: dBdU },
    ].sort((a, b) => b.contribution_percent - a.contribution_percent),
  };
}

export function rectToStd(a: number): number { return a / Math.sqrt(3); }
export function triToStd(a: number): number { return a / Math.sqrt(6); }
export function normal95ToStd(U95: number): number { return U95 / 1.96; }
