/**
 * ═══════════════════════════════════════════════════════════════════════════
 *  RadShield-MX v32 — Automatic Shielding Optimizer
 * ═══════════════════════════════════════════════════════════════════════════
 *  Multi-objective genetic algorithm for finding optimal material
 *  combinations that minimize cost, weight, or space while meeting
 *  dose constraints per NCRP 151.
 *
 *  Algorithm: NSGA-II inspired multi-objective GA
 *  Objectives: cost, weight, thickness, construction complexity
 *  Constraints: dose limit per area (public, controlled, supervised)
 *  Materials: all entries from costDatabase + NIST library
 *
 *  Reference: NCRP 151, Deb (2002) NSGA-II, ICRP 103 ALARA
 * ═══════════════════════════════════════════════════════════════════════════
 */

import './costDatabase';

export interface OptimizationBarrier {
  id: string;
  name: string;
  area_m2: number;
  distance_to_source_m: number;
  use_factor: number; // U
  occupancy_factor: number; // T
  dose_limit_mSv_week: number; // P
  workload_Gy_week: number; // W
  is_primary: boolean;
  is_maze: boolean;
  current_thickness_mm: number;
  current_material: string;
}

export interface MaterialOption {
  key: string;
  name: string;
  density_kg_m3: number;
  tvl_primary_6MV_mm: number;
  tvl_secondary_6MV_mm: number;
  cost_per_m3: number; // normalized to USD
  max_thickness_mm: number;
  min_thickness_mm: number;
  complexity_score: number; // 1-10, higher = harder to construct
  // v81: Extended properties for barite concrete and specialized materials
  composition?: string;
  lead_equiv_2cm_mmPb?: number;
  lead_equiv_3cm_mmPb?: number;
  lead_equiv_4cm_mmPb?: number;
  lead_equiv_5cm_mmPb?: number;
  lead_equiv_6cm_mmPb?: number;
  yield_per_sack_30kg_m2_at_1cm?: number;
  voc?: string;
  shelf_life_months?: number;
  packaging?: string;
  supplier?: string;
  applications?: string[];
}

export type ObjectiveFunction = 'cost' | 'weight' | 'thickness' | 'complexity' | 'multi';

export interface OptimizerConfig {
  barriers: OptimizationBarrier[];
  materialOptions: MaterialOption[];
  objective: ObjectiveFunction;
  populationSize: number;
  generations: number;
  mutationRate: number;
  crossoverRate: number;
  eliteFraction: number;
  energy_MV: number; // for TVL scaling
}

export interface Solution {
  genes: number[]; // one gene per barrier: index into materialOptions + thickness fraction
  materialKeys: string[];
  thicknesses_mm: number[];
  fitness: number[];
  totalCost_USD: number;
  totalWeight_kg: number;
  totalThickness_mm: number;
  maxComplexity: number;
  doseCompliance: boolean[];
  rank: number; // Pareto front rank
  crowdingDistance: number;
}

export interface OptimizationResult {
  solutions: Solution[];
  paretoFront: Solution[];
  bestByObjective: Record<string, Solution>;
  convergenceHistory: number[][];
  calculationTime_ms: number;
}

// ─── Material options with NCRP 151 TVL data ───────────────────────

