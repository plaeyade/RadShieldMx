/**
 * ═══════════════════════════════════════════════════════════
 * ShieldingDesignAgent — Multi-step autonomous shielding design
 * Takes facility parameters, outputs complete shielding design
 * ═══════════════════════════════════════════════════════════
 */

import { AgentRuntime } from "./AgentRuntime";
import type { ShieldingDesignInput, ShieldingDesignOutput, ValidationIssue } from "./types";

export class ShieldingDesignAgent {
  private runtime = new AgentRuntime();

  async design(input: ShieldingDesignInput): Promise<ShieldingDesignOutput> {
    const { energy } = input;

    // Build execution plan based on modality
    const plan = this.buildPlan(input);

    // Execute
    const result = await this.runtime.executePlan(plan, { maxSteps: 20, timeoutMs: 30000 });

    // Parse results into structured output
    const barriers = this.extractBarriers(result.steps);
    const validationIssues = this.generateValidationIssues(input, result.steps);
    const totalConcreteVolume = barriers.reduce((s, b) => s + (b.thicknessCm / 100) * 10, 0); // rough wall area estimate
    const estimatedCost = barriers.reduce((s, b) => s + (b.thicknessCm / 100) * 10 * 150, 0);

    return {
      barriers,
      totalConcreteVolume: Math.round(totalConcreteVolume * 10) / 10,
      estimatedCost: Math.round(estimatedCost),
      neutronRequirements: energy > 10 ? [
        "Neutron shielding mandatory for >10 MV",
        "BPE door: 3-5 cm borated polyethylene + 1 mm lead backing",
        "Maze design: single-leg provides 10x attenuation, two-leg 100x",
        "Neutron monitoring at maze entrance (rem meter)",
      ] : undefined,
      validationIssues,
      references: result.citations.length > 0 ? result.citations : ["NCRP 151", "NOM-008-ENER"],
    };
  }

  private buildPlan(input: ShieldingDesignInput): Array<{ agent: string; action: string; params: Record<string, any> }> {
    const { energy, workload, distances, occupancy, goalDoseControlled, goalDoseUncontrolled, useFactor, materials } = input;
    const plan: Array<{ agent: string; action: string; params: Record<string, any> }> = [];
    const mat = materials[0] || "concrete";

    // Step 1: Check neutron requirement
    plan.push({
      agent: "ShieldingDesignAgent",
      action: "checkNeutronRequirement",
      params: { energy },
    });

    // Step 2: Calculate primary barriers for each distance
    for (const [name, distance] of Object.entries(distances)) {
      const isControlled = name.toLowerCase().includes("control") || name.toLowerCase().includes("staff");
      const goal = isControlled ? goalDoseControlled : goalDoseUncontrolled;
      const occ = occupancy[name] || (isControlled ? 1.0 : 0.2);

      plan.push({
        agent: "ShieldingDesignAgent",
        action: "calculatePrimaryBarrier",
        params: { energy, distance, workload, occupancy: occ, goalDose: goal, useFactor, material: mat },
      });
    }

    // Step 3: Calculate secondary barriers (scatter + leakage)
    for (const [name, distance] of Object.entries(distances)) {
      const isControlled = name.toLowerCase().includes("control");
      const goal = isControlled ? goalDoseControlled : goalDoseUncontrolled;
      plan.push({
        agent: "ShieldingDesignAgent",
        action: "calculateSecondaryBarrier",
        params: { energy, distance, workload, occupancy: occupancy[name] || 0.2, goalDose: goal, material: mat },
      });
      plan.push({
        agent: "ShieldingDesignAgent",
        action: "calculateSecondaryBarrier",
        params: { energy, distance, workload, occupancy: occupancy[name] || 0.2, goalDose: goal, material: mat, isLeakage: true },
      });
    }

    // Step 4: Maze calculation if applicable
    if (energy > 6) {
      plan.push({
        agent: "ShieldingDesignAgent",
        action: "calculateMazeNeutron",
        params: { energy, workload, mazePathLength: 7, mazeCrossSection: 4, numLegs: 1 },
      });
    }

    // Step 5: Skyshine check
    plan.push({
      agent: "ShieldingDesignAgent",
      action: "checkSkyshine",
      params: { energy, roofThicknessCm: 50, hasOverhang: false },
    });

    // Step 6: Cost estimation
    for (let i = 0; i < Math.min(2, Object.keys(distances).length); i++) {
      plan.push({
        agent: "ShieldingDesignAgent",
        action: "estimateCost",
        params: { material: mat, thicknessCm: 100, areaM2: 15 },
      });
    }

    // Step 7: IMRT check
    if (input.specialConsiderations?.includes("IMRT")) {
      plan.push({
        agent: "ShieldingDesignAgent",
        action: "calculateSecondaryBarrier",
        params: { energy, distance: 4, workload: workload * 2.5, occupancy: 1, goalDose: goalDoseControlled, material: mat, isLeakage: true },
      });
    }

    return plan;
  }

  private extractBarriers(steps: Array<{ action: string; result?: any; status: string }>) {
    const barriers: ShieldingDesignOutput["barriers"] = [];
    let barrierIdx = 0;

    for (const step of steps) {
      if (step.status !== "completed" || !step.result) continue;

      if (step.action === "calculatePrimaryBarrier") {
        barriers.push({
          name: `Barrier ${++barrierIdx}`,
          type: "primary",
          material: "concrete",
          thicknessCm: step.result.thicknessCm,
          transmissionFactor: step.result.B,
          nTvls: step.result.nTVLs,
          meetsGoal: step.result.meetsGoal,
          notes: [step.result.formula, `TVL1=${step.result.tvl1}cm, TVLe=${step.result.tvle}cm`],
        });
      } else if (step.action === "calculateSecondaryBarrier") {
        barriers.push({
          name: `Barrier ${++barrierIdx} (${step.result.type})`,
          type: "secondary",
          material: "concrete",
          thicknessCm: step.result.thicknessCm,
          transmissionFactor: step.result.B,
          nTvls: step.result.nTVLs,
          meetsGoal: step.result.meetsGoal,
          notes: [`${step.result.type} barrier`, `Dose rate: ${step.result.doseRate} uSv/wk`],
        });
      }
    }

    return barriers;
  }

  private generateValidationIssues(input: ShieldingDesignInput, steps: Array<{ action: string; result?: any; status: string; error?: string }>): ValidationIssue[] {
    const issues: ValidationIssue[] = [];

    // Check for failed steps
    const failed = steps.filter(s => s.status === "failed");
    for (const f of failed) {
      issues.push({
        severity: "warning",
        rule: "Calculation integrity",
        message: `${f.action} failed: ${f.error}`,
        recommendation: "Verify input parameters and retry calculation",
        reference: "NCRP 151",
      });
    }

    // Energy-specific checks
    if (input.energy > 10) {
      issues.push({
        severity: "info",
        rule: "Neutron shielding",
        message: `${input.energy} MV requires neutron evaluation per NCRP 151 Sec 5.4`,
        recommendation: "Include BPE door and neutron monitoring",
        reference: "NCRP 151 Section 5.4",
      });
    }

    if (input.specialConsiderations?.includes("IMRT")) {
      issues.push({
        severity: "info",
        rule: "IMRT workload",
        message: "IMRT increases leakage workload by 2-3x",
        recommendation: "Multiply leakage workload by IMRT factor (2.5 default)",
        reference: "NCRP 151 Section 3.2.2",
      });
    }

    return issues;
  }
}
