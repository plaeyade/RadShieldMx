import { readFileSync } from 'node:fs';

const files = {
  lib: 'src/lib/f530F534EquipmentPlacementPreview.ts',
  canvas: 'src/sections/CanvasArea.tsx',
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
  console.error(`[F530-F534] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const lib = read(files.lib);
expect(lib, 'radshield-mx.f530-f534.equipment-placement-preview.v1', files.lib);
expect(lib, "phaseRange: 'F530-F534'", files.lib);
expect(lib, 'canPersistGeometry: false', files.lib);
expect(lib, 'Preview fantasma', files.lib);
expect(lib, 'Confirmar punto', files.lib);
expect(lib, 'Handoff memoria/3D', files.lib);

const canvas = read(files.canvas);
expect(canvas, 'buildF530F534EquipmentPlacementPreview', files.canvas);
expect(canvas, 'f530-f534-equipment-placement-preview', files.canvas);
expect(canvas, 'f530-equipment-ghost-overlay', files.canvas);
expect(canvas, 'f530-preview-equipment-ghost', files.canvas);
expect(canvas, 'f531-confirm-equipment-point', files.canvas);
expect(canvas, 'canvas-context-action-f530-ghost', files.canvas);

const update = read(files.update);
expect(update, 'F530-F534 Equipment ghost placement', files.update);
expect(update, 'buildF530F534EquipmentPlacementPreview', files.update);
expect(update, 'canPersistGeometry', files.update);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F530-F534', label);
  expect(content, 'ghost', label);
}

expect(read(files.pkg), 'test:f530-f534:equipment-placement-preview', files.pkg);
console.log('[F530-F534] equipment placement preview contracts OK');
