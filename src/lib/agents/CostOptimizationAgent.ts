/**
 * ═══════════════════════════════════════════════════════════
 * CostOptimizationAgent — Material selection + cost minimization
 * Compares concrete, barite, steel, lead, BPE for each barrier
 * ═══════════════════════════════════════════════════════════
 */

export interface MaterialOption {
  material: string;
  thicknessCm: number;
  weightKg: number;
  costUSD: number;
  spaceRequired: number; // relative (1.0 = concrete baseline)
  pros: string[];
  cons: string[];
}

export interface CostComparison {
  barrierName: string;
  options: MaterialOption[];
  recommended: MaterialOption;
  savingsVsBaseline: number; // percentage
}

const MATERIAL_DATA: Record<string, { density: number; costPerM3: number; tvlMultiplier: number }> = {
  concrete: { density: 2350, costPerM3: 150, tvlMultiplier: 1.0 },
  barite: { density: 3350, costPerM3: 450, tvlMultiplier: 0.65 },
  steel: { density: 7800, costPerM3: 2500, tvlMultiplier: 0.25 },
  lead: { density: 11300, costPerM3: 8000, tvlMultiplier: 0.12 },
};

export class CostOptimizationAgent {
  compareMaterials(
    concreteThicknessCm: number,
    areaM2: number,
    constraints: { maxThicknessCm?: number; maxWeightKg?: number; budgetUSD?: number }
  ): CostComparison {
    const options: MaterialOption[] = [];

    for (const [name, data] of Object.entries(MATERIAL_DATA)) {
      const thicknessCm = concreteThicknessCm * data.tvlMultiplier;
      const volumeM3 = areaM2 * (thicknessCm / 100);
      const weightKg = volumeM3 * data.density;
      const costUSD = volumeM3 * data.costPerM3;

      const pros: string[] = [];
      const cons: string[] = [];

      if (name === "concrete") {
        pros.push("Cheapest option", "Easy construction", "Standard availability");
        cons.push("Thickest barrier", "Longer construction time");
      } else if (name === "barite") {
        pros.push("35% thinner than concrete", "Good for space-limited facilities");
        cons.push("3x cost of concrete", "Special mixing required");
      } else if (name === "steel") {
        pros.push("75% thinner than concrete", "Fast installation", "Good for doors/windows");
        cons.push("17x cost of concrete", "Very heavy", "Corrosion risk");
      } else if (name === "lead") {
        pros.push("88% thinner than concrete", "Best for fine-tuning", "Easy to cut/shape");
        cons.push("53x cost of concrete", "Toxic material handling", "Structural support needed");
      }

      if (constraints.maxThicknessCm && thicknessCm > constraints.maxThicknessCm) {
        cons.push(`Exceeds max thickness (${constraints.maxThicknessCm}cm)`);
      }

      options.push({ material: name, thicknessCm, weightKg, costUSD, spaceRequired: data.tvlMultiplier, pros, cons });
    }

    // Score each option (lower is better): 50% cost + 30% space + 20% weight
    const scored = options.map(o => ({
      ...o,
      score: (o.costUSD / (options[0]?.costUSD || 1)) * 0.5 + o.spaceRequired * 0.3 + (o.weightKg / 1000) * 0.2,
    }));

    scored.sort((a, b) => a.score - b.score);
    const recommended = scored[0];
    const baselineCost = options.find(o => o.material === "concrete")?.costUSD || 1;
    const savings = ((baselineCost - recommended.costUSD) / baselineCost) * 100;

    return {
      barrierName: `Barrier (${concreteThicknessCm}cm concrete equiv)`,
      options,
      recommended,
      savingsVsBaseline: Math.round(savings),
    };
  }

  optimizeFullDesign(
    barriers: Array<{ name: string; thicknessCm: number; areaM2: number; type: string }>,
    constraints: { maxThicknessCm?: number; totalBudgetUSD?: number }
  ): Array<CostComparison> {
    return barriers.map(b => this.compareMaterials(b.thicknessCm, b.areaM2, constraints));
  }

  generateReport(comparisons: CostComparison[]): string {
    let totalConcreteCost = 0;
    let totalOptimalCost = 0;
    let report = `# COST OPTIMIZATION REPORT\n\n`;

    for (const comp of comparisons) {
      const concreteOpt = comp.options.find(o => o.material === "concrete");
      if (concreteOpt) totalConcreteCost += concreteOpt.costUSD;
      totalOptimalCost += comp.recommended.costUSD;

      report += `## ${comp.barrierName}\n`;
      report += `Recommended: **${comp.recommended.material}** (${comp.recommended.thicknessCm.toFixed(1)}cm, $${comp.recommended.costUSD.toLocaleString()})\n`;
      for (const opt of comp.options) {
        report += `- ${opt.material}: ${opt.thicknessCm.toFixed(1)}cm | ${opt.weightKg.toFixed(0)}kg | $${opt.costUSD.toLocaleString()}\n`;
      }
      report += `\n`;
    }

    report += `## SUMMARY\n`;
    report += `- All concrete: $${totalConcreteCost.toLocaleString()}\n`;
    report += `- Optimized: $${totalOptimalCost.toLocaleString()}\n`;
    report += `- Savings: ${((totalConcreteCost - totalOptimalCost) / totalConcreteCost * 100).toFixed(1)}%\n`;

    return report;
  }
}
