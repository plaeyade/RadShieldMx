import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';
import { buildF646F650RendererSelectionTransaction } from '../src/lib/f646F650RendererSelectionTransaction.ts';
import { buildF651F655RendererActivationQa } from '../src/lib/f651F655RendererActivationQa.ts';
import { buildF656F660RendererLegacyClickProbe } from '../src/lib/f656F660RendererLegacyClickProbe.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f656-source',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-c',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 180, y: 130 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 16 },
      label: 'Source C',
      evidenceIds: ['ev-c'],
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
const shadow = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 180, y: 130 } });
const dryRun = buildF641F645RendererEventDryRun(shadow, {
  activeTool: 'select',
  selectedId: null,
  selectedIds: [],
  snapToGrid: true,
});
const transaction = buildF646F650RendererSelectionTransaction(dryRun);
const qa = buildF651F655RendererActivationQa(transaction);
const preview = buildF656F660RendererLegacyClickProbe(qa, { activeTool: 'select', selectedId: null, selectedIds: [] });
const observed = buildF656F660RendererLegacyClickProbe(qa, {
  observed: true,
  eventType: 'pointerdown-legacy',
  point: { x: 180, y: 130 },
  activeTool: 'select',
  selectedId: qa.expectation.expectedSelectedId,
  selectedIds: qa.expectation.expectedSelectedIds,
  evidenceId: 'f656-playwright-click-observed',
});
const blocked = buildF656F660RendererLegacyClickProbe(qa, {
  observed: true,
  selectedId: qa.expectation.expectedSelectedId,
  selectedIds: qa.expectation.expectedSelectedIds,
  geometryMutationObserved: true,
});

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', preview.schema === 'radshield-mx.canvas.renderer-legacy-click-probe.f656-f660.v1');
expect('phase value', preview.phaseRange === 'F656-F660');
expect('preview status', preview.status === 'legacy-click-probe-preview');
expect('preview keeps owner', preview.safety.owner === 'useCanvas');
expect('preview missing observed gate', preview.gates.some((gate) => gate.id === 'f659-legacy-click-observed' && gate.pass === false));
expect('observed status ready', observed.status === 'legacy-click-probe-ready');
expect('observed recommendation', observed.decision.recommendation === 'eligible-for-owner-flag');
expect('observed comparison match', observed.comparison.predictionMatchesObserved === true);
expect('blocked mutation', blocked.status === 'legacy-click-probe-blocked');
expect('cache key prefix', preview.metrics.cacheKey.startsWith('f656-'));

if (failures.length) {
  console.error(`F656-F660 renderer legacy click probe values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F656-F660] Legacy click probe values OK (${preview.decision.recommendation}, gates ${preview.metrics.passCount}/${preview.metrics.gateCount}; observed ${observed.metrics.passCount}/${observed.metrics.gateCount}).`);
