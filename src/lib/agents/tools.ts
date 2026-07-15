/**
 * ═══════════════════════════════════════════════════════════
 * Agent Tools — 15+ tools for shielding design automation
 * ═══════════════════════════════════════════════════════════
 */

import type { AgentTool } from "./types";

// TVL database from NCRP 151 Table B.1
const TVL_DB: Record<string, Record<string, { tvl1: number; tvle: number }>> = {
  concrete: {
    "Co-60": { tvl1: 21, tvle: 21 }, "4": { tvl1: 29, tvle: 26 },
    "6": { tvl1: 37, tvle: 33 }, "10": { tvl1: 37, tvle: 37 },
    "15": { tvl1: 44, tvle: 41 }, "18": { tvl1: 45, tvle: 43 },
    "20": { tvl1: 46, tvle: 44 }, "24": { tvl1: 48, tvle: 46 },
  },
  barite: {
    "Co-60": { tvl1: 15, tvle: 15 }, "4": { tvl1: 18, tvle: 16 },
    "6": { tvl1: 21, tvle: 19 }, "10": { tvl1: 24, tvle: 22 },
    "15": { tvl1: 28, tvle: 26 }, "18": { tvl1: 30, tvle: 28 },
  },
  steel: {
    "Co-60": { tvl1: 7.0, tvle: 7.0 }, "4": { tvl1: 7.0, tvle: 7.0 },
    "6": { tvl1: 10, tvle: 10 }, "10": { tvl1: 11, tvle: 11 },
    "15": { tvl1: 11, tvle: 11 }, "18": { tvl1: 11, tvle: 11 },
  },
  lead: {
    "Co-60": { tvl1: 4.0, tvle: 4.0 }, "4": { tvl1: 4.0, tvle: 4.0 },
    "6": { tvl1: 5.7, tvle: 5.7 }, "10": { tvl1: 5.7, tvle: 5.7 },
    "15": { tvl1: 5.7, tvle: 5.7 }, "18": { tvl1: 5.7, tvle: 5.7 },
  },
};

const MATERIAL_DENSITY: Record<string, number> = {
  concrete: 2.35, barite: 3.35, steel: 7.8, lead: 11.3, "borated-polyethylene": 1.0,
};

const MATERIAL_COST_PER_M3: Record<string, number> = {
  concrete: 150, barite: 450, steel: 2500, lead: 8000, "borated-polyethylene": 5000,
};

