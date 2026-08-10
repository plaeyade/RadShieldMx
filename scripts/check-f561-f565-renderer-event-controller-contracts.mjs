import { readFileSync } from 'node:fs';

const failures = [];

function read(path) {
  return readFileSync(path, 'utf8');
}

function requireIncludes(label, text, tokens) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const lib = read('src/lib/f561F565RendererEventControllerV2.ts');
requireIncludes('F561-F565 lib', lib, [
  "schema: 'radshield-mx.f561-f565.renderer-event-controller-v2.v1'",
  "phaseRange: 'F561-F565'",
  'stableHandlersStillCanonical: true',
  "mutationPolicy: 'observe-route-then-stable-handler'",
  'overlayCanReceivePointerEvents: false',
  'overlayCanMutateGeometry: false',
  'screenshotRequired: true',
]);

const canvas = read('src/sections/CanvasArea.tsx');
requireIncludes('CanvasArea', canvas, [
  'buildF561F565RendererEventControllerV2',
  'handleF561MouseDown',
  'handleF561MouseMove',
  'handleF561MouseUp',
  'onMouseDown={handleF561MouseDown}',
  'onMouseMove={handleF561MouseMove}',
  'onMouseUp={handleF561MouseUp}',
  'f561-f565-renderer-event-controller',
  'f561-f565-status',
  'f561-event-harness-summary',
  'f561-f565-lane-${lane.id}',
  'f561-f565-rollback',
]);

const packageJson = read('package.json');
requireIncludes('package scripts', packageJson, [
  'test:f561-f565:event-controller',
  'test:f561-f565:event-controller:e2e',
]);

const e2e = read('e2e/f561-f565-renderer-event-controller.spec.ts');
requireIncludes('F561-F565 e2e', e2e, [
  'f561-f565-renderer-event-controller',
  'f561-event-harness-summary',
  'f515b-canvas-event-action',
  '00_renderer_event_controller_panel.png',
  '01_renderer_event_controller.png',
  '02_renderer_event_controller_pointer.png',
]);

for (const path of ['CHANGELOG.md', 'MANUAL_USUARIO_v99.md', 'MANUAL_VERSIONES_v50.md', 'public/manual_usuario.html', 'public/manual_versiones.html']) {
  const text = read(path);
  requireIncludes(path, text, ['F561-F565']);
}

if (failures.length) {
  console.error('F561-F565 renderer/event controller contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('[F561-F565] renderer/event controller contracts OK');