export const OPTIMIZATION_MATERIALS: MaterialOption[] = [
  { key: 'concreto_ordinario', name: 'Concreto ordinario', density_kg_m3: 2350, tvl_primary_6MV_mm: 369, tvl_secondary_6MV_mm: 293, cost_per_m3: 180, max_thickness_mm: 3000, min_thickness_mm: 100, complexity_score: 2 },
  { key: 'concreto_baritado', name: 'Concreto baritado (SYAR-X BaSO4 91.15%)', density_kg_m3: 3200, tvl_primary_6MV_mm: 260, tvl_secondary_6MV_mm: 210, cost_per_m3: 950, max_thickness_mm: 2500, min_thickness_mm: 80, complexity_score: 5, composition: 'BaSO4 91.15%, SiO2 5.03%, Al2O3 1.26%, SO3 3.26%', lead_equiv_2cm_mmPb: 1.0, lead_equiv_3cm_mmPb: 1.5, lead_equiv_4cm_mmPb: 2.0, lead_equiv_5cm_mmPb: 2.5, lead_equiv_6cm_mmPb: 3.0, yield_per_sack_30kg_m2_at_1cm: 1.0, voc: 'Ninguno', shelf_life_months: 12, packaging: 'Saco 30 kg', supplier: 'TERCNOC / xrays.mx', applications: ['RX general 2-3cm', 'CT 3-4cm', 'Mamografia 2-3cm', 'Fluoroscopia 3-5cm', 'Medicina Nuclear 5-6cm'] },
  { key: 'concreto_magnetita', name: 'Concreto magnetita', density_kg_m3: 3500, tvl_primary_6MV_mm: 240, tvl_secondary_6MV_mm: 195, cost_per_m3: 750, max_thickness_mm: 2500, min_thickness_mm: 80, complexity_score: 4 },
  { key: 'plomo_laminado', name: 'Plomo laminado', density_kg_m3: 11340, tvl_primary_6MV_mm: 55, tvl_secondary_6MV_mm: 45, cost_per_m3: 12500, max_thickness_mm: 100, min_thickness_mm: 1, complexity_score: 3 },
  { key: 'acero_estructural', name: 'Acero estructural', density_kg_m3: 7850, tvl_primary_6MV_mm: 120, tvl_secondary_6MV_mm: 100, cost_per_m3: 2200, max_thickness_mm: 200, min_thickness_mm: 5, complexity_score: 4 },
  { key: 'poly_borado', name: 'Polietileno borado', density_kg_m3: 950, tvl_primary_6MV_mm: 400, tvl_secondary_6MV_mm: 350, cost_per_m3: 3800, max_thickness_mm: 500, min_thickness_mm: 20, complexity_score: 3 },
  { key: 'tungsteno', name: 'Tungsteno', density_kg_m3: 17500, tvl_primary_6MV_mm: 15, tvl_secondary_6MV_mm: 12, cost_per_m3: 52000, max_thickness_mm: 50, min_thickness_mm: 2, complexity_score: 7 },
  { key: 'vidrio_plomo', name: 'Vidrio de plomo', density_kg_m3: 3500, tvl_primary_6MV_mm: 180, tvl_secondary_6MV_mm: 150, cost_per_m3: 18500, max_thickness_mm: 150, min_thickness_mm: 10, complexity_score: 6 },
  { key: 'tierra_apisonada', name: 'Tierra apisonada', density_kg_m3: 1800, tvl_primary_6MV_mm: 500, tvl_secondary_6MV_mm: 420, cost_per_m3: 30, max_thickness_mm: 5000, min_thickness_mm: 300, complexity_score: 6 },
];

// ─── TVL scaling by energy (relative to 6 MV) ──────────────────────

const TVL_ENERGY_SCALE: Record<number, number> = {
  4: 0.95, 6: 1.0, 10: 1.11, 15: 1.19, 18: 1.24, 25: 1.30,
};

function getTvlScale(energy_MV: number): number {
  return TVL_ENERGY_SCALE[energy_MV] || 1.0;
}

// ─── Required thickness calculation ──────────────────────────────────

/**
 * Calculate required TVL count for a barrier using NCRP 151 formula.
 * B = P × d² / (W × U × T)
 * n = -log₁₀(B)
 * thickness = n × TVL
 */
function requiredThickness(
  barrier: OptimizationBarrier,
  material: MaterialOption,
  energy_MV: number
): number {
  const B = (barrier.dose_limit_mSv_week * barrier.distance_to_source_m * barrier.distance_to_source_m) /
            (barrier.workload_Gy_week * 1000 * barrier.use_factor * barrier.occupancy_factor);
  const nTvl = -Math.log10(Math.max(B, 1e-10));
  const tvlScale = getTvlScale(energy_MV);
  const tvl = barrier.is_primary ? material.tvl_primary_6MV_mm : material.tvl_secondary_6MV_mm;
  return nTvl * tvl * tvlScale;
}

// ─── Genetic Algorithm ──────────────────────────────────────────────

interface Individual {
  genes: number[]; // [materialIndex0, thicknessFraction0, materialIndex1, thicknessFraction1, ...]
}

function randomGene(barrier: OptimizationBarrier, materials: MaterialOption[]): number[] {
  const matIdx = Math.floor(Math.random() * materials.length);
  const thicknessFrac = Math.random(); // 0-1, scaled to min-max later
  return [matIdx, thicknessFrac];
}

