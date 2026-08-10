import type { F641F645RendererEventDryRun } from '@/lib/f641F645RendererEventDryRun';

export interface F646SelectionTransactionDraft {
  phase: 'F646';
  operationId: string;
  operation: 'select-preview' | 'draw-preview' | 'pan-preview' | 'noop-preview';
  targetId: string | null;
  instructionId: string | null;
  layer: string | null;
  reason: string;
}

export interface F647SelectionSnapshot {
  phase: 'F647';
  beforeSelectedId: string | null;
  beforeSelectedIds: string[];
  afterSelectedId: string | null;
  afterSelectedIds: string[];
  changed: boolean;
}

export interface F648RollbackToken {
  phase: 'F648';
  token: string;
  canRollback: boolean;
  restoresSelectedId: string | null;
  restoresSelectedIds: string[];
}

export interface F649SelectionTransactionGate {
  id: string;
  phase: 'F649' | 'F650';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F646F650RendererSelectionTransaction {
  schema: 'radshield-mx.canvas.renderer-selection-transaction.f646-f650.v1';
  phaseRange: 'F646-F650';
  status: 'selection-transaction-ready' | 'selection-transaction-preview' | 'selection-transaction-blocked';
  draft: F646SelectionTransactionDraft;
  snapshot: F647SelectionSnapshot;
  rollbackToken: F648RollbackToken;
  gates: F649SelectionTransactionGate[];
  metrics: {
    changedCount: number;
    beforeCount: number;
    afterCount: number;
    cacheKey: string;
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

function asUniqueIds(ids: Array<string | null | undefined>) {
  return Array.from(new Set(ids.filter((value): value is string => Boolean(value))));
}

function operationForIntent(intentAction: F641F645RendererEventDryRun['intent']['action']): F646SelectionTransactionDraft['operation'] {
  if (intentAction === 'select-candidate') return 'select-preview';
  if (intentAction === 'draw-with-active-tool') return 'draw-preview';
  if (intentAction === 'pan-canvas') return 'pan-preview';
  return 'noop-preview';
}

export function buildF646F650RendererSelectionTransaction(
  dryRun: F641F645RendererEventDryRun,
  options: { highRiskRendererEnabled?: boolean } = {},
): F646F650RendererSelectionTransaction {
  const operation = operationForIntent(dryRun.intent.action);
  const beforeSelectedIds = asUniqueIds(dryRun.legacy.selectedIds);
  const canPreviewSelect = operation === 'select-preview' && Boolean(dryRun.intent.predictedInstructionId);
  const afterSelectedId = canPreviewSelect ? dryRun.intent.predictedInstructionId : dryRun.legacy.selectedId;
  const afterSelectedIds = canPreviewSelect ? asUniqueIds([dryRun.intent.predictedInstructionId]) : beforeSelectedIds;
  const changed = afterSelectedId !== dryRun.legacy.selectedId
    || beforeSelectedIds.join('|') !== afterSelectedIds.join('|');
  const operationId = `f646-op-${stableHash(`${dryRun.metrics.cacheKey}:${operation}:${dryRun.intent.predictedTargetId ?? 'none'}`)}`;
  const draft: F646SelectionTransactionDraft = {
    phase: 'F646',
    operationId,
    operation,
    targetId: dryRun.intent.predictedTargetId,
    instructionId: dryRun.intent.predictedInstructionId,
    layer: dryRun.intent.predictedLayer,
    reason: canPreviewSelect
      ? `Seleccion simulada de ${dryRun.intent.predictedInstructionId}.`
      : `Operacion ${operation} permanece sin commit real.`,
  };

  const snapshot: F647SelectionSnapshot = {
    phase: 'F647',
    beforeSelectedId: dryRun.legacy.selectedId,
    beforeSelectedIds,
    afterSelectedId: afterSelectedId ?? null,
    afterSelectedIds,
    changed,
  };
  const rollbackToken: F648RollbackToken = {
    phase: 'F648',
    token: `f648-rollback-${stableHash(`${operationId}:${beforeSelectedIds.join(',')}:${dryRun.legacy.selectedId ?? 'none'}`)}`,
    canRollback: true,
    restoresSelectedId: dryRun.legacy.selectedId,
    restoresSelectedIds: beforeSelectedIds,
  };
  const gates: F649SelectionTransactionGate[] = [
    {
      id: 'f649-dry-run-ready',
      phase: 'F649',
      label: 'Dry-run F641 disponible',
      pass: dryRun.status !== 'event-dry-run-blocked',
      evidence: dryRun.status,
    },
    {
      id: 'f649-rollback-token',
      phase: 'F649',
      label: 'Rollback token creado',
      pass: rollbackToken.canRollback && rollbackToken.token.startsWith('f648-rollback-'),
      evidence: rollbackToken.token,
    },
    {
      id: 'f650-no-real-commit',
      phase: 'F650',
      label: 'Sin commit real',
      pass: options.highRiskRendererEnabled !== true,
      evidence: options.highRiskRendererEnabled ? 'Flag alto riesgo activo; requiere E2E antes de escribir seleccion.' : 'Transaccion simulada no llama setCanvasState.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass && gate.id !== 'f650-no-real-commit');
  const status = blocked
    ? 'selection-transaction-blocked'
    : options.highRiskRendererEnabled
      ? 'selection-transaction-ready'
      : 'selection-transaction-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-selection-transaction.f646-f650.v1',
    phaseRange: 'F646-F650',
    status,
    draft,
    snapshot,
    rollbackToken,
    gates,
    metrics: {
      changedCount: changed ? 1 : 0,
      beforeCount: beforeSelectedIds.length,
      afterCount: afterSelectedIds.length,
      cacheKey: `f646-${stableHash(`${operationId}:${snapshot.afterSelectedIds.join(',')}:${rollbackToken.token}`)}`,
    },
    rollback: [
      'Descartar transaccion F646-F650 y volver a F641-F645 dry-run.',
      'Usar token F648 para restaurar selectedId/selectedIds si una futura fase activa commit real.',
      'No escribir seleccion real hasta E2E de pointerdown, escape, multi-select y undo.',
    ],
  };
}
