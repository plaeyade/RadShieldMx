/**
 * ═══════════════════════════════════════════════════════════
 * Training Dataset — Synthetic from NCRP 151 Formula
 * Features: [energy, distance, workload, occupancy, goal_dose]
 * Target: thickness_cm (calculated from NCRP 151)
 * ═══════════════════════════════════════════════════════════
 */
import { barreraMV, energiaTabuladaMV } from "../calculadorasNormativas";

export interface ShieldingDataPoint {
  energy: number;      // MV (4, 6, 10, 15, 18, 20, 24)
  distance: number;    // meters (1.5 to 8.0)
  workload: number;    // Gy/week (50 to 1000)
  occupancy: number;   // T factor (0.025 to 1.0)
  goalDose: number;    // mSv/week (0.02 no controlada o 0.1 controlada)
  useFactor: number;   // U (0.25 for walls, 1.0 for floor)
  material: number;    // 0=concrete, 1=barite, 2=steel, 3=lead
  modality: number;    // 0=LINAC, 1=Co-60, 2=GammaKnife
  thickness: number;   // target: cm (from NCRP 151 calculation)
}

const MATERIALS = ["concrete", "barite", "steel", "lead"];

/**
 * Fase 8a: espesor objetivo con NCRP 151 (`barreraMV`, Ec. 2.1/2.3 con TVL₁/TVLₑ de la Tabla B.2). Antes era
 * B = P(mSv)·d²/W(Gy) sin el factor 10⁻³ (≈ 3 TVL de menos) y con un solo TVL, así que el modelo aprendía espesores
 * no conservadores. La barita usa el TVL del concreto 2.35 (conservador; NCRP 151 no la tabula).
 */
export function espesorReferenciaNCRP151(
  energy: number, distance: number, workload: number, occupancy: number, goalDose: number, useFactor: number, material: string,
): number {
  const r = barreraMV({
    tipo: "primaria", haces: [{ energia: energy > 1 && energy < 1.5 ? "Co60" : energiaTabuladaMV(energy), W_Gy_semana: workload }],
    material: material === "lead" ? "lead" : material === "steel" ? "steel" : "concrete",
    P_mSv_semana: goalDose, T: Math.min(1, occupancy), U: useFactor, d_m: distance,
  });
  return r.espesor_cm;
}

const calculateThickness = espesorReferenciaNCRP151;

export function generateTrainingDataset(size: number = 2000): ShieldingDataPoint[] {
  const data: ShieldingDataPoint[] = [];

  for (let i = 0; i < size; i++) {
    // Random parameters
    const energy = [4, 6, 10, 15, 18, 20, 24][Math.floor(Math.random() * 7)];
    const distance = 1.5 + Math.random() * 6.5; // 1.5 to 8.0 m
    const workload = 50 + Math.random() * 950;   // 50 to 1000 Gy/wk
    const occupancy = [1.0, 0.5, 0.2, 0.125, 0.05, 0.025][Math.floor(Math.random() * 6)];
    const goalDose = Math.random() > 0.5 ? 0.1 : 0.02; // controlada (NCRP 151 §1.3) vs no controlada
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

  // Fase 8a: se quitaron los «ejemplos reales» fijos (espesores calculados con la fórmula errónea, sin fuente).
  return data;
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
