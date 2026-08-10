import { readFileSync } from 'node:fs';

const files = {
  lib: 'src/lib/f545F549GhostSourceCommit.ts',
  canvas: 'src/sections/CanvasArea.tsx',
  page: 'src/pages/ShieldingDesigner.tsx',
  update: 'src/sections/dialogs/UpdateAppDialog.tsx',
  e2e: 'e2e/f545-f549-ghost-source-commit.spec.ts',
  changelog: 'CHANGELOG.md',
  userManual: 'MANUAL_USUARIO_v99.md',
  versionManual: 'MANUAL_VERSIONES_v50.md',
  publicUserManual: 'public/manual_usuario.html',
  publicVersionManual: 'public/manual_versiones.html',
  pkg: 'package.json',
};

const read = (path) => readFileSync(path, 'utf8');
const fail = (message) => {
  console.error(`[F545-F549] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const lib = read(files.lib);
expect(lib, 'radshield-mx.f545-f549.ghost-source-commit.v1', files.lib);
expect(lib, "phaseRange: 'F545-F549'", files.lib);
expect(lib, 'canCreateRadiationSource: true', files.lib);
expect(lib, 'canWriteBarriers: false', files.lib);
expect(lib, 'canReplaceRenderer: false', files.lib);
expect(lib, 'clearsGhostAfterCommit: true', files.lib);

const canvas = read(files.canvas);
expect(canvas, 'onCommitGhostSource', files.canvas);
expect(canvas, 'commitF545GhostSource', files.canvas);
expect(canvas, 'f545-commit-ghost-source', files.canvas);
expect(canvas, 'f545-f549-ghost-source-commit-gate', files.canvas);
expect(canvas, 'setF530PlacementPoint(null)', files.canvas);
expect(canvas, 'F545 fuente creada', files.canvas);

const page = read(files.page);
expect(page, 'handleCommitGhostSource', files.page);
expect(page, 'RadiationSource', files.page);
expect(page, 'sources: [...prev.sources, nextSource]', files.page);
expect(page, 'selectedIds: [sourceId]', files.page);
expect(page, 'buildF545F549GhostSourceCommit', files.page);

const e2e = read(files.e2e);
expect(e2e, 'radshield-mx.f545-f549.ghost-source-commit-qa.v1', files.e2e);
expect(e2e, 'f545_f549_ghost_source_commit', files.e2e);
expect(e2e, 'f545-commit-ghost-source', files.e2e);
expect(e2e, 'F545 fuente creada', files.e2e);
expect(e2e, '01_source_committed_from_ghost.png', files.e2e);

const update = read(files.update);
expect(update, 'F545-F549 Ghost source commit', files.update);
expect(update, 'canCreateRadiationSource', files.update);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F545-F549', label);
  expect(content, 'fuente', label);
  expect(content, 'ghost', label);
}

const pkg = read(files.pkg);
expect(pkg, 'test:f545-f549:ghost-source-commit', files.pkg);
expect(pkg, 'test:f545-f549:ghost-source-commit:e2e', files.pkg);

console.log('[F545-F549] ghost source commit contracts OK');
