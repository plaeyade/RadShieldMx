import type { F686F690RendererOwnerBeforeAfterSmoke } from '@/lib/f686F690RendererOwnerBeforeAfterSmoke';

export interface F691F695RendererControlledOwnerSmoke {
  schema: 'radshield-mx.canvas.renderer-controlled-owner-smoke.f691-f695.v1';
  phaseRange: 'F691-F695';
  status: 'controlled-owner-smoke-ready' | 'controlled-owner-smoke-preview' | 'controlled-owner-smoke-blocked';
  scope: {
    action: 'select-target-only';
    currentOwner: 'useCanvas';
    candidateOwner: 'deep-renderer-v2';
    allowedWrites: string[];
    blockedWrites: Array<'barriers' | 'sources' | 'geometry' | 'materials' | 'scale'>;
  };
  preconditions: {
    beforeAfterReady: boolean;
    highRiskRendererEnabled: boolean;
    eventControllerV2Enabled: boolean;
    selectionParityObserved: boolean;
  };
  executionPlan: {
    mode: 'flagged-selection-only' | 'dry-run-observed' | 'blocked';
    eventControllerRequired: 'canvasEventControllerV2';
    canExecuteMinimalSmoke: boolean;
    rollbackTrigger: string;
  };
  gates: Array<{
    id: string;
    phase: 'F691' | 'F692' | 'F693' | 'F694' | 'F695';
    label: string;
    pass: boolean;
    evidence: string;
  }>;
  metrics: {
    passCount: number;
    gateCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'run-selection-owner-smoke' | 'keep-usecanvas' | 'blocked';
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

export function buildF691F695RendererControlledOwnerSmoke(
  beforeAfter: F686F690RendererOwnerBeforeAfterSmoke,
  options: { highRiskRendererEnabled?: boolean; eventControllerV2Enabled?: boolean } = {},
): F691F695RendererControlledOwnerSmoke {
  const noGeometryWrite = beforeAfter.gates.some((gate) => gate.id === 'f690-no-geometry-write' && gate.pass);
  const rollbackReady = beforeAfter.rollback.length > 0
    && beforeAfter.gates.some((gate) => gate.id === 'f690-rollback-ready' && gate.pass);
  const beforeAfterReady = beforeAfter.status === 'before-after-smoke-ready'
    && beforeAfter.decision.recommendation === 'eligible-for-controlled-owner-smoke';
  const beforeAfterPreviewSafe = beforeAfter.parity.observed === true
    && beforeAfter.baseline.targetedClickReady
    && noGeometryWrite
    && rollbackReady;
  const highRiskRendererEnabled = options.highRiskRendererEnabled === true;
  const eventControllerV2Enabled = options.eventControllerV2Enabled === true;
  const selectionParityObserved = beforeAfter.parity.observed === true;
  const canExecuteMinimalSmoke = beforeAfterReady && highRiskRendererEnabled && eventControllerV2Enabled && selectionParityObserved;
  const gates: F691F695RendererControlledOwnerSmoke['gates'] = [
    {
      id: 'f691-before-after-ready',
      phase: 'F691',
      label: 'Before/after listo',
      pass: beforeAfterReady || beforeAfterPreviewSafe,
      evidence: beforeAfterReady ? beforeAfter.decision.reason : 'Before/after tiene paridad/rollback seguros, pero ownership real sigue diferido.',
    },
    {
      id: 'f692-selection-only-scope',
      phase: 'F692',
      label: 'Scope seleccion-only',
      pass: true,
      evidence: 'La accion permitida es seleccionar target; no hay commit de geometria.',
    },
    {
      id: 'f693-double-flag-required',
      phase: 'F693',
      label: 'Doble bandera requerida',
      pass: highRiskRendererEnabled && eventControllerV2Enabled,
      evidence: highRiskRendererEnabled && eventControllerV2Enabled
        ? 'canvasHighRiskCad y canvasEventControllerV2 activos para smoke controlado.'
        : 'Mantener useCanvas hasta activar ambas banderas en staging.',
    },
    {
      id: 'f694-no-model-writes',
      phase: 'F694',
      label: 'Sin escrituras modelo',
      pass: true,
      evidence: 'Writes bloqueados: barreras, fuentes, escala, materiales y geometria.',
    },
    {
      id: 'f695-rollback-usecanvas',
      phase: 'F695',
      label: 'Rollback useCanvas',
      pass: beforeAfter.rollback.length > 0,
      evidence: beforeAfter.rollback[0] ?? 'Apagar flags y volver a useCanvas.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = !beforeAfterPreviewSafe && !beforeAfterReady;
  const status = blocked
    ? 'controlled-owner-smoke-blocked'
    : canExecuteMinimalSmoke
      ? 'controlled-owner-smoke-ready'
      : 'controlled-owner-smoke-preview';
  const recommendation = status === 'controlled-owner-smoke-ready'
    ? 'run-selection-owner-smoke'
    : status === 'controlled-owner-smoke-blocked'
      ? 'blocked'
      : 'keep-usecanvas';

  return {
    schema: 'radshield-mx.canvas.renderer-controlled-owner-smoke.f691-f695.v1',
    phaseRange: 'F691-F695',
    status,
    scope: {
      action: 'select-target-only',
      currentOwner: 'useCanvas',
      candidateOwner: 'deep-renderer-v2',
      allowedWrites: [],
      blockedWrites: ['barriers', 'sources', 'geometry', 'materials', 'scale'],
    },
    preconditions: {
      beforeAfterReady,
      highRiskRendererEnabled,
      eventControllerV2Enabled,
      selectionParityObserved,
    },
    executionPlan: {
      mode: canExecuteMinimalSmoke ? 'flagged-selection-only' : beforeAfterReady || beforeAfterPreviewSafe ? 'dry-run-observed' : 'blocked',
      eventControllerRequired: 'canvasEventControllerV2',
      canExecuteMinimalSmoke,
      rollbackTrigger: 'selection mismatch, duplicate selection, pointer capture failure or any geometry mutation.',
    },
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      cacheKey: `f691-${stableHash(`${beforeAfter.metrics.cacheKey}:${status}:${passCount}:${eventControllerV2Enabled}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'run-selection-owner-smoke'
        ? 'Puede ejecutarse smoke minimo: deep renderer observa seleccion, useCanvas conserva escritura.'
        : recommendation === 'blocked'
          ? 'No ejecutar: falta paridad observada, rollback o no-write gate.'
          : 'Mantener useCanvas; smoke listo como preview seguro hasta decidir transferencia de owner.',
    },
    rollback: [
      'Apagar canvasEventControllerV2 primero; mantener canvasHighRiskCad apagado si hay mismatch.',
      'Recargar y repetir F686-F690 before/after contra el mismo punto de click.',
      'No permitir escrituras de barreras/fuentes desde deep renderer hasta completar smoke con owner real.',
    ],
  };
}
