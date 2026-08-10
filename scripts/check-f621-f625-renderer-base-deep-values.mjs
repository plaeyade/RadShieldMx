import { buildF621F625RendererBaseDeep } from '../src/lib/f621F625RendererBaseDeep.ts';

const runtime = {
  schema: 'radshield-mx.f442-f445.renderer-v2-runtime.v1',
  phaseRange: 'F442-F445',
  status: 'renderer-v2-runtime-preview',
  activationMode: 'preview-only',
  instructions: [
    {
      id: 'f621-test-primary-barrier',
      phase: 'F442',
      primitive: 'polyline',
      entityId: 'barrier-1',
      layer: 'shielding-primary',
      zIndex: 10,
      points: [{ x: 10, y: 10 }, { x: 160, y: 10 }],
      style: { stroke: '#22c55e', fill: '#22c55e', opacity: 0.5, lineWidth: 4 },
      label: 'Primary barrier',
      evidenceIds: ['ev-primary'],
      warnings: [],
    },
    {
      id: 'f621-test-offscreen-source',
      phase: 'F442',
      primitive: 'circle',
      entityId: 'source-1',
      layer: 'clinical-equipment',
      zIndex: 20,
      points: [{ x: 1000, y: 1000 }],
      style: { stroke: '#ef4444', fill: '#ef4444', opacity: 0.35, lineWidth: 3 },
      label: 'Offscreen source',
      evidenceIds: ['ev-source'],
      warnings: ['outside viewport'],
    },
  ],
  passes: [],
  gates: [],
  rollbackPlan: [],
  drawHelper: 'drawF442ToF445RendererV2Overlay',
  eventControllerTouched: false,
  releaseDecision: 'preview',
};

const activeRuntime = { ...runtime, activationMode: 'flagged-active' };
const blockedRuntime = { ...runtime, status: 'renderer-v2-runtime-blocked', eventControllerTouched: true };

const summary = buildF621F625RendererBaseDeep(runtime, { width: 400, height: 300, scale: 1, offsetX: 0, offsetY: 0 });
const active = buildF621F625RendererBaseDeep(activeRuntime, { width: 400, height: 300, scale: 1, offsetX: 0, offsetY: 0 });
const blocked = buildF621F625RendererBaseDeep(blockedRuntime, { width: 400, height: 300, scale: 1, offsetX: 0, offsetY: 0 });

const failures = [];
const expect = (label, condition) => {
  if (!condition) failures.push(label);
};

expect('schema value', summary.schema === 'radshield-mx.canvas.renderer-base-deep.f621-f625.v1');
expect('phase value', summary.phaseRange === 'F621-F625');
expect('preview status', summary.status === 'renderer-base-deep-preview');
expect('ready status when flagged', active.status === 'renderer-base-deep-ready');
expect('blocked status when runtime/events fail', blocked.status === 'renderer-base-deep-blocked');
expect('command count', summary.commands.length === runtime.instructions.length);
expect('one visible command', summary.metrics.visibleCommands === 1);
expect('one hidden command', summary.metrics.hiddenCommands === 1);
expect('pass groups created', summary.passGroups.length >= 2);
expect('dirty bounds only for visible primary', summary.passGroups.some((group) => group.layer === 'shielding-primary' && group.dirtyBounds));
expect('warning count propagated', summary.metrics.warningCommands === 1);
expect('all preview gates pass', summary.gates.every((gate) => gate.pass));
expect('blocked runtime gate fails', blocked.gates.some((gate) => !gate.pass));
expect('rollback names legacy canvas', summary.rollback.some((line) => line.includes('useCanvas')));

if (failures.length) {
  console.error(`F621-F625 renderer base deep values failed:\n${failures.join('\n')}`);
  process.exit(1);
}

console.log(`[F621-F625] Renderer base deep values OK (${summary.metrics.visibleCommands}/${summary.metrics.totalCommands} visible).`);
