import type { F661F665RendererObservedClickBridge } from '@/lib/f661F665RendererObservedClickBridge';

export interface F666DeferredSelectionSample {
  phase: 'F666';
  sampled: boolean;
  selectedId: string | null;
  selectedIds: string[];
  sampleDelayMs: number;
  evidenceId: string;
}

export interface F667SelectionMatchReview {
  phase: 'F667';
  expectedSelectedId: string | null;
  expectedSelectedIds: string[];
  settledSelectedId: string | null;
  settledSelectedIds: string[];
  matchesPrediction: boolean;
  evidence: string;
}

export interface F668SelectionStabilityGuard {
  phase: 'F668';
  clickObserved: boolean;
  selectionStable: boolean;
  ownerPreserved: boolean;
  geometryMutationObserved: boolean;
  evidence: string;
}

export interface F669F670SelectionStabilizerGate {
  id: string;
  phase: 'F669' | 'F670';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F666F670RendererSelectionStabilizer {
  schema: 'radshield-mx.canvas.renderer-selection-stabilizer.f666-f670.v1';
  phaseRange: 'F666-F670';
  status: 'selection-stabilizer-ready' | 'selection-stabilizer-preview' | 'selection-stabilizer-blocked';
  sample: F666DeferredSelectionSample;
  review: F667SelectionMatchReview;
  guard: F668SelectionStabilityGuard;
  gates: F669F670SelectionStabilizerGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    settledCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-preview' | 'eligible-for-owner-smoke' | 'blocked';
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

function sameIds(left: string[], right: string[]) {
  return left.length === right.length && left.every((id, index) => id === right[index]);
}

export function buildF666F670RendererSelectionStabilizer(
  observedBridge: F661F665RendererObservedClickBridge,
  options: {
    sampled?: boolean;
    selectedId?: string | null;
    selectedIds?: string[];
    expectedSelectedId?: string | null;
    expectedSelectedIds?: string[];
    sampleDelayMs?: number;
    evidenceId?: string;
    geometryMutationObserved?: boolean;
  } = {},
): F666F670RendererSelectionStabilizer {
  const settledSelectedIds = options.selectedIds ?? [];
  const expectedSelectedIds = options.expectedSelectedIds ?? [];
  const sample: F666DeferredSelectionSample = {
    phase: 'F666',
    sampled: options.sampled === true,
    selectedId: options.selectedId ?? null,
    selectedIds: settledSelectedIds,
    sampleDelayMs: options.sampleDelayMs ?? 80,
    evidenceId: options.evidenceId ?? 'f666-selection-sample-pending',
  };
  const matchesPrediction = sample.sampled
    && sample.selectedId === (options.expectedSelectedId ?? null)
    && sameIds(settledSelectedIds, expectedSelectedIds);
  const review: F667SelectionMatchReview = {
    phase: 'F667',
    expectedSelectedId: options.expectedSelectedId ?? null,
    expectedSelectedIds,
    settledSelectedId: sample.selectedId,
    settledSelectedIds,
    matchesPrediction,
    evidence: sample.sampled
      ? `expected ${options.expectedSelectedId ?? 'none'} / settled ${sample.selectedId ?? 'none'}`
      : 'muestra diferida pendiente',
  };
  const selectionStable = sample.sampled && settledSelectedIds.length > 0;
  const guard: F668SelectionStabilityGuard = {
    phase: 'F668',
    clickObserved: observedBridge.receipt.observed,
    selectionStable,
    ownerPreserved: !observedBridge.mutationGuard.deepRendererEventOwnership,
    geometryMutationObserved: options.geometryMutationObserved === true,
    evidence: selectionStable
      ? 'Seleccion legacy estabilizada despues del click.'
      : 'Click observado pero seleccion legacy aun no estabiliza.',
  };
  const gates: F669F670SelectionStabilizerGate[] = [
    {
      id: 'f669-click-observed',
      phase: 'F669',
      label: 'Click observado',
      pass: guard.clickObserved,
      evidence: observedBridge.receipt.evidenceId,
    },
    {
      id: 'f669-deferred-sample',
      phase: 'F669',
      label: 'Muestra diferida',
      pass: sample.sampled,
      evidence: sample.evidenceId,
    },
    {
      id: 'f669-selection-stable',
      phase: 'F669',
      label: 'Seleccion estable',
      pass: guard.selectionStable,
      evidence: sample.selectedIds.join(',') || 'Sin seleccion asentada.',
    },
    {
      id: 'f670-prediction-match',
      phase: 'F670',
      label: 'Prediccion coincide',
      pass: review.matchesPrediction,
      evidence: review.evidence,
    },
    {
      id: 'f670-owner-preserved',
      phase: 'F670',
      label: 'Owner preservado',
      pass: guard.ownerPreserved,
      evidence: observedBridge.mutationGuard.evidence,
    },
    {
      id: 'f670-no-geometry-mutation',
      phase: 'F670',
      label: 'Sin mutacion geometrica',
      pass: !guard.geometryMutationObserved,
      evidence: guard.geometryMutationObserved ? 'Mutacion detectada.' : 'Solo lectura.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = !guard.ownerPreserved || guard.geometryMutationObserved;
  const ready = gates.every((gate) => gate.pass);
  const status = blocked ? 'selection-stabilizer-blocked' : ready ? 'selection-stabilizer-ready' : 'selection-stabilizer-preview';
  const recommendation = blocked
    ? 'blocked'
    : ready
      ? 'eligible-for-owner-smoke'
      : 'keep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-selection-stabilizer.f666-f670.v1',
    phaseRange: 'F666-F670',
    status,
    sample,
    review,
    guard,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      settledCount: settledSelectedIds.length,
      cacheKey: `f666-${stableHash(`${observedBridge.metrics.cacheKey}:${sample.evidenceId}:${review.evidence}:${status}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'eligible-for-owner-smoke'
        ? 'Seleccion post-click coincide; puede probarse owner smoke controlado.'
        : recommendation === 'blocked'
          ? 'No continuar: owner o geometria dejaron de ser seguros.'
          : 'Mantener preview hasta que click, seleccion y prediccion coincidan.',
    },
    rollback: [
      'Descartar muestra F666 y volver a F661-F665 si cambia el handler legacy.',
      'No activar owner profundo si seleccion estable o prediccion no coinciden.',
      'Repetir E2E de click, boton derecho y toolbar antes de owner smoke.',
    ],
  };
}
