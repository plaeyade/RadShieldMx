import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f636-barrier',
      phase: 'F442',
      primitive: 'polygon',
      entityId: 'barrier-a',
      layer: 'shielding-primary',
      zIndex: 10,
      points: [{ x: 80, y: 80 }, { x: 220, y: 80 }, { x: 220, y: 140 }, { x: 80, y: 140 }],
      style: { stroke: '#22c55e', fill: '#22c55e', opacity: 0.5, lineWidth: 4 },
      label: 'Barrier A',
      evidenceIds: ['ev-a'],
      warnings: [],
    },
    {
      id: 'f636-source',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-b',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 160, y: 110 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 16 },
      label: 'Source B',
      evidenceIds: ['ev-b'],
      warnings: ['review'],
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
const shadow = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 160, y: 110 } });
const ready = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 160, y: 110 }, highRiskRendererEnabled: true });
const blockedAtlas = { ...atlas, status: 'tile-invalidation-blocked' };
const blocked = buildF636F640RendererHitTestShadow(deep, blockedAtlas, { pointer: { x: 160, y: 110 } });

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', shadow.schema === 'radshield-mx.canvas.renderer-hit-test-shadow.f636-f640.v1');
expect('phase value', shadow.phaseRange === 'F636-F640');
expect('preview status', shadow.status === 'hit-test-shadow-preview');
expect('ready status under high risk flag', ready.status === 'hit-test-shadow-ready');
expect('blocked status inherits atlas block', blocked.status === 'hit-test-shadow-blocked');
expect('selectable targets', shadow.metrics.selectableTargets >= 2);
expect('occupied buckets', shadow.metrics.occupiedBuckets > 0);
expect('probe has tile', typeof shadow.probe.tileId === 'string' && shadow.probe.tileId.startsWith('f631-tile-'));
expect('probe has primary candidate', typeof shadow.probe.primaryCandidateId === 'string' && shadow.probe.primaryCandidateId.includes('f636-source'));
expect('cache key prefix', shadow.metrics.cacheKey.startsWith('f636-'));
expect('rollback preserves useCanvas', shadow.rollback.some((line) => line.includes('useCanvas')));

if (failures.length) {
  console.error(`F636-F640 renderer hit-test shadow values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F636-F640] Hit-test shadow values OK (${shadow.metrics.selectableTargets} targets, ${shadow.metrics.occupiedBuckets} occupied buckets).`);
