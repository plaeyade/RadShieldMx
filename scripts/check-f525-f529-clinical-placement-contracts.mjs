import { readFileSync } from 'node:fs';

const files = {
  lib: 'src/lib/f525F529ClinicalPlacementPack.ts',
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
  console.error(`[F525-F529] ${message}`);
  process.exit(1);
};
const expect = (content, needle, label) => {
  if (!content.includes(needle)) fail(`${label} missing ${needle}`);
};

const lib = read(files.lib);
expect(lib, 'radshield-mx.f525-f529.clinical-placement-pack.v1', files.lib);
expect(lib, "phaseRange: 'F525-F529'", files.lib);
expect(lib, "modality: 'TX'", files.lib);
expect(lib, "modality: 'NM'", files.lib);
expect(lib, "modality: 'DX'", files.lib);
expect(lib, "modality: 'CY'", files.lib);
expect(lib, 'canWriteCanvasGeometry: false', files.lib);
expect(lib, 'MedicalFloorPlan3DDialog', files.lib);

const canvas = read(files.canvas);
expect(canvas, 'buildF525F529ClinicalPlacementPack', files.canvas);
expect(canvas, 'f525-f529-clinical-placement-pack', files.canvas);
expect(canvas, 'f525-modality-', files.canvas);
expect(canvas, 'runF525PlacementHandoff', files.canvas);
expect(canvas, 'F525_PLACEMENT_MODE_KEY', files.canvas);

const update = read(files.update);
expect(update, 'F525-F529 Clinical placement pack', files.update);
expect(update, 'buildF525F529ClinicalPlacementPack', files.update);
expect(update, 'canWriteCanvasGeometry', files.update);

for (const [label, path] of Object.entries({
  changelog: files.changelog,
  userManual: files.userManual,
  versionManual: files.versionManual,
  publicUserManual: files.publicUserManual,
  publicVersionManual: files.publicVersionManual,
})) {
  const content = read(path);
  expect(content, 'F525-F529', label);
  expect(content, 'TX/NM/DX/CY', label);
}

expect(read(files.pkg), 'test:f525-f529:clinical-placement', files.pkg);
console.log('[F525-F529] clinical placement contracts OK');
