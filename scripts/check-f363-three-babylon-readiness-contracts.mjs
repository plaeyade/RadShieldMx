import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const dialog = read('src/sections/dialogs/MedicalFloorPlan3DDialog.tsx');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');
const changelog = read('CHANGELOG.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const manual = read('MANUAL_USUARIO_v99.md');
const pkg = JSON.parse(read('package.json'));

const failures = [];
const expect = (label, ok) => {
  if (!ok) failures.push(label);
};

expect(
  'Three realism aids present',
  ['MaterialBands', 'EquipmentFootprints', 'BeamGuides', 'RoomRulers', 'f363-three-r3f-realism-aids'].every((token) =>
    dialog.includes(token),
  ),
);
expect(
  'Three overlays expose test ids',
  [
    'f363-three-material-bands',
    'f363-three-equipment-footprints',
    'f363-three-beam-guides',
    'f363-three-room-rulers',
  ].every((token) => dialog.includes(token)),
);
expect(
  'Review JSON exports Three and Babylon readiness',
  dialog.includes('threeR3fInspection') &&
    dialog.includes('babylonReadiness') &&
    dialog.includes('buildBabylonAdapterContract'),
);
expect(
  'Babylon install alternatives documented in UI',
  dialog.includes('babylonInstallOptions') &&
    dialog.includes('npm install @babylonjs/core @babylonjs/loaders --cache .npm-cache-babylon') &&
    dialog.includes('pnpm add @babylonjs/core @babylonjs/loaders') &&
    dialog.includes('vendor-tarballs'),
);
expect(
  'Package script F363',
  pkg.scripts?.['test:f363:three-babylon-readiness'] ===
    'node scripts/check-f363-three-babylon-readiness-contracts.mjs',
);
expect(
  'Docs and Update Center mention F363',
  update.includes('F363 Three/R3F inspection aids') &&
    changelog.includes('F363') &&
    versions.includes('F363') &&
    manual.includes('Addendum F363'),
);

if (failures.length > 0) {
  console.error('F363 Three/Babylon readiness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F363 Three/Babylon readiness contracts passed.');
