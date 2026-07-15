/**
 * ═══════════════════════════════════════════════════════════
 * ValidationAgent — Regulatory compliance checker
 * Reviews shielding designs against NCRP 151/147, NOM-008
 * ═══════════════════════════════════════════════════════════
 */

import { AgentRuntime } from "./AgentRuntime";
import type { ValidationIssue, ShieldingDesignOutput } from "./types";

interface ValidationInput {
  design: ShieldingDesignOutput;
  energy: number;
  modality: string;
  country?: string;
}

export class ValidationAgent {
  private runtime = new AgentRuntime();

  async validate(input: ValidationInput): Promise<ValidationIssue[]> {
    const { design, energy, modality, country = "US" } = input;
    const issues: ValidationIssue[] = [];

    // ─── 1. Validate barrier thicknesses against NCRP 151 ───
    for (const barrier of design.barriers) {
      // Check minimum thickness
      if (barrier.thicknessCm < 10 && barrier.type === "primary") {
        issues.push({
          severity: "error",
          rule: "NCRP 151 Table B.1",
          message: `Primary barrier ${barrier.name}: ${barrier.thicknessCm}cm is below minimum (10cm)`,
          recommendation: `Increase to at least ${Math.max(20, barrier.thicknessCm * 2)}cm`,
          reference: "NCRP 151 Section 2.2",
        });
      }

      // Check transmission
      if (!barrier.meetsGoal) {
        issues.push({
          severity: "error",
          rule: "Shielding design goal",
          message: `Barrier ${barrier.name} does not meet dose goal (B=${barrier.transmissionFactor.toExponential(2)})`,
          recommendation: `Increase thickness by ${Math.ceil(barrier.nTvls * 0.5)} TVLs`,
          reference: "NCRP 151 Section 1.4",
        });
      }
    }

    // ─── 2. Neutron validation for >10 MV ───
    if (energy > 10) {
      const hasNeutronShielding = design.neutronRequirements && design.neutronRequirements.length > 0;
      if (!hasNeutronShielding) {
        issues.push({
          severity: "error",
          rule: "NCRP 151 Section 5.4",
          message: `${energy} MV > 10 MV but no neutron shielding specified`,
          recommendation: "Add BPE door (3-5 cm) and evaluate maze neutron dose",
          reference: "NCRP 151 Section 5.4, IAEA Safety Report 47",
        });
      }

      // Check for maze
      const hasMaze = design.barriers.some(b => b.type === "maze");
      if (!hasMaze) {
        issues.push({
          severity: "warning",
          rule: "Maze design",
          message: "No maze barrier found for high-energy facility",
          recommendation: "Consider adding maze to reduce door shielding requirements",
          reference: "NCRP 151 Section 2.4.2",
        });
      }
    }

    // ─── 3. Country-specific validation ───
    if (country === "MX" || country === "Mexico") {
      issues.push({
        severity: "info",
        rule: "NOM-008-ENER",
        message: "Mexico: Verify CNSNS LA-007/01 format compliance",
        recommendation: "Include descriptive memory, methodology, and results table per CNSNS requirements",
        reference: "NOM-008-ENER, CNSNS LA-007/01",
      });
    }

    // ─── 4. Modality-specific checks ───
    if (modality === "CyberKnife") {
      issues.push({
        severity: "info",
        rule: "CyberKnife shielding",
        message: "CyberKnife: ALL walls are potential primary barriers (no fixed isocenter)",
        recommendation: "Verify U=1 for all walls, no use factor reduction",
        reference: "NCRP 151 Section 5.7",
      });
    }

    if (modality === "Tomotherapy") {
      issues.push({
        severity: "info",
        rule: "Tomotherapy shielding",
        message: "Tomotherapy: Beam stopper reduces primary ceiling exposure",
        recommendation: "Account for beam stopper in use factor calculations",
        reference: "NCRP 151 Section 5.6",
      });
    }

    // ─── 5. General checks ───
    if (design.totalConcreteVolume > 100) {
      issues.push({
        severity: "warning",
        rule: "Cost optimization",
        message: `High concrete volume (${design.totalConcreteVolume} m³) — consider barite or composite barriers`,
        recommendation: "Evaluate barite concrete (60-70% thickness reduction) for cost savings",
        reference: "NCRP 151 Section 4.3.2, IAEA Safety Report 47",
      });
    }

    // ─── 6. Skyshine ───
    const hasRoof = design.barriers.some(b => b.type === "roof");
    if (!hasRoof) {
      issues.push({
        severity: "info",
        rule: "Skyshine",
        message: "No roof barrier evaluated — potential skyshine exposure",
        recommendation: "Evaluate skyshine dose for uncontrolled areas above facility",
        reference: "NCRP 151 Section 5.1",
      });
    }

    return issues;
  }

  async generateValidationReport(issues: ValidationIssue[]): Promise<string> {
    const errors = issues.filter(i => i.severity === "error");
    const warnings = issues.filter(i => i.severity === "warning");
    const infos = issues.filter(i => i.severity === "info");

    let report = `# VALIDATION REPORT\n\n`;
    report += `**Date:** ${new Date().toISOString()}\n`;
    report += `**Status:** ${errors.length === 0 ? "PASS" : "FAIL"} (${errors.length} errors, ${warnings.length} warnings, ${infos.length} info)\n\n`;

    if (errors.length > 0) {
      report += `## ERRORS (must fix)\n\n`;
      for (const e of errors) {
        report += `- **[${e.rule}]** ${e.message}\n  - Recommendation: ${e.recommendation}\n  - Ref: ${e.reference}\n\n`;
      }
    }

    if (warnings.length > 0) {
      report += `## WARNINGS (should fix)\n\n`;
      for (const w of warnings) {
        report += `- **[${w.rule}]** ${w.message}\n  - Recommendation: ${w.recommendation}\n  - Ref: ${w.reference}\n\n`;
      }
    }

    if (infos.length > 0) {
      report += `## NOTES\n\n`;
      for (const i of infos) {
        report += `- **[${i.rule}]** ${i.message}\n  - ${i.recommendation}\n`;
      }
    }

    return report;
  }
}
