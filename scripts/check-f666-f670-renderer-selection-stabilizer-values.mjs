import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';
import { buildF646F650RendererSelectionTransaction } from '../src/lib/f646F650RendererSelectionTransaction.ts';
import { buildF651F655RendererActivationQa } from '../src/lib/f651F655RendererActivationQa.ts';
import { buildF656F660RendererLegacyClickProbe } from '../src/lib/f656F660RendererLegacyClickProbe.ts';
import { buildF661F665RendererObservedClickBridge } from '../src/lib/f661F665RendererObservedClickBridge.ts';
import { buildF666F670RendererSelectionStabilizer } from '../src/lib/f666F670RendererSelectionStabilizer.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [{
    id: 'f666-source',
    phase: 'F442',
    primitive: 'circle',
    entityId: 'source-e',
    layer: 'clinical-equipment',
    zIndex: 20,
    points: [{ x: 220, y: 170 }],
    style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 16 },
    label: 'Source E',
    evidenceIds: ['ev-e'],
    warnings: [],
  }],
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
const shadow = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 220, y: 170 } });
const dryRun = buildF641F645RendererEventDryRun(shadow, { activeTool: 'select', selectedId: null, selectedIds: [], snapToGrid: true });
const transaction = buildF646F650RendererSelectionTransaction(dryRun);
const qa = buildF651F655RendererActivationQa(transaction);
const expectedId = qa.expectation.expectedSelectedId;
const expectedIds = qa.expectation.expectedSelectedIds;
const pendingProbe = buildF656F660RendererLegacyClickProbe(qa);
const pendingBridge = buildF661F665RendererObservedClickBridge(pendingProbe);
const pending = buildF666F670RendererSelectionStabilizer(pendingBridge, { expectedSelectedId: expectedId, expectedSelectedIds: expectedIds });
const partialProbe = buildF656F660RendererLegacyClickProbe(qa, { observed: true, selectedId: null, selectedIds: [], evidenceId: 'f666-click' });
const partialBridge = buildF661F665RendererObservedClickBridge(partialProbe, { observed: true, selectedId: null, selectedIds: [], evidenceId: 'f666-click' });
const partial = buildF666F670RendererSelectionStabilizer(partialBridge, {
  sampled: true,
  selectedId: null,
  selectedIds: [],
  expectedSelectedId: expectedId,
  expectedSelectedIds: expectedIds,
  evidenceId: 'f666-sample-empty',
});
const readyProbe = buildF656F660RendererLegacyClickProbe(qa, { observed: true, selectedId: expectedId, selectedIds: expectedIds, evidenceId: 'f666-click-match' });
const readyBridge = buildF661F665RendererObservedClickBridge(readyProbe, { observed: true, selectedId: expectedId, selectedIds: expectedIds, evidenceId: 'f666-click-match' });
const ready = buildF666F670RendererSelectionStabilizer(readyBridge, {
  sampled: true,
  selectedId: expectedId,
  selectedIds: expectedIds,
  expectedSelectedId: expectedId,
  expectedSelectedIds: expectedIds,
  evidenceId: 'f666-sample-match',
});
const blocked = buildF666F670RendererSelectionStabilizer(readyBridge, {
  sampled: true,
  selectedId: expectedId,
  selectedIds: expectedIds,
  expectedSelectedId: expectedId,
  expectedSelectedIds: expectedIds,
  geometryMutationObserved: true,
});

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', pending.schema === 'radshield-mx.canvas.renderer-selection-stabilizer.f666-f670.v1');
expect('phase value', pending.phaseRange === 'F666-F670');
expect('pending preview', pending.status === 'selection-stabilizer-preview');
expect('partial sampled gate', partial.gates.some((gate) => gate.id === 'f669-deferred-sample' && gate.pass === true));
expect('partial keep preview', partial.decision.recommendation === 'keep-preview');
expect('ready status', ready.status === 'selection-stabilizer-ready');
expect('ready recommendation', ready.decision.recommendation === 'eligible-for-owner-smoke');
expect('blocked mutation', blocked.status === 'selection-stabilizer-blocked');
expect('cache key prefix', pending.metrics.cacheKey.startsWith('f666-'));

if (failures.length) {
  console.error(`F666-F670 renderer selection stabilizer values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F666-F670] Selection stabilizer values OK (pending ${pending.metrics.passCount}/${pending.metrics.gateCount}; partial ${partial.metrics.passCount}/${partial.metrics.gateCount}; ready ${ready.metrics.passCount}/${ready.metrics.gateCount}).`);
