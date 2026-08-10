import type { F636F640RendererHitTestShadow } from '@/lib/f636F640RendererHitTestShadow';

export interface F641LegacyEventSnapshot {
  phase: 'F641';
  activeTool: string;
  selectedId: string | null;
  selectedIds: string[];
  snapToGrid: boolean;
  pointerEventsOwner: 'useCanvas';
}

export interface F642DryRunEventIntent {
  phase: 'F642';
  eventType: 'pointerdown-preview';
  predictedTargetId: string | null;
  predictedInstructionId: string | null;
  predictedLayer: string | null;
  action: 'select-candidate' | 'pan-canvas' | 'draw-with-active-tool' | 'noop';
  reason: string;
}

export interface F643DryRunComparison {
  phase: 'F643';
  legacySelectionMatchesCandidate: boolean;
  legacySelectionPresent: boolean;
  candidatePresent: boolean;
  mismatchReason: string;
}

export interface F644DryRunGate {
  id: string;
  phase: 'F644' | 'F645';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F641F645RendererEventDryRun {
  schema: 'radshield-mx.canvas.renderer-event-dry-run.f641-f645.v1';
  phaseRange: 'F641-F645';
  status: 'event-dry-run-ready' | 'event-dry-run-preview' | 'event-dry-run-blocked';
  legacy: F641LegacyEventSnapshot;
  intent: F642DryRunEventIntent;
  comparison: F643DryRunComparison;
  gates: F644DryRunGate[];
  metrics: {
    candidateCount: number;
    selectedCount: number;
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

function normalizeSelection(selectedId: string | null | undefined, selectedIds: string[] | undefined) {
  const ids = Array.from(new Set([...(selectedIds ?? []), selectedId].filter((value): value is string => Boolean(value))));
  return {
    selectedId: selectedId ?? null,
    selectedIds: ids,
  };
}

export function buildF641F645RendererEventDryRun(
  shadow: F636F640RendererHitTestShadow,
  options: {
    activeTool: string;
    selectedId?: string | null;
    selectedIds?: string[];
    snapToGrid?: boolean;
    highRiskRendererEnabled?: boolean;
  },
): F641F645RendererEventDryRun {
  const selection = normalizeSelection(options.selectedId, options.selectedIds);
  const primaryTarget = shadow.targets.find((target) => target.id === shadow.probe.primaryCandidateId) ?? null;
  const activeTool = options.activeTool || 'select';
  const legacy: F641LegacyEventSnapshot = {
    phase: 'F641',
    activeTool,
    selectedId: selection.selectedId,
    selectedIds: selection.selectedIds,
    snapToGrid: options.snapToGrid === true,
    pointerEventsOwner: 'useCanvas',
  };

  const action = primaryTarget
    ? activeTool === 'select'
      ? 'select-candidate'
      : 'draw-with-active-tool'
    : activeTool === 'pan'
      ? 'pan-canvas'
      : 'noop';
  const intent: F642DryRunEventIntent = {
    phase: 'F642',
    eventType: 'pointerdown-preview',
    predictedTargetId: primaryTarget?.id ?? null,
    predictedInstructionId: primaryTarget?.instructionId ?? null,
    predictedLayer: primaryTarget?.layer ?? null,
    action,
    reason: primaryTarget
      ? `Candidato ${primaryTarget.instructionId} en capa ${primaryTarget.layer}; accion ${action}.`
      : 'Sin candidato primario; mantener flujo legacy.',
  };

  const legacySelectionMatchesCandidate = Boolean(
    intent.predictedInstructionId
    && (selection.selectedIds.includes(intent.predictedInstructionId) || selection.selectedIds.includes(intent.predictedTargetId ?? '')),
  );
  const comparison: F643DryRunComparison = {
    phase: 'F643',
    legacySelectionMatchesCandidate,
    legacySelectionPresent: selection.selectedIds.length > 0,
    candidatePresent: Boolean(intent.predictedTargetId),
    mismatchReason: legacySelectionMatchesCandidate
      ? 'Seleccion legacy ya coincide con candidato dry-run.'
      : selection.selectedIds.length > 0
        ? 'Seleccion legacy apunta a otro objeto; no se modifica.'
        : 'No hay seleccion legacy; candidato permanece como preview.',
  };

  const gates: F644DryRunGate[] = [
    {
      id: 'f644-shadow-available',
      phase: 'F644',
      label: 'Shadow F636 disponible',
      pass: shadow.status !== 'hit-test-shadow-blocked',
      evidence: shadow.status,
    },
    {
      id: 'f644-intent-derived',
      phase: 'F644',
      label: 'Intent derivado',
      pass: intent.action !== 'noop' || !comparison.candidatePresent,
      evidence: intent.reason,
    },
    {
      id: 'f645-usecanvas-owner',
      phase: 'F645',
      label: 'useCanvas conserva eventos',
      pass: legacy.pointerEventsOwner === 'useCanvas' && options.highRiskRendererEnabled !== true,
      evidence: options.highRiskRendererEnabled ? 'Flag alto riesgo activo; requiere E2E de eventos antes de ejecutar.' : 'Dry-run no llama setCanvasState ni handlers.',
    },
  ];
  const blocked = gates.some((gate) => !gate.pass && gate.id !== 'f645-usecanvas-owner');
  const status = blocked
    ? 'event-dry-run-blocked'
    : options.highRiskRendererEnabled
      ? 'event-dry-run-ready'
      : 'event-dry-run-preview';

  return {
    schema: 'radshield-mx.canvas.renderer-event-dry-run.f641-f645.v1',
    phaseRange: 'F641-F645',
    status,
    legacy,
    intent,
    comparison,
    gates,
    metrics: {
      candidateCount: shadow.probe.candidateIds.length,
      selectedCount: selection.selectedIds.length,
      cacheKey: `f641-${stableHash(`${shadow.metrics.cacheKey}:${activeTool}:${selection.selectedIds.join(',')}:${intent.predictedTargetId ?? 'none'}`)}`,
    },
    rollback: [
      'Desactivar F641-F645 y mantener F636-F640 como overlay de candidatos.',
      'No ejecutar intent F642 hasta tener E2E dedicado de pointerdown, seleccion, multi-select y escape.',
      'useCanvas sigue siendo el owner canonico de eventos, seleccion y herramientas.',
    ],
  };
}
