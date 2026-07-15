// Batch 3: Cost Optimizer — find cheapest material combination meeting kerma goal
import { MATERIALS } from '@/types/radshield';
import type { Barrier } from '@/types/radshield';

export interface CostOptimizedMaterial {
  materialCode: string;
  materialName: string;
  thickness_mm: number;
  roundedThickness_mm: number;
  costUSD: number;
  color: string;
}

export interface OptimizationResult {
  targetKerma_mSv_week: number;
  currentKerma_unshielded: number;
  options: CostOptimizedMaterial[];
  bestOption: CostOptimizedMaterial;
  savingsPercent_vs_concrete: number;
}

// TVL in mm for each material by energy (simplified)
function getTVL_mm(materialCode: string, energy_MeV: number): number {
  const tvls: Record<string, Record<string, number>> = {
    'CONCRETE235': { '6': 370, '10': 410, '15': 440, '18': 450 },
    'PB': { '6': 57, '10': 57, '15': 57, '18': 57 },
    'CONCRETEBARITE': { '6': 260, '10': 290, '15': 320, '18': 330 },
    'STEEL': { '6': 65, '10': 65, '15': 65, '18': 65 },
    'NELCO3232': { '6': 360, '10': 400, '15': 430, '18': 440 },
    'NELCO4320': { '6': 280, '10': 310, '15': 340, '18': 350 },
    'DRYWALL': { '6': 850, '10': 900, '15': 1000, '18': 1100 },
    'GYPSUM': { '6': 900, '10': 950, '15': 1050, '18': 1150 },
    'BPE': { '6': 200, '10': 220, '15': 250, '18': 260 },
    'PBPE': { '6': 150, '10': 170, '15': 190, '18': 200 },
  };
  const eKey = String(Math.round(energy_MeV));
  return tvls[materialCode]?.[eKey] || (materialCode === 'PB' ? 57 : 370);
}

export function optimizeCost(
  kerma_unshielded_mSv: number,
  target_mSv: number,
  energy_MeV: number,
  barrierLength_m: number,
  barrierHeight_m = 3.0
): OptimizationResult {
  const volumeFactor = barrierLength_m * barrierHeight_m; // m²

  const options: CostOptimizedMaterial[] = MATERIALS.map(mat => {
    const tvl = getTVL_mm(mat.code, energy_MeV);
    if (kerma_unshielded_mSv <= target_mSv) {
      return { materialCode: mat.code, materialName: mat.name, thickness_mm: 0, roundedThickness_mm: 0, costUSD: 0, color: mat.color };
    }
    const nTVL = Math.log10(kerma_unshielded_mSv / target_mSv);
    const thickness_mm = nTVL * tvl;
    const volume_m3 = (thickness_mm / 1000) * volumeFactor;
    const costUSD = volume_m3 * mat.cost_per_m3;
    return {
      materialCode: mat.code,
      materialName: mat.name,
      thickness_mm,
      roundedThickness_mm: Math.ceil(thickness_mm / 5) * 5, // round to 5mm
      costUSD,
      color: mat.color,
    };
  }).filter(o => o.thickness_mm > 0).sort((a, b) => a.costUSD - b.costUSD);

  const best = options[0] || options[options.length - 1];
  const concreteOption = options.find(o => o.materialCode === 'CONCRETE235') || best;
  const savings = concreteOption.costUSD > 0 ? ((concreteOption.costUSD - best.costUSD) / concreteOption.costUSD) * 100 : 0;

  return {
    targetKerma_mSv_week: target_mSv,
    currentKerma_unshielded: kerma_unshielded_mSv,
    options,
    bestOption: best,
    savingsPercent_vs_concrete: Math.max(0, savings),
  };
}