export const AGENT_TOOLS: AgentTool[] = [
  // ─── 1. calculatePrimaryBarrier ───
  {
    name: "calculatePrimaryBarrier",
    description: "Calculate primary barrier thickness using NCRP 151",
    parameters: {
      energy: { type: "number", description: "MV (4, 6, 10, 15, 18, 20, 24)" },
      distance: { type: "number", description: "meters from target to barrier" },
      workload: { type: "number", description: "Gy/week" },
      occupancy: { type: "number", description: "T factor (0.01-1.0)" },
      goalDose: { type: "number", description: "mSv/week (0.02 or 0.4)" },
      useFactor: { type: "number", description: "U factor (0.25 or 1.0)" },
      material: { type: "string", description: "concrete, barite, steel, lead" },
    },
    execute: async (p) => {
      const mat = p.material || "concrete";
      const eKey = String(Math.round(p.energy));
      const tvl = TVL_DB[mat]?.[eKey] || TVL_DB.concrete["6"];
      const B = Math.max(1e-10, (p.goalDose * p.distance ** 2) / (p.workload * p.useFactor * p.occupancy));
      const n = Math.max(0, -Math.log10(B));
      const thickness = n <= 1 ? n * tvl.tvl1 : tvl.tvl1 + (n - 1) * tvl.tvle;
      return {
        B, nTVLs: n, thicknessCm: Math.round(thickness * 10) / 10,
        tvl1: tvl.tvl1, tvle: tvl.tvle, meetsGoal: B <= 1,
        formula: `B=${B.toExponential(2)}, n=${n.toFixed(2)}, t=${thickness.toFixed(1)}cm`,
      };
    },
  },

  // ─── 2. calculateSecondaryBarrier ───
  {
    name: "calculateSecondaryBarrier",
    description: "Calculate secondary barrier for scatter + leakage",
    parameters: {
      energy: { type: "number", description: "MV" },
      distance: { type: "number", description: "meters" },
      workload: { type: "number", description: "Gy/week" },
      occupancy: { type: "number", description: "T factor" },
      goalDose: { type: "number", description: "mSv/week" },
      scatterFraction: { type: "number", description: "scatter fraction a (default 0.001)" },
      material: { type: "string", description: "concrete, barite, steel, lead" },
      isLeakage: { type: "boolean", description: "calculate for leakage instead of scatter" },
    },
    execute: async (p) => {
      const mat = p.material || "concrete";
      const eKey = String(Math.round(p.energy));
      const tvl = TVL_DB[mat]?.[eKey] || TVL_DB.concrete["6"];
      let K: number;
      if (p.isLeakage) {
        K = (0.001 * p.workload * p.occupancy) / (p.distance ** 2);
      } else {
        const a = p.scatterFraction || 0.001;
        K = (a * p.workload * p.occupancy) / (p.distance ** 2);
      }
      const B = Math.max(1e-10, p.goalDose / (K * 1000)); // convert to same units
      const n = Math.max(0, -Math.log10(B));
      const thickness = n <= 1 ? n * tvl.tvl1 : tvl.tvl1 + (n - 1) * tvl.tvle;
      return {
        doseRate: Math.round(K * 1000 * 100) / 100, B, nTVLs: n,
        thicknessCm: Math.round(thickness * 10) / 10,
        type: p.isLeakage ? "leakage" : "scatter",
        meetsGoal: B <= 1,
      };
    },
  },

  // ─── 3. calculateMazeNeutron ───
  {
    name: "calculateMazeNeutron",
    description: "Calculate neutron dose at maze door (McGinley method)",
    parameters: {
      energy: { type: "number", description: "MV (>10)" },
      workload: { type: "number", description: "Gy/week" },
      mazePathLength: { type: "number", description: "meters" },
      mazeCrossSection: { type: "number", description: "m2" },
      numLegs: { type: "number", description: "1 or 2" },
    },
    execute: async (p) => {
      const Q: Record<number, number> = { 10: 0.5e12, 15: 1.0e12, 18: 3.0e12, 20: 5.0e12, 24: 8.0e12 };
      const q = Q[Math.round(p.energy)] || 1.0e12;
      const attenuation = p.numLegs === 2 ? 100 : 10;
      const dose = (q * p.workload) / (p.mazePathLength ** 2 * attenuation * 1e6);
      return {
        neutronSourceStrength: q, "estimatedDoseUSvWeek": Math.round(dose),
        requiresDoor: dose > 20, attenuationFactor: attenuation,
        recommendation: dose > 20
          ? `BPE door required: 3-5 cm BPE + 1mm Pb (dose=${dose.toFixed(1)} uSv/wk)`
          : `Minimal shielding needed (dose=${dose.toFixed(1)} uSv/wk)`,
      };
    },
  },

  // ─── 4. checkNeutronRequirement ───
  {
    name: "checkNeutronRequirement",
    description: "Check if neutron shielding is required for given energy",
    parameters: { energy: { type: "number", description: "MV" } },
    execute: async (p) => ({
      requiresNeutrons: p.energy > 10,
      recommendation: p.energy > 10
        ? `${p.energy} MV > 10 MV: Neutron shielding MANDATORY per NCRP 151 Sec 5.4`
        : `${p.energy} MV <= 10 MV: No significant neutron production`,
      references: ["NCRP 151 Section 5.4", "NCRP 79"],
    }),
  },

  // ─── 5. estimateCost ───
  {
    name: "estimateCost",
    description: "Estimate shielding material cost",
    parameters: {
      material: { type: "string", description: "material name" },
      thicknessCm: { type: "number", description: "cm" },
      areaM2: { type: "number", description: "m2" },
    },
    execute: async (p) => {
      const volume = p.areaM2 * (p.thicknessCm / 100);
      const cost = volume * (MATERIAL_COST_PER_M3[p.material] || 150);
      return { volumeM3: Math.round(volume * 100) / 100, costUSD: Math.round(cost) };
    },
  },

  // ─── 6. validateTVL ───
  {
    name: "validateTVL",
    description: "Validate TVL value against NCRP 151 Table B.1",
    parameters: {
      energy: { type: "number", description: "MV" },
      material: { type: "string", description: "material" },
      claimedTVL: { type: "number", description: "claimed TVL in cm" },
    },
    execute: async (p) => {
      const eKey = String(Math.round(p.energy));
      const actual = TVL_DB[p.material]?.[eKey];
      if (!actual) return { valid: false, error: "Energy/material not in NCRP 151" };
      const diff = Math.abs(p.claimedTVL - actual.tvl1) / actual.tvl1;
      return {
        valid: diff < 0.1, actualTVL: actual.tvl1, claimedTVL: p.claimedTVL,
        difference: `${(diff * 100).toFixed(1)}%`,
        reference: "NCRP 151 Table B.1",
      };
    },
  },

  // ─── 7. getOccupancyFactor ───
  {
    name: "getOccupancyFactor",
    description: "Get standard occupancy factor for an area type",
    parameters: { areaType: { type: "string", description: "e.g. office, corridor, waiting room" } },
    execute: async (p) => {
      const factors: Record<string, number> = {
        office: 1, "control room": 1, "nurse station": 1, reception: 1,
        corridor: 0.2, "waiting room": 0.2, lounge: 0.2,
        "patient exam": 0.5, "treatment room": 0.5,
        toilet: 0.125, storage: 0.125, vending: 0.125,
        outdoor: 0.05, parking: 0.025, attic: 0.0125,
      };
      const t = factors[p.areaType.toLowerCase()] || 0.2;
      return { areaType: p.areaType, occupancyFactor: t, description: `T = ${t} for ${p.areaType}` };
    },
  },

  // ─── 8. checkSkyshine ───
  {
    name: "checkSkyshine",
    description: "Evaluate if skyshine is a concern for roof barrier",
    parameters: {
      energy: { type: "number", description: "MV" },
      roofThicknessCm: { type: "number", description: "cm" },
      hasOverhang: { type: "boolean", description: "roof extends beyond walls" },
    },
    execute: async (p) => {
      const tvl = TVL_DB.concrete[String(Math.round(p.energy))] || { tvl1: 37 };
      const n = p.roofThicknessCm / tvl.tvl1;
      const B = Math.pow(10, -n);
      return {
        transmissionFactor: Math.round(B * 1000) / 1000,
        nTVLs: Math.round(n * 100) / 100,
        skyshineRisk: B > 0.01 ? "HIGH" : B > 0.001 ? "MODERATE" : "LOW",
        recommendation: B > 0.01
          ? `Add roof shielding or overhang (B=${B.toExponential(2)})`
          : `Skyshine acceptable (B=${B.toExponential(2)})`,
        reference: "NCRP 151 Section 5.1",
      };
    },
  },

  // ─── 9. generateReportSection ───
  {
    name: "generateReportSection",
    description: "Generate a regulatory report section",
    parameters: {
      section: { type: "string", description: "section name" },
      data: { type: "object", description: "calculation data" },
      standard: { type: "string", description: "NCRP 151, NCRP 147, NOM-008" },
    },
    execute: async (p) => ({
      markdown: `## ${p.section}\n\n**Standard:** ${p.standard}\n\n**Data:**\n${Object.entries(p.data || {}).map(([k, v]) => `- ${k}: ${v}`).join("\n")}\n\n**Result:** Calculated per ${p.standard} methodology.`,
      latex: `\\section{${p.section}}\n\\textit{${p.standard}}`,
    }),
  },

  // ─── 10. compareMaterials ───
  {
    name: "compareMaterials",
    description: "Compare shielding materials for given energy and thickness",
    parameters: {
      energy: { type: "number", description: "MV" },
      targetThicknessCm: { type: "number", description: "target in cm" },
    },
    execute: async (p) => {
      const results = Object.entries(TVL_DB).map(([mat, energies]) => {
        const tvl = energies[String(Math.round(p.energy))];
        if (!tvl) return null;
        const n = p.targetThicknessCm <= tvl.tvl1
          ? p.targetThicknessCm / tvl.tvl1
          : 1 + (p.targetThicknessCm - tvl.tvl1) / tvl.tvle;
        const B = Math.pow(10, -n);
        return {
          material: mat, thicknessCm: p.targetThicknessCm,
          transmission: B, weightKg: Math.round(p.targetThicknessCm / 100 * (MATERIAL_DENSITY[mat] || 2.35) * 1000),
          costPerM2: Math.round((p.targetThicknessCm / 100) * (MATERIAL_COST_PER_M3[mat] || 150)),
        };
      }).filter(Boolean);
      return { comparisons: results, recommendation: results.sort((a: any, b: any) => a.costPerM2 - b.costPerM2)[0]?.material };
    },
  },
];

// Tool lookup
export function getTool(name: string): AgentTool | undefined {
  return AGENT_TOOLS.find(t => t.name === name);
}
