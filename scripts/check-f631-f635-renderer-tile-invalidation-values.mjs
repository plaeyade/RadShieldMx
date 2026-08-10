import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f631-a',
      phase: 'F442',
      primitive: 'polygon',
      entityId: 'barrier-a',
      layer: 'shielding-primary',
      zIndex: 10,
      points: [{ x: 20, y: 20 }, { x: 260, y: 20 }, { x: 260, y: 90 }],
      style: { stroke: '#22c55e', fill: '#22c55e', opacity: 0.5, lineWidth: 4 },
      label: 'Barrier A',
      evidenceIds: ['ev-a'],
      warnings: [],
    },
    {
      id: 'f631-b',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-b',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 300, y: 180 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 3 },
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
const ready = buildF631F635RendererTileInvalidation(deep, scheduler, { width: 640, height: 480, tileSize: 160, highRiskRendererEnabled: true });
const blockedScheduler = { ...scheduler, status: 'renderer-scheduler-blocked' };
const blocked = buildF631F635RendererTileInvalidation(deep, blockedScheduler, { width: 640, height: 480, tileSize: 160 });

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', atlas.schema === 'radshield-mx.canvas.renderer-tile-invalidation.f631-f635.v1');
expect('phase value', atlas.phaseRange === 'F631-F635');
expect('preview status', atlas.status === 'tile-invalidation-preview');
expect('ready status under high risk flag', ready.status === 'tile-invalidation-ready');
expect('blocked status inherits scheduler block', blocked.status === 'tile-invalidation-blocked');
expect('tile grid dimensions', atlas.metrics.cols === 4 && atlas.metrics.rows === 3);
expect('dirty tiles present', atlas.metrics.dirtyTiles > 0 && atlas.metrics.dirtyTiles <= atlas.metrics.totalTiles);
expect('coverage for primary', atlas.coverage.some((item) => item.layer === 'shielding-primary' && item.dirtyTileCount > 0));
expect('cache key prefix', atlas.metrics.cacheKey.startsWith('f631-'));
expect('gates pass in preview', atlas.gates.every((gate) => gate.pass));
expect('rollback blocks events', atlas.rollback.some((line) => line.includes('eventos')));

if (failures.length) {
  console.error(`F631-F635 renderer tile invalidation values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F631-F635] Tile invalidation values OK (${atlas.metrics.dirtyTiles}/${atlas.metrics.totalTiles} dirty tiles).`);
