import type { F636F640RendererHitTestShadow, F636HitTargetShadow } from '@/lib/f636F640RendererHitTestShadow';
import type { F671F675RendererPredictionAlignment } from '@/lib/f671F675RendererPredictionAlignment';

export interface F681LegacyTargetResolution {
  phase: 'F681';
  expectedId: string | null;
  targetId: string | null;
  instructionId: string | null;
  aliases: string[];
  found: boolean;
}

export interface F682TargetedClickPoint {
  phase: 'F682';
  x: number | null;
  y: number | null;
  source: 'predicted-target-center' | 'primary-probe-center' | 'none';
  evidence: string;
}

export interface F683SelectionOutcomeReview {
  phase: 'F683';
  beforeDiagnosis: F671F675RendererPredictionAlignment['diagnosis']['alignment'];
  expectedAfterClick: 'match-or-alias-match' | 'selection-required' | 'blocked';
  e2eReady: boolean;
  evidence: string;
}

export interface F684F685TargetedClickGate {
  id: string;
  phase: 'F684' | 'F685';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F681F685RendererTargetedLegacyClick {
  schema: 'radshield-mx.canvas.renderer-targeted-legacy-click.f681-f685.v1';
  phaseRange: 'F681-F685';
  status: 'targeted-click-ready' | 'targeted-click-preview' | 'targeted-click-blocked';
  resolution: F681LegacyTargetResolution;
  clickPoint: F682TargetedClickPoint;
  outcome: F683SelectionOutcomeReview;
  gates: F684F685TargetedClickGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    targetCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'click-predicted-center' | 'keep-preview' | 'blocked';
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
  const withoutPhase = id.replace(/^f\d+:/, '');
  return Array.from(new Set([id, withoutPhase, tail].filter(Boolean)));
}

function targetAliases(target: F636HitTargetShadow): string[] {
  return Array.from(new Set([
    target.id,
    target.commandId,
    target.instructionId,
    ...aliasesFor(target.instructionId),
    ...aliasesFor(target.commandId),
  ]));
}

export function buildF681F685RendererTargetedLegacyClick(
  shadow: F636F640RendererHitTestShadow,
  alignment: F671F675RendererPredictionAlignment,
): F681F685RendererTargetedLegacyClick {
  const expectedAliases = aliasesFor(alignment.mapping.expectedSelectedId);
  const predictedTarget = shadow.targets.find((target) => {
    const aliases = targetAliases(target);
    return target.selectable && expectedAliases.some((alias) => aliases.includes(alias));
  }) ?? null;
  const fallbackTarget = predictedTarget ?? shadow.targets.find((target) => target.id === shadow.probe.primaryCandidateId) ?? null;
  const clickPoint: F682TargetedClickPoint = fallbackTarget
    ? {
        phase: 'F682',
        x: fallbackTarget.center.x,
        y: fallbackTarget.center.y,
        source: predictedTarget ? 'predicted-target-center' : 'primary-probe-center',
        evidence: `${fallbackTarget.instructionId} @ ${fallbackTarget.center.x},${fallbackTarget.center.y}`,
      }
    : {
        phase: 'F682',
        x: null,
        y: null,
        source: 'none',
        evidence: 'Sin target seleccionable para click dirigido.',
      };
  const resolution: F681LegacyTargetResolution = {
    phase: 'F681',
    expectedId: alignment.mapping.expectedSelectedId,
    targetId: fallbackTarget?.id ?? null,
    instructionId: fallbackTarget?.instructionId ?? null,
    aliases: expectedAliases,
    found: Boolean(fallbackTarget),
  };
  const clickReady = clickPoint.x !== null && clickPoint.y !== null;
  const outcome: F683SelectionOutcomeReview = {
    phase: 'F683',
    beforeDiagnosis: alignment.diagnosis.alignment,
    expectedAfterClick: clickReady
      ? 'match-or-alias-match'
      : alignment.status === 'prediction-alignment-blocked'
        ? 'blocked'
        : 'selection-required',
    e2eReady: clickReady && shadow.status !== 'hit-test-shadow-blocked',
    evidence: clickReady
      ? 'E2E debe hacer click en el centro del target predicho y revalidar F671-F680.'
      : 'No hay punto de click confiable; mantener preview.',
  };
  const gates: F684F685TargetedClickGate[] = [
    {
      id: 'f684-target-found',
      phase: 'F684',
      label: 'Target legacy encontrado',
      pass: resolution.found,
      evidence: resolution.instructionId ?? 'Sin target.',
    },
    {
      id: 'f684-click-point-ready',
      phase: 'F684',
      label: 'Punto clicable listo',
      pass: clickReady,
      evidence: clickPoint.evidence,
    },
    {
      id: 'f685-usecanvas-owner',
      phase: 'F685',
      label: 'Owner useCanvas preservado',
      pass: true,
      evidence: 'F681-F685 solo calcula coordenada; no llama setCanvasState.',
    },
    {
      id: 'f685-no-geometry-write',
      phase: 'F685',
      label: 'Sin escritura geometrica',
      pass: true,
      evidence: 'Click dirigido se ejecuta por E2E sobre handler legacy.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = gates.slice(0, 2).some((gate) => !gate.pass);
  const status = blocked ? 'targeted-click-blocked' : alignment.status === 'prediction-alignment-ready' ? 'targeted-click-ready' : 'targeted-click-preview';
  const recommendation = blocked ? 'blocked' : alignment.status === 'prediction-alignment-ready' ? 'keep-preview' : 'click-predicted-center';

  return {
    schema: 'radshield-mx.canvas.renderer-targeted-legacy-click.f681-f685.v1',
    phaseRange: 'F681-F685',
    status,
    resolution,
    clickPoint,
    outcome,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      targetCount: shadow.targets.filter((target) => target.selectable).length,
      cacheKey: `f681-${stableHash(`${shadow.metrics.cacheKey}:${alignment.metrics.cacheKey}:${clickPoint.evidence}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'click-predicted-center'
        ? 'Repetir E2E usando el centro del target predicho para distinguir click vacio vs fallo real de seleccion.'
        : recommendation === 'blocked'
          ? 'No hay target/punto seguro para click dirigido.'
          : 'Alineacion ya lista; mantener preview y preparar smoke antes/despues.',
    },
    rollback: [
      'Si el click dirigido no asienta seleccion, revisar findObjectAtScreen y tolerancias legacy.',
      'No activar owner profundo; F681-F685 solo informa coordenadas y gates.',
      'Volver a F636-F640 si el target predicho no corresponde al objeto visible.',
    ],
  };
}
