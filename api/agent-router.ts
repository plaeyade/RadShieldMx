/**
 * ═══════════════════════════════════════════════════════════
 * Agent Router — tRPC backend for AI agents
 * ShieldingDesign, Validation, CostOptimization
 * ═══════════════════════════════════════════════════════════
 */

import { z } from "zod";
import { authedQuery, createRouter } from "./middleware";
import { getDb } from "./queries/connection";
import { calculations } from "@db/schema";

export const agentRouter = createRouter({
  // ─── Run shielding design agent ───
  design: authedQuery
    .input(
      z.object({
        modality: z.enum(["LINAC", "Co-60", "GammaKnife", "CyberKnife", "Tomotherapy", "PET/CT", "Cyclotron"]),
        energy: z.number().min(0.5).max(250),
        workload: z.number().min(1).max(5000),
        distances: z.record(z.string(), z.number()),
        occupancy: z.record(z.string(), z.number()),
        goalDoseControlled: z.number().default(0.4),
        goalDoseUncontrolled: z.number().default(0.02),
        useFactor: z.number().default(0.25),
        material: z.string().default("concrete"),
        specialConsiderations: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // TVL database
      const tvl: Record<string, number> = {
        "Co-60": 21, "4": 29, "6": 37, "10": 37, "15": 44, "18": 45, "20": 46, "24": 48,
      };
      const tv = tvl[String(Math.round(input.energy))] || 37;

      const barriers = [];
      let totalCost = 0;

      // Calculate each barrier
      for (const [name, distance] of Object.entries(input.distances)) {
        const isControlled = name.toLowerCase().includes("control");
        const goal = isControlled ? input.goalDoseControlled : input.goalDoseUncontrolled;
        const occ = input.occupancy[name] || 0.2;
        const B = Math.max(1e-10, (goal * (distance as number) * (distance as number)) / (input.workload * input.useFactor * occ));
        const n = Math.max(0, -Math.log10(B));
        const thickness = n <= 1 ? n * tv : tv + (n - 1) * tv * 0.95;
        const cost = (thickness / 100) * 15 * 150; // rough cost calc

        barriers.push({
          name, type: "primary" as const,
          material: input.material,
          thicknessCm: Math.round(thickness * 10) / 10,
          transmissionFactor: B,
          nTvls: Math.round(n * 100) / 100,
          meetsGoal: B <= 1,
          notes: [`B=${B.toExponential(2)}`, `n=${n.toFixed(2)}`, `P=${goal}mSv/wk`, `T=${occ}`],
        });
        totalCost += cost;
      }

      // Validation issues
      const issues: Array<{ severity: string; rule: string; message: string; recommendation: string; reference: string }> = [];

      if (input.energy > 10) {
        issues.push({
          severity: "info", rule: "Neutron shielding",
          message: `${input.energy} MV requires neutron evaluation`,
          recommendation: "Add BPE door 3-5cm + 1mm Pb backing",
          reference: "NCRP 151 Section 5.4",
        });
      }

      if (input.specialConsiderations?.includes("IMRT")) {
        issues.push({
          severity: "info", rule: "IMRT workload",
          message: "IMRT increases leakage 2-3x",
          recommendation: "Multiply leakage workload by 2.5",
          reference: "NCRP 151 Section 3.2.2",
        });
      }

      const result = {
        barriers,
        totalConcreteVolume: Math.round(barriers.reduce((s, b) => s + (b.thicknessCm / 100) * 15, 0) * 10) / 10,
        estimatedCost: Math.round(totalCost),
        neutronRequirements: input.energy > 10 ? [
          "BPE door: 3-5 cm borated polyethylene + 1 mm lead backing",
          "Maze: single-leg provides 10x attenuation",
          "Neutron monitoring at maze entrance",
        ] : undefined,
        validationIssues: issues,
        references: ["NCRP 151", input.energy > 10 ? "NCRP 151 Section 5.4" : ""].filter(Boolean),
      };

      // Persist to calculations table (async, non-blocking)
      try {
        await getDb().insert(calculations).values({
          userId: ctx.user.unionId,
          type: "agent_design",
          modality: input.modality,
          energy: String(input.energy),
          parametersJson: JSON.stringify({ distances: input.distances, occupancy: input.occupancy, workload: input.workload, useFactor: input.useFactor }),
          resultsJson: JSON.stringify(result),
          passes: issues.some(i => i.severity === "error") ? "fail" : issues.some(i => i.severity === "warning") ? "warning" : "pass",
        });
      } catch { /* silent fail for analytics */ }

      return result;
    }),

  // ─── Cost optimization ───
  optimizeCost: authedQuery
    .input(
      z.object({
        concreteThicknessCm: z.number(),
        areaM2: z.number().default(15),
        constraints: z.object({
          maxThicknessCm: z.number().optional(),
          budgetUSD: z.number().optional(),
        }).optional(),
      })
    )
    .query(async ({ input }) => {
      const materials = ["concrete", "barite", "steel", "lead"];
      const data: Record<string, { density: number; costM3: number; mult: number }> = {
        concrete: { density: 2350, costM3: 150, mult: 1.0 },
        barite: { density: 3350, costM3: 450, mult: 0.65 },
        steel: { density: 7800, costM3: 2500, mult: 0.25 },
        lead: { density: 11300, costM3: 8000, mult: 0.12 },
      };

      const options = materials.map(m => {
        const d = data[m];
        const t = input.concreteThicknessCm * d.mult;
        const vol = input.areaM2 * (t / 100);
        return {
          material: m, thicknessCm: Math.round(t * 10) / 10,
          weightKg: Math.round(vol * d.density),
          costUSD: Math.round(vol * d.costM3),
          spaceRatio: d.mult,
        };
      });

      options.sort((a, b) => a.costUSD - b.costUSD);
      return { options, recommended: options[0] };
    }),
});
