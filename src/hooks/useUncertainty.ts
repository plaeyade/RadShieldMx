// Batch 4: Uncertainty analysis — propagate errors from input to output
export interface UncertaintyInput {
  workload_relativeError: number;      // ±% in workload
  distance_relativeError: number;        // ±% in distance measurement
  useFactor_relativeError: number;     // ±% in use factor
  occupancy_relativeError: number;     // ±% in occupancy
  tvk_relativeError: number;           // ±% in TVL (material uncertainty)
}

export interface UncertaintyResult {
  thickness_nominal_mm: number;
  thickness_lower_mm: number;          // -1 sigma
  thickness_upper_mm: number;          // +1 sigma
  thickness_relativeError: number;      // ±%
  kerma_nominal_mSv: number;
  kerma_lower_mSv: number;
  kerma_upper_mSv: number;
  complianceConfidence: number;          // probability of compliance
}

function erfApprox(x: number): number {
  const sign = x < 0 ? -1 : 1;
  const absX = Math.abs(x);
  const t = 1 / (1 + 0.3275911 * absX);
  const polynomial =
    ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) * t + 0.254829592) * t;
  const y = 1 - polynomial * Math.exp(-absX * absX);
  return sign * y;
}

// Error propagation: combine relative errors in quadrature
export function calculateUncertainty(
  nominalThickness_mm: number,
  nominalKerma_mSv: number,
  targetKerma_mSv: number,
  inputs: UncertaintyInput
): UncertaintyResult {
  // Combined relative error on thickness (error propagation)
  const combinedRel = Math.sqrt(
    inputs.workload_relativeError ** 2 +
    (2 * inputs.distance_relativeError) ** 2 + // distance squared in formula
    inputs.useFactor_relativeError ** 2 +
    inputs.occupancy_relativeError ** 2 +
    inputs.tvk_relativeError ** 2
  );

  const lowerT = nominalThickness_mm * (1 - combinedRel / 100);
  const upperT = nominalThickness_mm * (1 + combinedRel / 100);

  // Kerma uncertainty (same propagation)
  const kermaRel = Math.sqrt(
    inputs.workload_relativeError ** 2 +
    (2 * inputs.distance_relativeError) ** 2 +
    inputs.useFactor_relativeError ** 2 +
    inputs.occupancy_relativeError ** 2
  );

  const lowerK = nominalKerma_mSv * (1 - kermaRel / 100);
  const upperK = nominalKerma_mSv * (1 + kermaRel / 100);

  // Probability of compliance (simplified: if upper kerma < target, 100%; else Gaussian tail)
  const sigma = (upperK - lowerK) / 2;
  const mean = nominalKerma_mSv;
  let confidence = 1.0;
  if (upperK > targetKerma_mSv) {
    const z = (targetKerma_mSv - mean) / (sigma || 1);
    confidence = 0.5 * (1 + erfApprox(z / Math.sqrt(2)));
  }

  return {
    thickness_nominal_mm: nominalThickness_mm,
    thickness_lower_mm: Math.max(0, lowerT),
    thickness_upper_mm: upperT,
    thickness_relativeError: combinedRel,
    kerma_nominal_mSv: nominalKerma_mSv,
    kerma_lower_mSv: Math.max(0, lowerK),
    kerma_upper_mSv: upperK,
    complianceConfidence: Math.max(0, Math.min(1, confidence)),
  };
}
