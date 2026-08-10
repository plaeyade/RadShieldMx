import { readFileSync } from 'node:fs';

const files = {
  lib: 'src/lib/f550F555FunctionalBetaClosure.ts',
  canvas: 'src/sections/CanvasArea.tsx',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  e2e: 'e2e/f550-f555-functional-beta-closure.spec.ts',
  changelog: 'CHANGELOG.md',
  userManual: 'MANUAL_USUARIO_v99.md',
  versionManual: 'MANUAL_VERSIONES_v50.md',
  publicUserManual: 'public/manual_usuario.html',
  publicVersionManual: 'public/manual_versiones.html',
  pkg: 'package.json',
};

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`[F550-F555] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const lib = read(files.lib);
expect(lib, 'radshield-mx.f550-f555.functional-beta-closure.v1', files.lib);
expect(lib, "phaseRange: 'F550-F555'", files.lib);
expect(lib, 'canvasBaseReplacementAllowed: false', files.lib);
expect(lib, 'unityClinicalCalculationAllowed: false', files.lib);
expect(lib, 'allVisualEnginesMustFallbackToThree: true', files.lib);
expect(lib, 'Workspace BIM', files.lib);
expect(lib, 'Project Manager', files.lib);
expect(lib, 'Heat alto', files.lib);
expect(lib, 'Concreto HD', files.lib);

const canvas = read(files.canvas);
expect(canvas, 'buildF550F555FunctionalBetaClosure', files.canvas);
expect(canvas, 'f550-f555-functional-beta-closure', files.canvas);
expect(canvas, 'f551-bim-complete-palette', files.canvas);
expect(canvas, 'f550-f555-track-${track.id}', files.canvas);
expect(canvas, 'f550-f555-rollback-policy', files.canvas);

const update = read(files.update);
expect(update, 'F550-F555 Functional beta closure', files.update);
expect(update, 'fallback Three', files.update);

const e2e = read(files.e2e);
expect(e2e, 'f550_f555_beta_functional_closure', files.e2e);
expect(e2e, '01_canvas_bim_palette.png', files.e2e);
expect(e2e, '02_ghost_source_commit.png', files.e2e);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F550-F555', label);
  if (!content.toLowerCase().includes('paleta bim')) fail(`${label} missing paleta BIM`);
  expect(content, 'Unity', label);
}

const pkg = read(files.pkg);
expect(pkg, 'test:f550-f555:functional-beta', files.pkg);
expect(pkg, 'test:f550-f555:functional-beta:e2e', files.pkg);

console.log('[F550-F555] functional beta closure contracts OK');
