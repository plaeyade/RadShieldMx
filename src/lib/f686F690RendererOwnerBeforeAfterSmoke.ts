import type { F676F680RendererOwnerSmoke } from '@/lib/f676F680RendererOwnerSmoke';
import type { F681F685RendererTargetedLegacyClick } from '@/lib/f681F685RendererTargetedLegacyClick';

export interface F686BaselineSmoke {
  phase: 'F686';
  owner: 'useCanvas';
  targetedClickReady: boolean;
  selectionAligned: boolean;
  evidence: string;
}

export interface F687FlaggedSmoke {
  phase: 'F687';
  candidateOwner: 'deep-renderer-v2';
  flagEnabled: boolean;
  ownerSmokeStatus: F676F680RendererOwnerSmoke['status'];
  evidence: string;
}

export interface F688BeforeAfterParity {
  phase: 'F688';
  observed: boolean;
  expected: 'same-selection' | 'baseline-first' | 'blocked';
  evidence: string;
}

export interface F689F690BeforeAfterGate {
  id: string;
  phase: 'F689' | 'F690';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F686F690RendererOwnerBeforeAfterSmoke {
  schema: 'radshield-mx.canvas.renderer-owner-before-after-smoke.f686-f690.v1';
  phaseRange: 'F686-F690';
  status: 'before-after-smoke-ready' | 'before-after-smoke-preview' | 'before-after-smoke-blocked';
  baseline: F686BaselineSmoke;
  flagged: F687FlaggedSmoke;
  parity: F688BeforeAfterParity;
  gates: F689F690BeforeAfterGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'run-before-after-e2e' | 'eligible-for-controlled-owner-smoke' | 'blocked';
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

export function buildF686F690RendererOwnerBeforeAfterSmoke(
  ownerSmoke: F676F680RendererOwnerSmoke,
  targetedClick: F681F685RendererTargetedLegacyClick,
  options: { highRiskRendererEnabled?: boolean; beforeAfterObserved?: boolean } = {},
): F686F690RendererOwnerBeforeAfterSmoke {
  const selectionAligned = ownerSmoke.safety.alignmentReady;
  const baseline: F686BaselineSmoke = {
    phase: 'F686',
    owner: 'useCanvas',
    targetedClickReady: targetedClick.outcome.e2eReady,
    selectionAligned,
    evidence: selectionAligned
      ? 'Baseline useCanvas puede seleccionar el target predicho por alias/match.'
      : 'Baseline aun no confirma alineacion; repetir click dirigido.',
  };
  const flagged: F687FlaggedSmoke = {
    phase: 'F687',
    candidateOwner: 'deep-renderer-v2',
    flagEnabled: options.highRiskRendererEnabled === true,
    ownerSmokeStatus: ownerSmoke.status,
    evidence: options.highRiskRendererEnabled
      ? 'Flag canvasHighRiskCad activo para smoke controlado.'
      : 'Flag apagado; ruta flagged queda como comparacion pendiente.',
  };
  const parity: F688BeforeAfterParity = {
    phase: 'F688',
    observed: options.beforeAfterObserved === true,
    expected: !baseline.targetedClickReady
      ? 'blocked'
      : selectionAligned && flagged.flagEnabled
        ? 'same-selection'
        : 'baseline-first',
    evidence: options.beforeAfterObserved
      ? 'E2E antes/despues observado por Playwright.'
      : 'Pendiente comparar baseline sin flag contra corrida con flag.',
  };
  const gates: F689F690BeforeAfterGate[] = [
    {
      id: 'f689-baseline-ready',
      phase: 'F689',
      label: 'Baseline useCanvas listo',
      pass: baseline.targetedClickReady && baseline.selectionAligned,
      evidence: baseline.evidence,
    },
    {
      id: 'f689-flagged-path-controlled',
      phase: 'F689',
      label: 'Ruta flagged controlada',
      pass: flagged.flagEnabled || ownerSmoke.plan.dryRunOnly,
      evidence: flagged.evidence,
    },
    {
      id: 'f690-parity-observed',
      phase: 'F690',
      label: 'Paridad antes/despues',
      pass: parity.observed,
      evidence: parity.evidence,
    },
    {
      id: 'f690-no-geometry-write',
      phase: 'F690',
      label: 'Sin escritura geometrica',
      pass: ownerSmoke.safety.geometryWriteAllowed === false,
      evidence: 'Smoke compara seleccion/owner; no escribe barreras ni fuentes.',
    },
    {
      id: 'f690-rollback-ready',
      phase: 'F690',
      label: 'Rollback listo',
      pass: ownerSmoke.safety.reversible,
      evidence: ownerSmoke.rollback[0] ?? 'Rollback disponible.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = !gates[0].pass || !gates[3].pass || !gates[4].pass;
  const ready = gates.every((gate) => gate.pass);
  const status = blocked ? 'before-after-smoke-blocked' : ready ? 'before-after-smoke-ready' : 'before-after-smoke-preview';
  const recommendation = blocked
    ? 'blocked'
    : ready
      ? 'eligible-for-controlled-owner-smoke'
      : 'run-before-after-e2e';

  return {
    schema: 'radshield-mx.canvas.renderer-owner-before-after-smoke.f686-f690.v1',
    phaseRange: 'F686-F690',
    status,
    baseline,
    flagged,
    parity,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      cacheKey: `f686-${stableHash(`${ownerSmoke.metrics.cacheKey}:${targetedClick.metrics.cacheKey}:${status}:${passCount}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'eligible-for-controlled-owner-smoke'
        ? 'Baseline y ruta flagged tienen paridad observada; puede prepararse owner smoke controlado.'
        : recommendation === 'blocked'
          ? 'No continuar: baseline, geometria o rollback no son seguros.'
          : 'Ejecutar E2E antes/despues con flag apagado/encendido y comparar seleccion.',
    },
    rollback: [
      'Apagar canvasHighRiskCad y recargar; useCanvas debe seguir seleccionando el mismo target.',
      'Si la seleccion difiere, volver a F681-F685 y revisar punto clicable/aliases.',
      'No mover ownership real hasta F690 listo y E2E antes/despues documentado.',
    ],
  };
}
