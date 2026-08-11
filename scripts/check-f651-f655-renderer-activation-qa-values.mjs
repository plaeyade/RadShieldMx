import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';
import { buildF626F630RendererBaseScheduler } from '../src/lib/f626F630RendererBaseScheduler.ts';
import { buildF631F635RendererTileInvalidation } from '../src/lib/f631F635RendererTileInvalidation.ts';
import { buildF636F640RendererHitTestShadow } from '../src/lib/f636F640RendererHitTestShadow.ts';
import { buildF641F645RendererEventDryRun } from '../src/lib/f641F645RendererEventDryRun.ts';
import { buildF646F650RendererSelectionTransaction } from '../src/lib/f646F650RendererSelectionTransaction.ts';
import { buildF651F655RendererActivationQa } from '../src/lib/f651F655RendererActivationQa.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f651-source',
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
const qa = buildF651F655RendererActivationQa(transaction);
const ready = buildF651F655RendererActivationQa(transaction, { highRiskRendererEnabled: true, legacyE2eObserved: true });
const blockedTransaction = { ...transaction, status: 'selection-transaction-blocked' };
const blocked = buildF651F655RendererActivationQa(blockedTransaction);

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', qa.schema === 'radshield-mx.canvas.renderer-activation-qa.f651-f655.v1');
expect('phase value', qa.phaseRange === 'F651-F655');
expect('preview status', qa.status === 'activation-qa-preview');
expect('ready with legacy e2e and flag', ready.status === 'activation-qa-ready');
expect('blocked status inherits transaction block', blocked.status === 'activation-qa-blocked');
expect('recommendation keep preview', qa.decision.recommendation === 'keep-preview');
expect('ready recommendation flagged e2e', ready.decision.recommendation === 'eligible-for-flagged-e2e');
expect('selection consistent', qa.comparison.selectionMatches === true);
expect('rollback consistent', qa.comparison.rollbackMatches === true);
expect('legacy e2e gate missing', qa.gates.some((gate) => gate.id === 'f655-legacy-e2e-required' && gate.pass === false));
expect('cache key prefix', qa.metrics.cacheKey.startsWith('f651-'));

if (failures.length) {
  console.error(`F651-F655 renderer activation QA values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F651-F655] Activation QA values OK (${qa.decision.recommendation}, gates ${qa.metrics.passCount}/${qa.metrics.gateCount}).`);
