import type { F666F670RendererSelectionStabilizer } from '@/lib/f666F670RendererSelectionStabilizer';

export interface F671PredictedLegacyMapping {
  phase: 'F671';
  expectedSelectedId: string | null;
  settledSelectedId: string | null;
  expectedAliases: string[];
  settledAliases: string[];
}

export interface F672AlignmentDiagnosis {
  phase: 'F672';
  alignment: 'match' | 'alias-match' | 'missing-selection' | 'mismatch';
  canTrustPrediction: boolean;
  reason: string;
}

export interface F673F675AlignmentGate {
  id: string;
  phase: 'F673' | 'F674' | 'F675';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F671F675RendererPredictionAlignment {
  schema: 'radshield-mx.canvas.renderer-prediction-alignment.f671-f675.v1';
  phaseRange: 'F671-F675';
  status: 'prediction-alignment-ready' | 'prediction-alignment-review' | 'prediction-alignment-blocked';
  mapping: F671PredictedLegacyMapping;
  diagnosis: F672AlignmentDiagnosis;
  gates: F673F675AlignmentGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    aliasCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-preview' | 'allow-owner-smoke-prep' | 'blocked';
    reason: string;
  };
  rollback: string[];
}

function stableHash(input: string): string {
  let hash = 2166136261;
  for (let index = 0; index < input.length; index += 1) {
    hash ^= input.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

function aliasesFor(id: string | null): string[] {
  if (!id) return [];
  const parts = id.split(':').filter(Boolean);
  const tail = parts[parts.length - 1];
  const withoutPrefix = id.replace(/^f\d+:/, '');
  return Array.from(new Set([id, withoutPrefix, tail].filter(Boolean)));
}

export function buildF671F675RendererPredictionAlignment(
  stabilizer: F666F670RendererSelectionStabilizer,
): F671F675RendererPredictionAlignment {
  const expectedAliases = aliasesFor(stabilizer.review.expectedSelectedId);
  const settledAliases = aliasesFor(stabilizer.review.settledSelectedId);
  const directMatch = Boolean(stabilizer.review.expectedSelectedId && stabilizer.review.expectedSelectedId === stabilizer.review.settledSelectedId);
  const aliasMatch = !directMatch && expectedAliases.some((id) => settledAliases.includes(id));
  const missingSelection = stabilizer.sample.sampled && stabilizer.review.settledSelectedIds.length === 0;
  const diagnosis: F672AlignmentDiagnosis = {
    phase: 'F672',
    alignment: directMatch ? 'match' : aliasMatch ? 'alias-match' : missingSelection ? 'missing-selection' : 'mismatch',
    canTrustPrediction: directMatch || aliasMatch,
    reason: directMatch
      ? 'Seleccion legacy coincide exactamente con prediccion.'
      : aliasMatch
        ? 'Seleccion legacy coincide por alias normalizado.'
        : missingSelection
          ? 'Click y muestra existen, pero useCanvas no dejo seleccion asentada.'
          : 'Seleccion legacy apunta a otro objeto o no comparte alias.',
  };
  const clickSampleSatisfied = (stabilizer.guard.clickObserved && stabilizer.sample.sampled) || diagnosis.canTrustPrediction;
  const gates: F673F675AlignmentGate[] = [
    {
      id: 'f673-click-and-sample',
      phase: 'F673',
      label: 'Click y sample',
      pass: clickSampleSatisfied,
      evidence: clickSampleSatisfied && diagnosis.canTrustPrediction
        ? `Seleccion alineada por ${diagnosis.alignment}; se tolera desfase de sample/click.`
        : `${stabilizer.guard.clickObserved ? 'click' : 'no-click'} / ${stabilizer.sample.sampled ? 'sample' : 'no-sample'}`,
    },
    {
      id: 'f673-selection-present',
      phase: 'F673',
      label: 'Seleccion presente',
      pass: stabilizer.review.settledSelectedIds.length > 0,
      evidence: stabilizer.review.settledSelectedIds.join(',') || 'Sin seleccion legacy asentada.',
    },
    {
      id: 'f674-alignment-trusted',
      phase: 'F674',
      label: 'Prediccion confiable',
      pass: diagnosis.canTrustPrediction,
      evidence: diagnosis.reason,
    },
    {
      id: 'f675-owner-safe',
      phase: 'F675',
      label: 'Owner/geometria seguros',
      pass: stabilizer.guard.ownerPreserved && !stabilizer.guard.geometryMutationObserved,
      evidence: stabilizer.guard.evidence,
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = !gates[0].pass || !gates[3].pass;
  const ready = gates.every((gate) => gate.pass);
  const status = blocked ? 'prediction-alignment-blocked' : ready ? 'prediction-alignment-ready' : 'prediction-alignment-review';
  const recommendation = blocked ? 'blocked' : ready ? 'allow-owner-smoke-prep' : 'keep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-prediction-alignment.f671-f675.v1',
    phaseRange: 'F671-F675',
    status,
    mapping: {
      phase: 'F671',
      expectedSelectedId: stabilizer.review.expectedSelectedId,
      settledSelectedId: stabilizer.review.settledSelectedId,
      expectedAliases,
      settledAliases,
    },
    diagnosis,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      aliasCount: expectedAliases.length + settledAliases.length,
      cacheKey: `f671-${stableHash(`${stabilizer.metrics.cacheKey}:${diagnosis.alignment}:${diagnosis.reason}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'allow-owner-smoke-prep'
        ? 'Prediccion y seleccion legacy estan alineadas; preparar owner smoke controlado.'
        : recommendation === 'blocked'
          ? 'No continuar: falta click/sample seguro o owner/geometria no son seguros.'
          : 'Mantener preview y corregir hit-test/prediccion contra seleccion legacy.',
    },
    rollback: [
      'Volver a F636-F645 si la prediccion apunta a un target distinto al legacy.',
      'No activar owner smoke mientras F674 no sea OK.',
      'Conservar useCanvas como fuente de verdad para seleccion.',
    ],
  };
}
