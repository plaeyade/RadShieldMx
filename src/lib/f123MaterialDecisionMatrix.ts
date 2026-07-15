import {
  estimateBarrierStructuralImpact,
  F121_SHIELDING_MATERIAL_IMPACT,
  type F121StructuralRisk,
} from '@/lib/f121StructuralShieldingImpact';

export interface F123MaterialDecisionInput {
  areaM2?: number;
  heightM?: number;
  baselineMaterialId?: string;
  requiredThicknessMm?: number;
}

export interface F123MaterialDecisionRow {
  materialId: string;
  label: string;
  family: string;
  thicknessMm: number;
  kgM2: number;
  kgPerLinearM: number;
  massKg: number;
  structuralRisk: F121StructuralRisk;
  costIndex: number;
  scheduleIndex: number;
  score: number;
  rank: number;
  reviewRequired: boolean;
  datasheetRequired: boolean;
  recommendation: 'preferred' | 'viable' | 'conditional' | 'avoid-until-reviewed';
  rationale: string;
}

const RISK_PENALTY: Record<F121StructuralRisk, number> = {
  low: 0,
  moderate: 12,
  high: 28,
  critical: 60,
};

function round(value: number, digits = 2) {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
}

function recommendationFor(row: Omit<F123MaterialDecisionRow, 'rank' | 'recommendation' | 'rationale'>): F123MaterialDecisionRow['recommendation'] {
  if (row.structuralRisk === 'critical') return 'avoid-until-reviewed';
  if (row.reviewRequired && row.datasheetRequired) return 'conditional';
  if (row.score <= 75) return 'preferred';
  return 'viable';
}

function rationaleFor(row: Omit<F123MaterialDecisionRow, 'rank' | 'rationale'>): string {
  if (row.recommendation === 'avoid-until-reviewed') return 'Peso por area critico; no liberar sin calculo estructural formal.';
  if (row.datasheetRequired) return 'Requiere ficha tecnica para equivalencia radiologica, fijaciones y obra.';
  if (row.reviewRequired) return 'Requiere revision estructural por peso propio o tipo de sistema.';
  return 'Opcion ligera o de baja interferencia estructural para revision preliminar.';
}

export function buildF123MaterialDecisionMatrix(input: F123MaterialDecisionInput = {}) {
  const areaM2 = input.areaM2 && input.areaM2 > 0 ? input.areaM2 : 10;
  const heightM = input.heightM && input.heightM > 0 ? input.heightM : 2.8;
  const lengthM = areaM2 / heightM;

  const rows = F121_SHIELDING_MATERIAL_IMPACT.map((material) => {
    const thicknessMm = input.requiredThicknessMm && material.id === input.baselineMaterialId ? input.requiredThicknessMm : material.defaultThicknessMm;
    const impact = estimateBarrierStructuralImpact({
      materialId: material.id,
      lengthM,
      heightM,
      thicknessMm,
    });
    const score = round(
      material.costIndex * 18 +
        (6 - material.scheduleIndex) * 10 +
        RISK_PENALTY[impact.structuralRisk] +
        (impact.reviewRequired ? 10 : 0) +
        (impact.datasheetRequired ? 8 : 0) +
        impact.kgM2 / 35,
    );
    const base = {
      materialId: material.id,
      label: material.label,
      family: material.family,
      thicknessMm: impact.thicknessMm,
      kgM2: impact.kgM2,
      kgPerLinearM: impact.kgPerLinearM,
      massKg: impact.massKg,
      structuralRisk: impact.structuralRisk,
      costIndex: material.costIndex,
      scheduleIndex: material.scheduleIndex,
      score,
      reviewRequired: impact.reviewRequired,
      datasheetRequired: impact.datasheetRequired,
    };
    const recommendation = recommendationFor(base);
    return {
      ...base,
      recommendation,
      rationale: rationaleFor({ ...base, recommendation }),
    };
  })
    .sort((a, b) => a.score - b.score)
    .map((row, index) => ({ ...row, rank: index + 1 }));

  const preferred = rows.find((row) => row.recommendation === 'preferred') ?? rows[0];
  const conditional = rows.filter((row) => row.recommendation === 'conditional').length;

  return {
    phase: 'F123',
    status: 'implemented-material-decision-matrix',
    areaM2: round(areaM2),
    heightM,
    rows,
    preferred,
    conditionalCount: conditional,
    outputs: ['ranking', 'kg/m2', 'kg/ml', 'masa', 'costo relativo', 'rapidez obra', 'revision estructural', 'ficha proveedor'],
    evidencePolicy:
      'Use F123 as a design-decision aid; final material selection still requires shielding calculation, vendor data and structural review when flagged.',
  };
}

export function buildF123MaterialDecisionSummary() {
  const matrix = buildF123MaterialDecisionMatrix({ areaM2: 10 });
  return {
    phase: 'F123',
    status: matrix.status,
    rowCount: matrix.rows.length,
    preferredMaterial: matrix.preferred.label,
    conditionalCount: matrix.conditionalCount,
    surface: 'MaterialComparisonDialog',
    nextPhase: 'F124 selected-barrier material apply workflow',
    decision:
      'F123 adds a material decision matrix for cost, schedule, weight and structural risk before applying changes to a real barrier.',
  };
}
