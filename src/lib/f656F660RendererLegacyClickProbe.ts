import type { F651F655RendererActivationQa } from '@/lib/f651F655RendererActivationQa';

export interface F656LegacyClickObservation {
  phase: 'F656';
  observed: boolean;
  eventType: 'pointerdown-legacy' | 'tool-click-legacy' | 'not-observed';
  point: { x: number; y: number } | null;
  activeTool: string;
  selectedId: string | null;
  selectedIds: string[];
  evidenceId: string;
}

export interface F657LegacyClickComparison {
  phase: 'F657';
  expectedSelectedId: string | null;
  observedSelectedId: string | null;
  predictionMatchesObserved: boolean;
  selectionDelta: string;
}

export interface F658LegacyOwnerSafety {
  phase: 'F658';
  owner: 'useCanvas';
  deepRendererTookOwnership: boolean;
  geometryMutationObserved: boolean;
  evidence: string;
}

export interface F659F660LegacyClickProbeGate {
  id: string;
  phase: 'F659' | 'F660';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F656F660RendererLegacyClickProbe {
  schema: 'radshield-mx.canvas.renderer-legacy-click-probe.f656-f660.v1';
  phaseRange: 'F656-F660';
  status: 'legacy-click-probe-ready' | 'legacy-click-probe-preview' | 'legacy-click-probe-blocked';
  observation: F656LegacyClickObservation;
  comparison: F657LegacyClickComparison;
  safety: F658LegacyOwnerSafety;
  gates: F659F660LegacyClickProbeGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    observedSelectionCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-preview' | 'eligible-for-owner-flag' | 'blocked';
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

export function buildF656F660RendererLegacyClickProbe(
  activationQa: F651F655RendererActivationQa,
  options: {
    observed?: boolean;
    eventType?: F656LegacyClickObservation['eventType'];
    point?: { x: number; y: number } | null;
    activeTool?: string;
    selectedId?: string | null;
    selectedIds?: string[];
    evidenceId?: string;
    highRiskRendererEnabled?: boolean;
    geometryMutationObserved?: boolean;
  } = {},
): F656F660RendererLegacyClickProbe {
  const selectedIds = options.selectedIds ?? [];
  const observation: F656LegacyClickObservation = {
    phase: 'F656',
    observed: options.observed === true,
    eventType: options.observed ? options.eventType ?? 'pointerdown-legacy' : 'not-observed',
    point: options.point ?? null,
    activeTool: options.activeTool ?? 'select',
    selectedId: options.selectedId ?? null,
    selectedIds,
    evidenceId: options.evidenceId ?? 'f656-e2e-pending',
  };

  const predictionMatchesObserved = observation.observed
    && observation.selectedId === activationQa.expectation.expectedSelectedId
    && sameIds(observation.selectedIds, activationQa.expectation.expectedSelectedIds);
  const comparison: F657LegacyClickComparison = {
    phase: 'F657',
    expectedSelectedId: activationQa.expectation.expectedSelectedId,
    observedSelectedId: observation.selectedId,
    predictionMatchesObserved,
    selectionDelta: observation.observed
      ? `expected ${activationQa.expectation.expectedSelectedId ?? 'none'} / observed ${observation.selectedId ?? 'none'}`
      : 'legacy click pendiente; no comparar seleccion real todavia',
  };

  const safety: F658LegacyOwnerSafety = {
    phase: 'F658',
    owner: 'useCanvas',
    deepRendererTookOwnership: options.highRiskRendererEnabled === true,
    geometryMutationObserved: options.geometryMutationObserved === true,
    evidence: options.highRiskRendererEnabled
      ? 'Flag alto riesgo activo; no promover sin smoke antes/despues.'
      : 'Owner legacy preservado; deep renderer permanece en preview.',
  };

  const gates: F659F660LegacyClickProbeGate[] = [
    {
      id: 'f659-activation-qa-available',
      phase: 'F659',
      label: 'Activation QA disponible',
      pass: activationQa.status !== 'activation-qa-blocked',
      evidence: activationQa.status,
    },
    {
      id: 'f659-legacy-click-observed',
      phase: 'F659',
      label: 'Click legacy observado',
      pass: observation.observed,
      evidence: observation.evidenceId,
    },
    {
      id: 'f659-prediction-matches-observed',
      phase: 'F659',
      label: 'Prediccion coincide',
      pass: predictionMatchesObserved,
      evidence: comparison.selectionDelta,
    },
    {
      id: 'f660-owner-preserved',
      phase: 'F660',
      label: 'Owner legacy preservado',
      pass: !safety.deepRendererTookOwnership,
      evidence: safety.evidence,
    },
    {
      id: 'f660-geometry-unchanged',
      phase: 'F660',
      label: 'Geometria sin mutacion',
      pass: !safety.geometryMutationObserved,
      evidence: safety.geometryMutationObserved ? 'Mutacion detectada.' : 'Solo lectura / preview.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const requiredReady = gates.every((gate) => gate.pass);
  const blocked = !gates[0].pass || safety.geometryMutationObserved || safety.deepRendererTookOwnership;
  const status = blocked ? 'legacy-click-probe-blocked' : requiredReady ? 'legacy-click-probe-ready' : 'legacy-click-probe-preview';
  const recommendation = blocked
    ? 'blocked'
    : requiredReady
      ? 'eligible-for-owner-flag'
      : 'keep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-legacy-click-probe.f656-f660.v1',
    phaseRange: 'F656-F660',
    status,
    observation,
    comparison,
    safety,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      observedSelectionCount: observation.selectedIds.length,
      cacheKey: `f656-${stableHash(`${activationQa.metrics.cacheKey}:${observation.evidenceId}:${comparison.selectionDelta}:${status}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'eligible-for-owner-flag'
        ? 'Click legacy observado y coincide; se puede probar ownership bajo flag en la siguiente fase.'
        : recommendation === 'blocked'
          ? 'No activar: preservar useCanvas y revisar mutaciones o QA base.'
          : 'Mantener preview hasta ejecutar click legacy observado con seleccion coincidente.',
    },
    rollback: [
      'No cambiar ownership: useCanvas sigue procesando pointerdown y toolbar.',
      'Si el click observado no coincide, volver a F636-F645 para revisar hit-test y dry-run.',
      'Si hay mutacion inesperada, desactivar flag y repetir F197/F207/F229 antes de continuar.',
    ],
  };
}
