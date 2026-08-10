import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';
import { buildF646F650RendererSelectionTransaction } from '../src/lib/f646F650RendererSelectionTransaction.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f646-source',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-b',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 160, y: 110 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 16 },
      label: 'Source B',
      evidenceIds: ['ev-b'],
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
const shadow = buildF636F640RendererHitTestShadow(deep, atlas, { pointer: { x: 160, y: 110 } });
const dryRun = buildF641F645RendererEventDryRun(shadow, {
  activeTool: 'select',
  selectedId: null,
  selectedIds: [],
  snapToGrid: true,
});
const transaction = buildF646F650RendererSelectionTransaction(dryRun);
const ready = buildF646F650RendererSelectionTransaction(dryRun, { highRiskRendererEnabled: true });
const blockedDryRun = { ...dryRun, status: 'event-dry-run-blocked' };
const blocked = buildF646F650RendererSelectionTransaction(blockedDryRun);

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', transaction.schema === 'radshield-mx.canvas.renderer-selection-transaction.f646-f650.v1');
expect('phase value', transaction.phaseRange === 'F646-F650');
expect('preview status', transaction.status === 'selection-transaction-preview');
expect('ready status under high risk flag', ready.status === 'selection-transaction-ready');
expect('blocked status inherits dry-run block', blocked.status === 'selection-transaction-blocked');
expect('operation is select preview', transaction.draft.operation === 'select-preview');
expect('snapshot changed', transaction.snapshot.changed === true);
expect('after includes source instruction', transaction.snapshot.afterSelectedIds.includes('f646-source'));
expect('rollback token prefix', transaction.rollbackToken.token.startsWith('f648-rollback-'));
expect('cache key prefix', transaction.metrics.cacheKey.startsWith('f646-'));
expect('rollback warns no real selection', transaction.rollback.some((line) => line.includes('No escribir seleccion real')));

if (failures.length) {
  console.error(`F646-F650 renderer selection transaction values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F646-F650] Selection transaction values OK (${transaction.draft.operation}, changed=${transaction.snapshot.changed}).`);
