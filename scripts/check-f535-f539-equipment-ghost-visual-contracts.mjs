import { readFileSync } from 'node:fs';

const files = {
  e2e: 'e2e/f535-f539-equipment-ghost-visual.spec.ts',
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
  console.error(`[F535-F539] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const e2e = read(files.e2e);
expect(e2e, 'radshield-mx.f535-f539.equipment-ghost-visual-qa.v1', files.e2e);
expect(e2e, 'f535_f539_equipment_ghost_visual', files.e2e);
expect(e2e, 'f530-preview-equipment-ghost', files.e2e);
expect(e2e, 'canvas-context-action-f530-ghost', files.e2e);
expect(e2e, 'f531-confirm-equipment-point', files.e2e);
expect(e2e, 'pointerEvents', files.e2e);
expect(e2e, 'zoom-view', files.e2e);
expect(e2e, '01_equipment_ghost_preview.png', files.e2e);

const canvas = read(files.canvas);
expect(canvas, 'f530-equipment-ghost-overlay', files.canvas);
expect(canvas, 'pointer-events-none', files.canvas);
expect(canvas, 'Preview equipo aqui', files.canvas);
expect(canvas, 'Persistencia CAD:', files.canvas);
expect(canvas, 'f411-bim-methodology-card', files.canvas);

const update = read(files.update);
expect(update, 'F535-F539 Equipment ghost visual QA', files.update);
expect(update, 'E2E visual + screenshot', files.update);
expect(update, 'Persistencia CAD sigue bloqueada', files.update);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F535-F539', label);
  expect(content, 'E2E', label);
  expect(content, 'ghost', label);
}

const pkg = read(files.pkg);
expect(pkg, 'test:f535-f539:equipment-ghost-visual', files.pkg);
expect(pkg, 'test:f535-f539:equipment-ghost-visual:e2e', files.pkg);

console.log('[F535-F539] equipment ghost visual contracts OK');
