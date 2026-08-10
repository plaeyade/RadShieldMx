import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f626-primary',
      phase: 'F442',
      primitive: 'polygon',
      entityId: 'barrier-1',
      layer: 'shielding-primary',
      zIndex: 10,
      points: [{ x: 10, y: 10 }, { x: 180, y: 10 }, { x: 180, y: 60 }],
      style: { stroke: '#22c55e', fill: '#22c55e', opacity: 0.5, lineWidth: 5 },
      label: 'Primary',
      evidenceIds: ['ev-primary'],
      warnings: [],
    },
    {
      id: 'f626-warning',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-1',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 90, y: 90 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 3 },
      label: 'Source',
      evidenceIds: ['ev-source'],
      warnings: ['review source term'],
    },
    {
      id: 'f626-offscreen',
      phase: 'F442',
      primitive: 'polyline',
      entityId: 'region-1',
      layer: 'occupancy-zones',
      zIndex: 30,
      points: [{ x: 900, y: 900 }, { x: 950, y: 950 }],
      style: { stroke: '#38bdf8', fill: '#38bdf8', opacity: 0.2, lineWidth: 2 },
      label: 'Offscreen region',
      evidenceIds: ['ev-region'],
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

const deep = buildF621F625RendererBaseDeep(runtime, { width: 400, height: 300, scale: 1, offsetX: 0, offsetY: 0 });
const scheduler = buildF626F630RendererBaseScheduler(deep, { targetFps: 60, maxCommandsPerFrame: 1 });
const ready = buildF626F630RendererBaseScheduler(deep, { targetFps: 60, maxCommandsPerFrame: 8, highRiskRendererEnabled: true });
const blockedDeep = buildF621F625RendererBaseDeep({ ...runtime, status: 'renderer-v2-runtime-blocked' }, { width: 400, height: 300, scale: 1, offsetX: 0, offsetY: 0 });
const blocked = buildF626F630RendererBaseScheduler(blockedDeep);

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', scheduler.schema === 'radshield-mx.canvas.renderer-base-scheduler.f626-f630.v1');
expect('phase value', scheduler.phaseRange === 'F626-F630');
expect('preview status', scheduler.status === 'renderer-scheduler-preview');
expect('ready status under high risk flag', ready.status === 'renderer-scheduler-ready');
expect('blocked status inherits deep block', blocked.status === 'renderer-scheduler-blocked');
expect('queue has groups', scheduler.queue.length >= 3);
expect('warning review first or high priority', scheduler.queue.some((item) => item.reason === 'warning-review' && item.priority >= 30));
expect('multi frame with max 1 command', scheduler.telemetry.estimatedFrames >= 3);
expect('cache key prefix', scheduler.invalidation.cacheKey.startsWith('f626-'));
expect('invalidates on geometry/material', scheduler.invalidation.invalidatesOn.includes('barriers') && scheduler.invalidation.invalidatesOn.includes('material-overlay'));
expect('estimated frame budget safe', scheduler.telemetry.estimatedFrameMs <= scheduler.budget.maxFrameMs);
expect('rollback mentions useCanvas', scheduler.rollback.some((line) => line.includes('useCanvas')));

if (failures.length) {
  console.error(`F626-F630 renderer scheduler values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F626-F630] Renderer scheduler values OK (${scheduler.queue.length} queue items, ${scheduler.telemetry.estimatedFrames} frames).`);
