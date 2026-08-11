import type { F656F660RendererLegacyClickProbe } from '@/lib/f656F660RendererLegacyClickProbe';

export interface F661ObservedLegacyClickReceipt {
  phase: 'F661';
  observed: boolean;
  eventType: 'pointerdown-legacy' | 'not-observed';
  point: { x: number; y: number } | null;
  activeTool: string;
  evidenceId: string;
}

export interface F662ObservedSelectionStabilization {
  phase: 'F662';
  selectedId: string | null;
  selectedIds: string[];
  predictionMatches: boolean;
  evidence: string;
}

export interface F663ObservedMutationGuard {
  phase: 'F663';
  owner: 'useCanvas';
  geometryMutationObserved: boolean;
  deepRendererEventOwnership: boolean;
  evidence: string;
}

export interface F664F665ObservedClickBridgeGate {
  id: string;
  phase: 'F664' | 'F665';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F661F665RendererObservedClickBridge {
  schema: 'radshield-mx.canvas.renderer-observed-click-bridge.f661-f665.v1';
  phaseRange: 'F661-F665';
  status: 'observed-click-bridge-ready' | 'observed-click-bridge-partial' | 'observed-click-bridge-blocked';
  receipt: F661ObservedLegacyClickReceipt;
  stabilization: F662ObservedSelectionStabilization;
  mutationGuard: F663ObservedMutationGuard;
  gates: F664F665ObservedClickBridgeGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    selectedCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-preview' | 'eligible-for-controlled-owner-test' | 'blocked';
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

export function buildF661F665RendererObservedClickBridge(
  legacyProbe: F656F660RendererLegacyClickProbe,
  options: {
    observed?: boolean;
    point?: { x: number; y: number } | null;
    activeTool?: string;
    selectedId?: string | null;
    selectedIds?: string[];
    evidenceId?: string;
    geometryMutationObserved?: boolean;
    deepRendererEventOwnership?: boolean;
  } = {},
): F661F665RendererObservedClickBridge {
  const selectedIds = options.selectedIds ?? [];
  const observed = options.observed === true;
  const receipt: F661ObservedLegacyClickReceipt = {
    phase: 'F661',
    observed,
    eventType: observed ? 'pointerdown-legacy' : 'not-observed',
    point: options.point ?? null,
    activeTool: options.activeTool ?? legacyProbe.observation.activeTool,
    evidenceId: options.evidenceId ?? (observed ? 'f661-observed-click' : 'f661-click-pending'),
  };
  const stabilization: F662ObservedSelectionStabilization = {
    phase: 'F662',
    selectedId: options.selectedId ?? null,
    selectedIds,
    predictionMatches: legacyProbe.comparison.predictionMatchesObserved,
    evidence: legacyProbe.comparison.selectionDelta,
  };
  const mutationGuard: F663ObservedMutationGuard = {
    phase: 'F663',
    owner: 'useCanvas',
    geometryMutationObserved: options.geometryMutationObserved === true,
    deepRendererEventOwnership: options.deepRendererEventOwnership === true,
    evidence: options.deepRendererEventOwnership
      ? 'Renderer profundo tomo ownership: revertir.'
      : 'useCanvas conserva eventos; bridge solo observa.',
  };
  const gates: F664F665ObservedClickBridgeGate[] = [
    {
      id: 'f664-click-receipt',
      phase: 'F664',
      label: 'Click legacy capturado',
      pass: receipt.observed,
      evidence: receipt.evidenceId,
    },
    {
      id: 'f664-selection-stabilized',
      phase: 'F664',
      label: 'Seleccion estabilizada',
      pass: receipt.observed && selectedIds.length > 0,
      evidence: selectedIds.length ? selectedIds.join(',') : 'Sin seleccion estabilizada aun.',
    },
    {
      id: 'f664-prediction-match',
      phase: 'F664',
      label: 'Prediccion confirmada',
      pass: stabilization.predictionMatches,
      evidence: stabilization.evidence,
    },
    {
      id: 'f665-usecanvas-owner',
      phase: 'F665',
      label: 'Owner useCanvas',
      pass: !mutationGuard.deepRendererEventOwnership,
      evidence: mutationGuard.evidence,
    },
    {
      id: 'f665-no-geometry-mutation',
      phase: 'F665',
      label: 'Sin mutacion geometrica',
      pass: !mutationGuard.geometryMutationObserved,
      evidence: mutationGuard.geometryMutationObserved ? 'Mutacion detectada.' : 'Solo observacion.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = mutationGuard.deepRendererEventOwnership || mutationGuard.geometryMutationObserved;
  const ready = gates.every((gate) => gate.pass);
  const status = blocked ? 'observed-click-bridge-blocked' : ready ? 'observed-click-bridge-ready' : 'observed-click-bridge-partial';
  const recommendation = blocked
    ? 'blocked'
    : ready
      ? 'eligible-for-controlled-owner-test'
      : 'keep-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-observed-click-bridge.f661-f665.v1',
    phaseRange: 'F661-F665',
    status,
    receipt,
    stabilization,
    mutationGuard,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      selectedCount: selectedIds.length,
      cacheKey: `f661-${stableHash(`${legacyProbe.metrics.cacheKey}:${receipt.evidenceId}:${stabilization.evidence}:${status}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'eligible-for-controlled-owner-test'
        ? 'Click observado, seleccion estable y prediccion confirmada; siguiente fase puede probar owner controlado.'
        : recommendation === 'blocked'
          ? 'Bloquear y revertir: owner profundo o geometria cambiaron fuera del plan.'
          : 'Mantener preview: falta seleccion estabilizada o coincidencia con la prediccion.',
    },
    rollback: [
      'Descartar evidencia F661 y volver a F656-F660 si cambia el flujo de click.',
      'Mantener useCanvas como owner hasta que F664 y F665 pasen completos.',
      'Repetir smoke visual y E2E de boton derecho antes de activar owner controlado.',
    ],
  };
}
