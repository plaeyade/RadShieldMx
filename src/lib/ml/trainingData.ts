/**
 * ═══════════════════════════════════════════════════════════
 * Training Dataset — Synthetic from NCRP 151 Formula
 * Features: [energy, distance, workload, occupancy, goal_dose]
 * Target: thickness_cm (calculated from NCRP 151)
 * ═══════════════════════════════════════════════════════════
 */

export interface ShieldingDataPoint {
  energy: number;      // MV (4, 6, 10, 15, 18, 20, 24)
  distance: number;    // meters (1.5 to 8.0)
  workload: number;    // Gy/week (50 to 1000)
  occupancy: number;   // T factor (0.025 to 1.0)
  goalDose: number;    // mSv/week (0.02 or 0.4)
  useFactor: number;   // U (0.25 for walls, 1.0 for floor)
  material: number;    // 0=concrete, 1=barite, 2=steel, 3=lead
  modality: number;    // 0=LINAC, 1=Co-60, 2=GammaKnife
  thickness: number;   // target: cm (from NCRP 151 calculation)
}

// TVL tables from NCRP 151 Table B.1 (cm)
const TVL_TABLE: Record<string, Record<string, number>> = {
  concrete: { "4": 29, "6": 37, "10": 37, "15": 44, "18": 45, "20": 46, "24": 48, "60Co": 21 },
  barite:   { "4": 18, "6": 21, "10": 24, "15": 28, "18": 30, "20": 32, "24": 35, "60Co": 15 },
  steel:    { "4": 7.0, "6": 10, "10": 11, "15": 11, "18": 11, "20": 11, "24": 11, "60Co": 7.0 },
  lead:     { "4": 4.0, "6": 5.7, "10": 5.7, "15": 5.7, "18": 5.7, "20": 5.7, "24": 5.7, "60Co": 4.0 },
};

const MATERIALS = ["concrete", "barite", "steel", "lead"];

function calculateThickness(
  energy: number,
  distance: number,
  workload: number,
  occupancy: number,
  goalDose: number,
  useFactor: number,
  material: string
): number {
  const energyKey = energy === 1.25 ? "60Co" : String(Math.round(energy));
  const tvl = TVL_TABLE[material]?.[energyKey] || TVL_TABLE[material]["6"];
  if (!tvl) return 0;

  // NCRP 151: B = P * d^2 / (W * U * T)
  const B = (goalDose * distance * distance) / (workload * useFactor * occupancy);
  const clampedB = Math.max(1e-10, Math.min(1.0, B));
  const n = -Math.log10(clampedB);
  return Math.max(0, n * tvl);
}

export function generateTrainingDataset(size: number = 2000): ShieldingDataPoint[] {
  const data: ShieldingDataPoint[] = [];

  for (let i = 0; i < size; i++) {
    // Random parameters
    const energy = [4, 6, 10, 15, 18, 20, 24][Math.floor(Math.random() * 7)];
    const distance = 1.5 + Math.random() * 6.5; // 1.5 to 8.0 m
    const workload = 50 + Math.random() * 950;   // 50 to 1000 Gy/wk
    const occupancy = [1.0, 0.5, 0.2, 0.125, 0.05, 0.025][Math.floor(Math.random() * 6)];
    const goalDose = Math.random() > 0.5 ? 0.4 : 0.02; // controlled vs uncontrolled
    const useFactor = Math.random() > 0.5 ? 1.0 : 0.25; // floor vs wall
    const materialIdx = Math.floor(Math.random() * 4);  // 0-3

    const thickness = calculateThickness(
      energy, distance, workload, occupancy, goalDose, useFactor, MATERIALS[materialIdx]
    );

    data.push({
      energy,
      distance: Math.round(distance * 100) / 100,
      workload: Math.round(workload),
      occupancy,
      goalDose,
      useFactor,
      material: materialIdx,
      modality: 0, // LINAC
      thickness: Math.round(thickness * 10) / 10,
    });
  }

  // Add specific real-world examples
  const realWorld: ShieldingDataPoint[] = [
    // Varian iX 6 MV - Richardson example
    { energy: 6, distance: 4.2, workload: 300, occupancy: 1.0, goalDose: 0.02, useFactor: 1.0, material: 0, modality: 0, thickness: 117 },
    { energy: 6, distance: 5.5, workload: 300, occupancy: 1.0, goalDose: 0.4, useFactor: 0.25, material: 0, modality: 0, thickness: 44 },
    // 15 MV typical
    { energy: 15, distance: 4.0, workload: 500, occupancy: 1.0, goalDose: 0.02, useFactor: 1.0, material: 0, modality: 0, thickness: 152 },
    { energy: 15, distance: 5.0, workload: 500, occupancy: 0.2, goalDose: 0.02, useFactor: 0.25, material: 0, modality: 0, thickness: 38 },
    // 18 MV with neutrons
    { energy: 18, distance: 4.5, workload: 600, occupancy: 1.0, goalDose: 0.02, useFactor: 1.0, material: 0, modality: 0, thickness: 172 },
    // Co-60
    { energy: 1.25, distance: 3.0, workload: 100, occupancy: 0.5, goalDose: 0.02, useFactor: 0.25, material: 0, modality: 1, thickness: 55 },
    // Barite concrete
    { energy: 6, distance: 4.0, workload: 400, occupancy: 1.0, goalDose: 0.02, useFactor: 1.0, material: 1, modality: 0, thickness: 70 },
    // Steel
    { energy: 10, distance: 3.5, workload: 300, occupancy: 0.5, goalDose: 0.4, useFactor: 0.25, material: 2, modality: 0, thickness: 12 },
    // Lead
    { energy: 6, distance: 2.0, workload: 200, occupancy: 0.2, goalDose: 0.02, useFactor: 0.25, material: 3, modality: 0, thickness: 5.7 },
  ];

  return [...data, ...realWorld];
}

// Normalize features for ML
export function normalizeFeatures(data: ShieldingDataPoint[]): { xs: number[][]; ys: number[]; norms: FeatureNorms } {
  const features = data.map(d => [
    d.energy,
    d.distance,
    d.workload,
    d.occupancy,
    d.goalDose,
    d.useFactor,
    d.material,
    d.modality,
  ]);

  const targets = data.map(d => d.thickness);

  // Min-max normalization
  const norms: FeatureNorms = {
    min: features[0].map((_, i) => Math.min(...features.map(f => f[i]))),
    max: features[0].map((_, i) => Math.max(...features.map(f => f[i]))),
  };

  const xs = features.map(f =>
    f.map((v, i) => (v - norms.min[i]) / (norms.max[i] - norms.min[i] + 1e-10))
  );

  const yMin = Math.min(...targets);
  const yMax = Math.max(...targets);
  const ys = targets.map(v => (v - yMin) / (yMax - yMin + 1e-10));

  return { xs, ys, norms: { ...norms, yMin, yMax } };
}

export interface FeatureNorms {
  min: number[];
  max: number[];
  yMin?: number;
  yMax?: number;
}