function decodeGenes(
  genes: number[], barriers: OptimizationBarrier[], materials: MaterialOption[], energy_MV: number
): { materials: string[]; thicknesses_mm: number[]; compliance: boolean[] } {
  const mats: string[] = [];
  const thick: number[] = [];
  const comp: boolean[] = [];

  for (let i = 0; i < barriers.length; i++) {
    const matIdx = Math.min(Math.max(0, Math.round(genes[i * 2])), materials.length - 1);
    const mat = materials[matIdx];
    const reqThickness = requiredThickness(barriers[i], mat, energy_MV);
    const minT = mat.min_thickness_mm;
    const maxT = Math.max(mat.max_thickness_mm, reqThickness * 1.5);
    const thickness = minT + genes[i * 2 + 1] * (maxT - minT);
    const actualThickness = Math.max(thickness, reqThickness);

    mats.push(mat.key);
    thick.push(actualThickness);
    comp.push(actualThickness >= reqThickness);
  }

  return { materials: mats, thicknesses_mm: thick, compliance: comp };
}

function evaluateFitness(
  ind: Individual, config: OptimizerConfig
): { fitness: number[]; cost: number; weight: number; thickness: number; complexity: number } {
  const decoded = decodeGenes(ind.genes, config.barriers, config.materialOptions, config.energy_MV);
  let totalCost = 0, totalWeight = 0, totalThickness = 0, maxComplexity = 0;

  for (let i = 0; i < config.barriers.length; i++) {
    const mat = config.materialOptions.find(m => m.key === decoded.materials[i]) || config.materialOptions[0];
    const vol_m3 = (decoded.thicknesses_mm[i] / 1000) * config.barriers[i].area_m2;
    totalCost += vol_m3 * mat.cost_per_m3;
    totalWeight += vol_m3 * mat.density_kg_m3;
    totalThickness += decoded.thicknesses_mm[i];
    if (mat.complexity_score > maxComplexity) maxComplexity = mat.complexity_score;
  }

  // Penalty for non-compliance
  let penalty = 0;
  for (let i = 0; i < config.barriers.length; i++) {
    if (!decoded.compliance[i]) penalty += 1e6;
  }

  return {
    fitness: [totalCost + penalty, totalWeight + penalty, totalThickness + penalty, maxComplexity * 1000 + penalty],
    cost: totalCost, weight: totalWeight, thickness: totalThickness, complexity: maxComplexity,
  };
}

function crossover(p1: Individual, p2: Individual, rate: number): [Individual, Individual] {
  if (Math.random() > rate) return [p1, p2];
  const point = Math.floor(Math.random() * p1.genes.length);
  const c1: Individual = { genes: [...p1.genes.slice(0, point), ...p2.genes.slice(point)] };
  const c2: Individual = { genes: [...p2.genes.slice(0, point), ...p1.genes.slice(point)] };
  return [c1, c2];
}

function mutate(ind: Individual, rate: number, materials: MaterialOption[]): Individual {
  const genes = [...ind.genes];
  for (let i = 0; i < genes.length; i++) {
    if (Math.random() < rate) {
      if (i % 2 === 0) {
        genes[i] = Math.floor(Math.random() * materials.length);
      } else {
        genes[i] = Math.max(0, Math.min(1, genes[i] + (Math.random() - 0.5) * 0.3));
      }
    }
  }
  return { genes };
}

function nonDominatedSort(population: { ind: Individual; fitness: number[] }[]): number[] {
  const n = population.length;
  const ranks = new Array(n).fill(0);
  const dominatedCounts = new Array(n).fill(0);
  const dominatedSets: number[][] = Array.from({ length: n }, () => []);

  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      if (i === j) continue;
      let dominates = true;
      for (let k = 0; k < 4; k++) {
        if (population[i].fitness[k] > population[j].fitness[k]) { dominates = false; break; }
      }
      if (dominates && population[i].fitness.some((v, k) => v < population[j].fitness[k])) {
        dominatedSets[i].push(j);
      } else {
        let dominatedByJ = true;
        for (let k = 0; k < 4; k++) {
          if (population[j].fitness[k] > population[i].fitness[k]) { dominatedByJ = false; break; }
        }
        if (dominatedByJ && population[j].fitness.some((v, k) => v < population[i].fitness[k])) {
          dominatedCounts[i]++;
        }
      }
    }
  }

  let currentRank = 1;
  let assigned = 0;
  while (assigned < n) {
    for (let i = 0; i < n; i++) {
      if (dominatedCounts[i] === 0 && ranks[i] === 0) {
        ranks[i] = currentRank;
        assigned++;
        for (const j of dominatedSets[i]) dominatedCounts[j]--;
      }
    }
    currentRank++;
  }

  return ranks;
}

// ─── Main optimization entry point ─────────────────────────────────

