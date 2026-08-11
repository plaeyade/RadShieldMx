import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';
import { buildF646F650RendererSelectionTransaction } from '../src/lib/f646F650RendererSelectionTransaction.ts';
import { buildF651F655RendererActivationQa } from '../src/lib/f651F655RendererActivationQa.ts';
import { buildF656F660RendererLegacyClickProbe } from '../src/lib/f656F660RendererLegacyClickProbe.ts';
import { buildF661F665RendererObservedClickBridge } from '../src/lib/f661F665RendererObservedClickBridge.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f661-source',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-d',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 200, y: 150 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 16 },
      label: 'Source D',
      evidenceIds: ['ev-d'],
      warnings: [],
    },
  ],
  passes: [],
  gates: [],
  rollbackPlan: [],
  drawHelper: 'drawF442ToF445RendererV2Overlay',
  eventControllerTouched: false,
  releaseDecision: 'preview',
};

const deep = buildF621F625RendererBaseDeep(runtime, { width: 640, height: 480, scale: 1, offsetX: 0, offsetY: 0 });
const scheduler = buildF626F630RendererBaseScheduler(deep, { maxCommandsPerFrame: 4 });
const atlas = buildF631F635RendererTileInvalidation(deep, scheduler, { width: 640, height: 480, tileSize: 160 });
const shadow = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 200, y: 150 } });
const dryRun = buildF641F645RendererEventDryRun(shadow, {
  activeTool: 'select',
  selectedId: null,
  selectedIds: [],
  snapToGrid: true,
});
const transaction = buildF646F650RendererSelectionTransaction(dryRun);
const qa = buildF651F655RendererActivationQa(transaction);
const pendingProbe = buildF656F660RendererLegacyClickProbe(qa);
const pending = buildF661F665RendererObservedClickBridge(pendingProbe);
const partialProbe = buildF656F660RendererLegacyClickProbe(qa, {
  observed: true,
  point: { x: 200, y: 150 },
  activeTool: 'select',
  selectedId: null,
  selectedIds: [],
  evidenceId: 'f661-click-observed-no-selection',
});
const partial = buildF661F665RendererObservedClickBridge(partialProbe, {
  observed: true,
  point: { x: 200, y: 150 },
  activeTool: 'select',
  selectedId: null,
  selectedIds: [],
  evidenceId: 'f661-click-observed-no-selection',
});
const readyProbe = buildF656F660RendererLegacyClickProbe(qa, {
  observed: true,
  point: { x: 200, y: 150 },
  activeTool: 'select',
  selectedId: qa.expectation.expectedSelectedId,
  selectedIds: qa.expectation.expectedSelectedIds,
  evidenceId: 'f661-click-observed-match',
});
const ready = buildF661F665RendererObservedClickBridge(readyProbe, {
  observed: true,
  point: { x: 200, y: 150 },
  activeTool: 'select',
  selectedId: qa.expectation.expectedSelectedId,
  selectedIds: qa.expectation.expectedSelectedIds,
  evidenceId: 'f661-click-observed-match',
});
const blocked = buildF661F665RendererObservedClickBridge(readyProbe, {
  observed: true,
  selectedId: qa.expectation.expectedSelectedId,
  selectedIds: qa.expectation.expectedSelectedIds,
  geometryMutationObserved: true,
});

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', pending.schema === 'radshield-mx.canvas.renderer-observed-click-bridge.f661-f665.v1');
expect('phase value', pending.phaseRange === 'F661-F665');
expect('pending partial status', pending.status === 'observed-click-bridge-partial');
expect('pending recommendation keep preview', pending.decision.recommendation === 'keep-preview');
expect('partial click captured', partial.gates.some((gate) => gate.id === 'f664-click-receipt' && gate.pass === true));
expect('partial still preview', partial.decision.recommendation === 'keep-preview');
expect('ready status', ready.status === 'observed-click-bridge-ready');
expect('ready recommendation', ready.decision.recommendation === 'eligible-for-controlled-owner-test');
expect('blocked mutation', blocked.status === 'observed-click-bridge-blocked');
expect('owner preserved', ready.mutationGuard.owner === 'useCanvas');
expect('cache key prefix', pending.metrics.cacheKey.startsWith('f661-'));

if (failures.length) {
  console.error(`F661-F665 renderer observed click bridge values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F661-F665] Observed click bridge values OK (pending ${pending.metrics.passCount}/${pending.metrics.gateCount}; partial ${partial.metrics.passCount}/${partial.metrics.gateCount}; ready ${ready.metrics.passCount}/${ready.metrics.gateCount}).`);
