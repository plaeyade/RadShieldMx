import type { F671F675RendererPredictionAlignment } from '@/lib/f671F675RendererPredictionAlignment';

export interface F676OwnerSmokePlan {
  phase: 'F676';
  candidateOwner: 'deep-renderer-v2';
  currentOwner: 'useCanvas';
  flagRequired: 'canvasHighRiskCad';
  dryRunOnly: boolean;
}

export interface F677OwnerSmokeSafety {
  phase: 'F677';
  alignmentReady: boolean;
  reversible: boolean;
  geometryWriteAllowed: boolean;
  evidence: string;
}

export interface F678F680OwnerSmokeGate {
  id: string;
  phase: 'F678' | 'F679' | 'F680';
  label: string;
  pass: boolean;
  evidence: string;
}

export interface F676F680RendererOwnerSmoke {
  schema: 'radshield-mx.canvas.renderer-owner-smoke.f676-f680.v1';
  phaseRange: 'F676-F680';
  status: 'owner-smoke-ready' | 'owner-smoke-preview' | 'owner-smoke-blocked';
  plan: F676OwnerSmokePlan;
  safety: F677OwnerSmokeSafety;
  gates: F678F680OwnerSmokeGate[];
  metrics: {
    passCount: number;
    gateCount: number;
    cacheKey: string;
  };
  decision: {
    recommendation: 'keep-usecanvas' | 'run-flagged-owner-smoke' | 'blocked';
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

export function buildF676F680RendererOwnerSmoke(
  alignment: F671F675RendererPredictionAlignment,
  options: { highRiskRendererEnabled?: boolean; beforeAfterSmokePassed?: boolean } = {},
): F676F680RendererOwnerSmoke {
  const plan: F676OwnerSmokePlan = {
    phase: 'F676',
    candidateOwner: 'deep-renderer-v2',
    currentOwner: 'useCanvas',
    flagRequired: 'canvasHighRiskCad',
    dryRunOnly: true,
  };
  const alignmentReady = alignment.status === 'prediction-alignment-ready';
  const safety: F677OwnerSmokeSafety = {
    phase: 'F677',
    alignmentReady,
    reversible: true,
    geometryWriteAllowed: false,
    evidence: alignmentReady
      ? 'Alineacion lista; owner smoke puede correr bajo flag y sin escritura.'
      : `Alineacion no lista: ${alignment.diagnosis.reason}`,
  };
  const gates: F678F680OwnerSmokeGate[] = [
    {
      id: 'f678-alignment-ready',
      phase: 'F678',
      label: 'Alineacion lista',
      pass: alignmentReady,
      evidence: alignment.status,
    },
    {
      id: 'f678-flag-required',
      phase: 'F678',
      label: 'Flag controlado',
      pass: options.highRiskRendererEnabled === true,
      evidence: options.highRiskRendererEnabled ? 'canvasHighRiskCad activo para smoke.' : 'Flag apagado; conservar useCanvas.',
    },
    {
      id: 'f679-no-geometry-write',
      phase: 'F679',
      label: 'Sin escritura geometrica',
      pass: safety.geometryWriteAllowed === false,
      evidence: 'Smoke solo observaria eventos y rollback.',
    },
    {
      id: 'f679-reversible',
      phase: 'F679',
      label: 'Rollback inmediato',
      pass: safety.reversible,
      evidence: 'useCanvas sigue como owner canonico.',
    },
    {
      id: 'f680-before-after-smoke',
      phase: 'F680',
      label: 'Smoke antes/despues',
      pass: options.beforeAfterSmokePassed === true,
      evidence: options.beforeAfterSmokePassed ? 'E2E antes/despues OK.' : 'Pendiente F681-F685.',
    },
  ];
  const passCount = gates.filter((gate) => gate.pass).length;
  const blocked = !alignmentReady;
  const ready = gates.every((gate) => gate.pass);
  const status = blocked ? 'owner-smoke-blocked' : ready ? 'owner-smoke-ready' : 'owner-smoke-preview';
  const recommendation = blocked ? 'blocked' : ready ? 'run-flagged-owner-smoke' : 'keep-usecanvas';

  return {
    schema: 'radshield-mx.canvas.renderer-owner-smoke.f676-f680.v1',
    phaseRange: 'F676-F680',
    status,
    plan,
    safety,
    gates,
    metrics: {
      passCount,
      gateCount: gates.length,
      cacheKey: `f676-${stableHash(`${alignment.metrics.cacheKey}:${status}:${passCount}`)}`,
    },
    decision: {
      recommendation,
      reason: recommendation === 'run-flagged-owner-smoke'
        ? 'Puede ejecutarse smoke de owner profundo bajo flag y rollback.'
        : recommendation === 'blocked'
          ? 'Bloqueado hasta que F671-F675 alinee prediccion y seleccion legacy.'
          : 'Mantener useCanvas hasta completar flag y smoke antes/despues.',
    },
    rollback: [
      'Apagar canvasHighRiskCad y volver a useCanvas.',
      'No escribir geometria ni seleccion durante owner smoke.',
      'Repetir F681-F685 antes/despues si se activa el flag.',
    ],
  };
}
