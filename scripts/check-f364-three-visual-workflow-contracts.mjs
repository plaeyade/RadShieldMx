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
  'F364 visual workflow presets exist',
  ['visualWorkflowPresets', 'overview', 'barriers', 'equipment', 'dose', 'walkthrough'].every((token) => dialog.includes(token)),
);
expect(
  'F364 route and stations render in Three',
  ['InspectionRoute', 'RouteSegment', 'f364-three-inspection-route', 'activeStationId', 'inspectionStations'].every((token) =>
    dialog.includes(token),
  ),
);
expect(
  'F364 UI panel and export are wired',
  dialog.includes('f364-three-visual-workflow') &&
    dialog.includes('handleExportVisualWorkflowPack') &&
    dialog.includes('medical_3d_visual_workflow_') &&
    dialog.includes('captureSequence'),
);
expect(
  'F364 review JSON exports workflow evidence',
  dialog.includes('visualWorkflowChecklist') &&
    dialog.includes('stationBookmarks') &&
    dialog.includes('visualWorkflow'),
);
expect(
  'Package script F364',
  pkg.scripts?.['test:f364:three-visual-workflow'] === 'node scripts/check-f364-three-visual-workflow-contracts.mjs',
);
expect(
  'Docs and Update Center mention F364',
  update.includes('F364 Three/R3F visual workflow') &&
    changelog.includes('F364') &&
    versions.includes('F364') &&
    manual.includes('Addendum F364'),
);

if (failures.length > 0) {
  console.error('F364 Three visual workflow contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F364 Three visual workflow contracts passed.');