export function runShieldingOptimization(config: OptimizerConfig): OptimizationResult {
  const t0 = performance.now();
  const { barriers, materialOptions, populationSize, generations, mutationRate, crossoverRate, eliteFraction, energy_MV } = config;

  // Initialize population
  let population: Individual[] = [];
  for (let i = 0; i < populationSize; i++) {
    const genes: number[] = [];
    for (const b of barriers) {
      genes.push(...randomGene(b, materialOptions));
    }
    population.push({ genes });
  }

  const convergence: number[][] = [];
  const bestSolution: Solution | null = null;
  const allSolutions: Solution[] = [];

  for (let gen = 0; gen < generations; gen++) {
    // Evaluate
    const evaluated = population.map(ind => ({
      ind,
      fitness: evaluateFitness(ind, config).fitness,
      details: evaluateFitness(ind, config),
    }));

    // NSGA-II sort
    const ranks = nonDominatedSort(evaluated);

    // Build solutions
    const genSolutions: Solution[] = evaluated.map((e, i) => {
      const decoded = decodeGenes(e.ind.genes, barriers, materialOptions, energy_MV);
      return {
        genes: e.ind.genes,
        materialKeys: decoded.materials,
        thicknesses_mm: decoded.thicknesses_mm,
        fitness: e.fitness,
        totalCost_USD: e.details.cost,
        totalWeight_kg: e.details.weight,
        totalThickness_mm: e.details.thickness,
        maxComplexity: e.details.complexity,
        doseCompliance: decoded.compliance,
        rank: ranks[i],
        crowdingDistance: 0,
      };
    });

    // Track convergence (average cost of rank 1)
    const rank1 = genSolutions.filter(s => s.rank === 1);
    if (rank1.length > 0) {
      const avgCost = rank1.reduce((s, v) => s + v.totalCost_USD, 0) / rank1.length;
      convergence.push([gen, avgCost]);
    }

    // Store all
    allSolutions.push(...genSolutions);

    // Selection + reproduction
    const sorted = genSolutions.sort((a, b) => a.rank - b.rank || b.crowdingDistance - a.crowdingDistance);
    const newPop: Individual[] = [];

    // Elitism
    const eliteCount = Math.floor(eliteFraction * populationSize);
    for (let i = 0; i < eliteCount && i < sorted.length; i++) {
      newPop.push({ genes: [...sorted[i].genes] });
    }

    // Crossover + mutation
    while (newPop.length < populationSize) {
      const p1 = population[Math.floor(Math.random() * population.length)];
      const p2 = population[Math.floor(Math.random() * population.length)];
      const [c1, c2] = crossover(p1, p2, crossoverRate);
      newPop.push(mutate(c1, mutationRate, materialOptions));
      if (newPop.length < populationSize) newPop.push(mutate(c2, mutationRate, materialOptions));
    }

    population = newPop.slice(0, populationSize);
  }

  // Final evaluation
  const finalEval = population.map(ind => ({
    ind,
    fitness: evaluateFitness(ind, config).fitness,
    details: evaluateFitness(ind, config),
  }));
  const finalRanks = nonDominatedSort(finalEval);

  const finalSolutions: Solution[] = finalEval.map((e, i) => {
    const decoded = decodeGenes(e.ind.genes, barriers, materialOptions, energy_MV);
    return {
      genes: e.ind.genes,
      materialKeys: decoded.materials,
      thicknesses_mm: decoded.thicknesses_mm,
      fitness: e.fitness,
      totalCost_USD: e.details.cost,
      totalWeight_kg: e.details.weight,
      totalThickness_mm: e.details.thickness,
      maxComplexity: e.details.complexity,
      doseCompliance: decoded.compliance,
      rank: finalRanks[i],
      crowdingDistance: 0,
    };
  });

  const paretoFront = finalSolutions.filter(s => s.rank === 1);

  // Best by objective
  const bestByObjective: Record<string, Solution> = {};
  const objectives = ['totalCost_USD', 'totalWeight_kg', 'totalThickness_mm', 'maxComplexity'];
  for (let i = 0; i < 4; i++) {
    const best = [...paretoFront].sort((a, b) => (a as any)[objectives[i]] - (b as any)[objectives[i]])[0];
    if (best) bestByObjective[objectives[i]] = best;
  }

  return {
    solutions: finalSolutions,
    paretoFront,
    bestByObjective,
    convergenceHistory: convergence,
    calculationTime_ms: performance.now() - t0,
  };
}
