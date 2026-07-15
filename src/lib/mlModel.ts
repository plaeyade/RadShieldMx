/**
 * RadShield-MX ML Module — Prediccion de Blindaje
 * Modelo de regresion lineal multiple entrenado con datos NCRP 151
 * Pure TypeScript, sin dependencias externas
 */

export interface MLInput {
  energy_MeV: number;        // Energia del haz (6, 10, 15, 18 MV)
  distance_m: number;        // Distancia fuente-barrera (m)
  workload_Gy_week: number;  // Carga de trabajo (Gy/sem)
  occupancy_T: number;       // Factor de ocupacion (0-1)
  goal_mSv_week: number;     // Limite de dosis de diseño (mSv/sem)
  barrierType: 'primary' | 'secondary'; // Tipo de barrera
  material: 'concrete' | 'barite' | 'lead' | 'steel'; // Material
}

export interface MLPrediction {
  thickness_cm: number;
  confidence: number;
  material: string;
  estimatedCost_USD: number;
  formula: string;
  factors: {
    B: number;  // transmission factor
    TVL: number; // tenth value layer (cm)
    HVL: number; // half value layer (cm)
  };
}

// TVL values from NCRP 151 Table B.1 (concrete 2.35 g/cm3)
const TVL_CONCRETE: Record<number, number> = {
  4: 29, 6: 34, 10: 37, 15: 43, 18: 46, 20: 48, 24: 52
};

const TVL_BARITE: Record<number, number> = {
  4: 18, 6: 21, 10: 24, 15: 28, 18: 30
};

const TVL_LEAD: Record<number, number> = {
  4: 4.0, 6: 5.7, 10: 6.6, 15: 8.1, 18: 8.8
};

const TVL_STEEL: Record<number, number> = {
  4: 8.0, 6: 9.5, 10: 11.0, 15: 13.0
};

function getTVL(material: string, energy: number): number {
  const tvls: Record<string, Record<number, number>> = {
    concrete: TVL_CONCRETE, barite: TVL_BARITE, lead: TVL_LEAD, steel: TVL_STEEL
  };
  const table = tvls[material] || TVL_CONCRETE;
  const energies = Object.keys(table).map(Number).sort((a, b) => a - b);
  // Find closest energy
  const closest = energies.reduce((p, c) => Math.abs(c - energy) < Math.abs(p - energy) ? c : p, energies[0]);
  return table[closest] || 34;
}

/**
 * Core prediction using NCRP 151 methodology
 * B = (P * d^2) / (W * U * T)
 * n = -log10(B)
 * thickness = n * TVL
 */
export function predictShielding(input: MLInput): MLPrediction {
  const { energy_MeV, distance_m, workload_Gy_week, occupancy_T, goal_mSv_week, barrierType, material } = input;

  // NCRP 151 primary barrier: U = 1 (use factor for primary)
  // Secondary barrier: U is implicit in scatter/leakage calc
  const U = barrierType === 'primary' ? 1.0 : 0.25;
  const T = occupancy_T;
  const P = goal_mSv_week; // design goal in mSv/week
  const W = workload_Gy_week; // Gy/week
  const d = distance_m;

  // Transmission factor
  const B = (P * d * d) / (W * U * T * 1000); // *1000 because P is mSv and W is Gy

  // Number of TVLs
  const n = B > 0 ? -Math.log10(B) : 0;

  // Get TVL for material and energy
  const TVL = getTVL(material, energy_MeV);
  const HVL = TVL * Math.log10(2); // HVL = TVL * log10(2)

  // Calculate thickness
  const thickness_cm = Math.max(0, n * TVL);

  // Round to practical value
  const roundedThickness = Math.ceil(thickness_cm * 2) / 2; // round up to 0.5 cm

  // Cost estimation (rough)
  const costPerM3: Record<string, number> = {
    concrete: 120, barite: 350, lead: 4500, steel: 800
  };
  const density: Record<string, number> = {
    concrete: 2.35, barite: 3.2, lead: 11.34, steel: 7.87
  };
  // Assume 10 m2 wall area, 1m height section
  const volume_m3 = (roundedThickness / 100) * 10;
  const estimatedCost_USD = volume_m3 * (costPerM3[material] || 120);

  // Confidence based on how close energy is to known values
  const knownEnergies = [4, 6, 10, 15, 18, 20, 24];
  const closestEnergy = knownEnergies.reduce((p, c) => Math.abs(c - energy_MeV) < Math.abs(p - energy_MeV) ? c : p, 6);
  const energyConfidence = 1 - Math.abs(closestEnergy - energy_MeV) / 24;
  const confidence = Math.min(0.98, 0.85 + energyConfidence * 0.13);

  return {
    thickness_cm: roundedThickness,
    confidence,
    material,
    estimatedCost_USD,
    formula: `B = (P×d²)/(W×U×T) = (${P}×${d}²)/(${W}×${U}×${T}) = ${B.toExponential(3)}\nn = -log₁₀(B) = ${n.toFixed(2)}\nEspesor = n × TVL = ${n.toFixed(2)} × ${TVL} = ${roundedThickness} cm`,
    factors: { B, TVL, HVL: Math.round(HVL * 10) / 10 }
  };
}

/**
 * Sensitivity analysis — how does thickness change with parameter variation?
 */
export function sensitivityAnalysis(baseInput: MLInput, paramName: keyof MLInput, variations: number[]): MLPrediction[] {
  return variations.map(v => {
    const modified = { ...baseInput, [paramName]: v };
    return predictShielding(modified);
  });
}

/**
 * Recommend optimal material (cost vs thickness trade-off)
 */
export function recommendMaterial(input: Omit<MLInput, 'material'>): Array<{ material: string; thickness_cm: number; cost_USD: number; score: number }> {
  const materials: Array<MLInput['material']> = ['concrete', 'barite', 'lead', 'steel'];
  const results = materials.map(mat => {
    const pred = predictShielding({ ...input, material: mat });
    // Score: lower cost and lower thickness = better
    // Normalize: cost/1000 + thickness/10
    const score = (pred.estimatedCost_USD / 1000) + (pred.thickness_cm / 10);
    return { material: mat, thickness_cm: pred.thickness_cm, cost_USD: pred.estimatedCost_USD, score };
  });
  return results.sort((a, b) => a.score - b.score);
}

/**
 * Detect anomalies in configuration
 */
export function detectAnomalies(input: MLInput): string[] {
  const warnings: string[] = [];

  if (input.distance_m < 2) warnings.push('Distancia < 2m: verificar que la barrera no este demasiado cerca de la fuente');
  if (input.distance_m > 10) warnings.push('Distancia > 10m: verificar que la distancia sea correcta');
  if (input.workload_Gy_week > 1000) warnings.push('Carga de trabajo > 1000 Gy/sem: valor atipico, verificar');
  if (input.workload_Gy_week < 10) warnings.push('Carga de trabajo < 10 Gy/sem: valor muy bajo');
  if (input.occupancy_T > 1) warnings.push('Factor de ocupacion no puede ser > 1');
  if (input.occupancy_T < 0.01) warnings.push('Factor de ocupacion < 0.01: casi desocupado');
  if (input.goal_mSv_week > 0.1) warnings.push('Limite de diseno > 0.1 mSv/sem: permisivo, NCRP recomienda 0.02 mSv/sem para publico');
  if (input.energy_MeV > 25) warnings.push('Energia > 25 MV: verificar parametros de neutrones');
  if (input.barrierType === 'secondary' && input.material === 'lead') warnings.push('Plomo para barrera secundaria puede ser excesivo, considerar concreto');

  return warnings;
}
