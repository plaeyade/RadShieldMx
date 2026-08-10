import { readFileSync } from 'node:fs';

const files = {
  lib: 'src/lib/f540F544GhostDragGate.ts',
  previewLib: 'src/lib/f530F534EquipmentPlacementPreview.ts',
  canvas: 'src/sections/CanvasArea.tsx',
  e2e: 'e2e/f540-f544-ghost-drag.spec.ts',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  changelog: 'CHANGELOG.md',
  userManual: 'MANUAL_USUARIO_v99.md',
  versionManual: 'MANUAL_VERSIONES_v50.md',
  publicUserManual: 'public/manual_usuario.html',
  publicVersionManual: 'public/manual_versiones.html',
  pkg: 'package.json',
};

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`[F540-F544] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const lib = read(files.lib);
expect(lib, 'radshield-mx.f540-f544.ghost-drag-gate.v1', files.lib);
expect(lib, "phaseRange: 'F540-F544'", files.lib);
expect(lib, 'canDragPreview: true', files.lib);
expect(lib, 'canPersistGeometry: false', files.lib);
expect(lib, 'overlay-pass-through-handle-active', files.lib);
expect(lib, 'F544', files.lib);

const previewLib = read(files.previewLib);
expect(previewLib, "'drag'", files.previewLib);

const canvas = read(files.canvas);
expect(canvas, 'buildF540F544GhostDragGate', files.canvas);
expect(canvas, 'f540DragStartRef', files.canvas);
expect(canvas, 'startF540GhostDrag', files.canvas);
expect(canvas, 'moveF540GhostDrag', files.canvas);
expect(canvas, 'endF540GhostDrag', files.canvas);
expect(canvas, 'f540-equipment-ghost-drag-handle', files.canvas);
expect(canvas, 'f540-f544-ghost-drag-gate', files.canvas);
expect(canvas, 'data-f540-can-persist="false"', files.canvas);
expect(canvas, "source: 'drag'", files.canvas);
expect(canvas, 'pointer-events-none absolute z-10', files.canvas);
expect(canvas, 'pointer-events-auto absolute inset-0', files.canvas);

const e2e = read(files.e2e);
expect(e2e, 'radshield-mx.f540-f544.ghost-drag-qa.v1', files.e2e);
expect(e2e, 'f540_f544_ghost_drag', files.e2e);
expect(e2e, 'f540-equipment-ghost-drag-handle', files.e2e);
expect(e2e, 'F541 drag end', files.e2e);
expect(e2e, '01_ghost_dragged.png', files.e2e);

const update = read(files.update);
expect(update, 'F540-F544 Ghost drag gate', files.update);
expect(update, 'canPersistGeometry', files.update);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F540-F544', label);
  expect(content, 'drag', label);
  expect(content, 'ghost', label);
}

const pkg = read(files.pkg);
expect(pkg, 'test:f540-f544:ghost-drag', files.pkg);
expect(pkg, 'test:f540-f544:ghost-drag:e2e', files.pkg);

console.log('[F540-F544] ghost drag contracts OK');
