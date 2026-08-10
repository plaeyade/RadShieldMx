import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f641-source',
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
const ready = buildF641F645RendererEventDryRun(shadow, {
  activeTool: 'select',
  selectedId: 'f641-source',
  selectedIds: ['f641-source'],
  snapToGrid: false,
  highRiskRendererEnabled: true,
});
const blockedShadow = { ...shadow, status: 'hit-test-shadow-blocked' };
const blocked = buildF641F645RendererEventDryRun(blockedShadow, { activeTool: 'select' });

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', dryRun.schema === 'radshield-mx.canvas.renderer-event-dry-run.f641-f645.v1');
expect('phase value', dryRun.phaseRange === 'F641-F645');
expect('preview status', dryRun.status === 'event-dry-run-preview');
expect('ready status under high risk flag', ready.status === 'event-dry-run-ready');
expect('blocked status inherits shadow block', blocked.status === 'event-dry-run-blocked');
expect('legacy owner', dryRun.legacy.pointerEventsOwner === 'useCanvas');
expect('intent derived', dryRun.intent.eventType === 'pointerdown-preview' && dryRun.intent.action === 'select-candidate');
expect('candidate present', dryRun.comparison.candidatePresent === true);
expect('selected count metric', dryRun.metrics.selectedCount === 0);
expect('cache key prefix', dryRun.metrics.cacheKey.startsWith('f641-'));
expect('rollback preserves useCanvas', dryRun.rollback.some((line) => line.includes('useCanvas')));

if (failures.length) {
  console.error(`F641-F645 renderer event dry-run values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F641-F645] Event dry-run values OK (${dryRun.intent.action}, ${dryRun.metrics.candidateCount} candidates).`);
