/**
 * ═══════════════════════════════════════════════════════════
 * Anomaly Detector — Isolation Forest approach
 * Detects when shielding calculations deviate from NCRP norms
 * ═══════════════════════════════════════════════════════════
 */

import { espesorReferenciaNCRP151, generateTrainingDataset } from "../trainingData";

interface AnomalyResult {
  isAnomaly: boolean;
  score: number;       // 0-1, higher = more anomalous
  severity: "none" | "warning" | "critical";
  reasons: string[];
  benchmarkThickness: number;
}

// Simple isolation forest-like scoring using random feature splits
class IsolationForest {
  private trees: Array<Array<{ feature: number; threshold: number; left: number; right: number }>> = [];
  private nTrees = 50;
  private subsampleSize = 256;

  train(data: number[][]): void {
    this.trees = [];
    for (let t = 0; t < this.nTrees; t++) {
      // Subsample
      const sample = this.shuffle([...data]).slice(0, this.subsampleSize);
      const tree: Array<{ feature: number; threshold: number; left: number; right: number }> = [];
      this.buildTree(sample, 0, tree, 0, Math.log2(this.subsampleSize));
      this.trees.push(tree);
    }
  }

  private buildTree(
    data: number[][], depth: number, tree: Array<{ feature: number; threshold: number; left: number; right: number }>,
    nodeIdx: number, maxDepth: number
  ): number {
    if (data.length <= 1 || depth >= maxDepth) {
      return depth;
    }

    const feature = Math.floor(Math.random() * data[0].length);
    const values = data.map(d => d[feature]);
    const min = Math.min(...values);
    const max = Math.max(...values);

    if (min === max) return depth;

    const threshold = min + Math.random() * (max - min);

    const left = data.filter(d => d[feature] < threshold);
    const right = data.filter(d => d[feature] >= threshold);

    tree[nodeIdx] = { feature, threshold, left: tree.length, right: tree.length + 1 };
    tree.push({ feature: 0, threshold: 0, left: 0, right: 0 }); // placeholder
    tree.push({ feature: 0, threshold: 0, left: 0, right: 0 }); // placeholder

    const leftDepth = this.buildTree(left, depth + 1, tree, tree[nodeIdx].left, maxDepth);
    const rightDepth = this.buildTree(right, depth + 1, tree, tree[nodeIdx].right, maxDepth);

    return Math.max(leftDepth, rightDepth);
  }

  private pathLength(x: number[], tree: Array<{ feature: number; threshold: number; left: number; right: number }>): number {
    let node = 0;
    let depth = 0;
    while (tree[node] && tree[node].threshold !== 0) {
      if (x[tree[node].feature] < tree[node].threshold) {
        node = tree[node].left;
      } else {
        node = tree[node].right;
      }
      depth++;
    }
    return depth;
  }

  score(x: number[]): number {
    let totalDepth = 0;
    for (const tree of this.trees) {
      totalDepth += this.pathLength(x, tree);
    }
    const avgDepth = totalDepth / this.trees.length;
    // Normalize: 0.5 = normal, 1.0 = very anomalous
    return Math.min(1, Math.max(0, 1 - avgDepth / (Math.log2(this.subsampleSize) * 0.5)));
  }

  private shuffle<T>(arr: T[]): T[] {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }
}

let forest: IsolationForest | null = null;

// Espesor esperado NCRP 151 en concreto (Fase 8a: `barreraMV`; antes mezclaba mSv con Gy)
function expectedThickness(energy: number, distance: number, workload: number, occupancy: number, goalDose: number, useFactor: number): number {
  return espesorReferenciaNCRP151(energy, distance, workload, occupancy, goalDose, useFactor, "concrete");
}

export function detectAnomaly(
  energy: number,
  distance: number,
  workload: number,
  occupancy: number,
  goalDose: number,
  useFactor: number,
  material: number,
  reportedThickness: number
): AnomalyResult {
  const reasons: string[] = [];
  const benchmark = expectedThickness(energy, distance, workload, occupancy, goalDose, useFactor);

  // Initialize forest if needed
  if (!forest) {
    forest = new IsolationForest();
    const data = generateTrainingDataset(500).map(d => [
      d.energy, d.distance, d.workload, d.occupancy,
      d.goalDose, d.useFactor, d.material, d.thickness
    ]);
    forest.train(data);
  }

  const score = forest.score([energy, distance, workload, occupancy, goalDose, useFactor, material, reportedThickness]);

  // Rule-based checks
  if (reportedThickness < benchmark * 0.5) {
    reasons.push(`Thickness ${reportedThickness}cm is <50% of expected ${Math.round(benchmark)}cm (NCRP 151)`);
  }
  if (reportedThickness > benchmark * 3) {
    reasons.push(`Thickness ${reportedThickness}cm is >3x expected ${Math.round(benchmark)}cm — may be over-shielded`);
  }
  if (energy > 10 && !reasons.some(r => r.includes("neutron"))) {
    reasons.push(`${energy} MV > 10 MV: neutron shielding must be verified (NCRP 151 Sec 5.4)`);
  }
  if (occupancy > 1.0) {
    reasons.push("Occupancy factor T > 1.0 is not valid (max T = 1.0)");
  }
  if (workload > 1500) {
    reasons.push(`Workload ${workload} Gy/wk is unusually high for a single unit`);
  }
  if (distance < 1.0) {
    reasons.push(`Distance ${distance}m is very short — verify measurement point`);
  }

  let severity: "none" | "warning" | "critical" = "none";
  if (score > 0.6 || reasons.length >= 2) severity = "critical";
  else if (score > 0.3 || reasons.length === 1) severity = "warning";

  return {
    isAnomaly: severity !== "none",
    score,
    severity,
    reasons,
    benchmarkThickness: Math.round(benchmark * 10) / 10,
  };
}

export function resetAnomalyDetector(): void {
  forest = null;
}
