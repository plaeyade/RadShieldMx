import { buildF686F690RendererOwnerBeforeAfterSmoke } from '../src/lib/f686F690RendererOwnerBeforeAfterSmoke.ts';

const ownerSmokeReady = {
  schema: 'radshield-mx.canvas.renderer-owner-smoke.f676-f680.v1',
  phaseRange: 'F676-F680',
  status: 'owner-smoke-preview',
  plan: { phase: 'F676', candidateOwner: 'deep-renderer-v2', currentOwner: 'useCanvas', flagRequired: 'canvasHighRiskCad', dryRunOnly: true },
  safety: { phase: 'F677', alignmentReady: true, reversible: true, geometryWriteAllowed: false, evidence: 'ready' },
  gates: [],
  metrics: { passCount: 3, gateCount: 5, cacheKey: 'owner-ready' },
  decision: { recommendation: 'keep-usecanvas', reason: 'fixture' },
  rollback: ['Apagar canvasHighRiskCad y volver a useCanvas.'],
};

const targetedReady = {
  schema: 'radshield-mx.canvas.renderer-targeted-legacy-click.f681-f685.v1',
  phaseRange: 'F681-F685',
  status: 'targeted-click-preview',
  resolution: { phase: 'F681', expectedId: 'f442:barrier:wall-east', targetId: 'target', instructionId: 'f442:barrier:wall-east', aliases: [], found: true },
  clickPoint: { phase: 'F682', x: 600, y: 300, source: 'predicted-target-center', evidence: 'fixture' },
  outcome: { phase: 'F683', beforeDiagnosis: 'alias-match', expectedAfterClick: 'match-or-alias-match', e2eReady: true, evidence: 'fixture' },
  gates: [],
  metrics: { passCount: 4, gateCount: 4, targetCount: 1, cacheKey: 'target-ready' },
  decision: { recommendation: 'keep-preview', reason: 'fixture' },
  rollback: [],
};

const preview = buildF686F690RendererOwnerBeforeAfterSmoke(ownerSmokeReady, targetedReady, {
  highRiskRendererEnabled: false,
  beforeAfterObserved: false,
});
if (preview.status !== 'before-after-smoke-preview') throw new Error(`Expected preview, got ${preview.status}`);
if (preview.decision.recommendation !== 'run-before-after-e2e') throw new Error(`Expected run-before-after-e2e, got ${preview.decision.recommendation}`);

const ready = buildF686F690RendererOwnerBeforeAfterSmoke(ownerSmokeReady, targetedReady, {
  highRiskRendererEnabled: true,
  beforeAfterObserved: true,
});
if (ready.status !== 'before-after-smoke-ready') throw new Error(`Expected ready, got ${ready.status}`);
if (ready.decision.recommendation !== 'eligible-for-controlled-owner-smoke') throw new Error(`Expected eligible, got ${ready.decision.recommendation}`);

const blocked = buildF686F690RendererOwnerBeforeAfterSmoke(
  { ...ownerSmokeReady, safety: { ...ownerSmokeReady.safety, alignmentReady: false } },
  targetedReady,
  { highRiskRendererEnabled: false, beforeAfterObserved: false },
);
if (blocked.status !== 'before-after-smoke-blocked') throw new Error(`Expected blocked, got ${blocked.status}`);

console.log(`[F686-F690] Before/after smoke values OK (${preview.status} -> ${ready.status}; blocked=${blocked.status}).`);
