import { buildF681F685RendererTargetedLegacyClick } from '../src/lib/f681F685RendererTargetedLegacyClick.ts';

const shadow = {
  schema: 'radshield-mx.canvas.renderer-hit-test-shadow.f636-f640.v1',
  phaseRange: 'F636-F640',
  status: 'hit-test-shadow-preview',
  targets: [
    {
      id: 'f636-target-f442-barrier-wall-east',
      phase: 'F636',
      commandId: 'f442:barrier:wall-east',
      instructionId: 'f442:barrier:wall-east',
      layer: 'barriers',
      primitive: 'line',
      zIndex: 10,
      bounds: { x: 90, y: 110, width: 34, height: 180 },
      center: { x: 107, y: 200 },
      tileIds: ['tile-1'],
      selectable: true,
      reason: 'fixture',
    },
  ],
  buckets: [],
  probe: {
    phase: 'F638',
    point: { x: 107, y: 200 },
    tileId: 'tile-1',
    candidateIds: ['f636-target-f442-barrier-wall-east'],
    primaryCandidateId: 'f636-target-f442-barrier-wall-east',
    reversibleAction: 'preview-only',
  },
  gates: [],
  metrics: { selectableTargets: 1, bucketCount: 1, occupiedBuckets: 1, maxTargetsPerBucket: 1, cacheKey: 'shadow-fixture' },
  rollback: [],
};

const alignment = {
  schema: 'radshield-mx.canvas.renderer-prediction-alignment.f671-f675.v1',
  phaseRange: 'F671-F675',
  status: 'prediction-alignment-review',
  mapping: {
    phase: 'F671',
    expectedSelectedId: 'f442:barrier:wall-east',
    settledSelectedId: null,
    expectedAliases: ['f442:barrier:wall-east', 'barrier:wall-east', 'wall-east'],
    settledAliases: [],
  },
  diagnosis: {
    phase: 'F672',
    alignment: 'missing-selection',
    canTrustPrediction: false,
    reason: 'fixture',
  },
  gates: [],
  metrics: { passCount: 2, gateCount: 4, aliasCount: 3, cacheKey: 'alignment-fixture' },
  decision: { recommendation: 'keep-preview', reason: 'fixture' },
  rollback: [],
};

const result = buildF681F685RendererTargetedLegacyClick(shadow, alignment);
if (result.status !== 'targeted-click-preview') throw new Error(`Expected preview, got ${result.status}`);
if (result.decision.recommendation !== 'click-predicted-center') throw new Error(`Expected click-predicted-center, got ${result.decision.recommendation}`);
if (result.clickPoint.x !== 107 || result.clickPoint.y !== 200) throw new Error(`Unexpected point ${result.clickPoint.x},${result.clickPoint.y}`);
if (!result.resolution.found) throw new Error('Expected target resolution.');
if (result.metrics.passCount !== 4) throw new Error(`Expected all gates pass, got ${result.metrics.passCount}`);

const blocked = buildF681F685RendererTargetedLegacyClick({ ...shadow, targets: [], metrics: { ...shadow.metrics, selectableTargets: 0 } }, alignment);
if (blocked.status !== 'targeted-click-blocked') throw new Error(`Expected blocked, got ${blocked.status}`);

console.log(`[F681-F685] Targeted legacy click values OK (${result.clickPoint.x},${result.clickPoint.y}; ${result.decision.recommendation}).`);
