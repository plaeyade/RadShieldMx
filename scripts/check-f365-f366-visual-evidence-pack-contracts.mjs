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
  'F365 capture manifest model exists',
  ['VisualEvidenceCapture', 'visualEvidenceCaptures', 'setVisualEvidenceCaptures', 'checklistReady', 'stationLabel'].every((token) =>
    dialog.includes(token),
  ),
);
expect(
  'F366 visual evidence gate exists',
  ['buildVisualEvidenceGate', 'visualEvidenceGate', 'missingWorkflows', 'minimumCapturesReady', 'radshield-mx.medical3d.visual-evidence-gate.f366.v1'].every((token) =>
    dialog.includes(token),
  ),
);
expect(
  'F365-F366 UI and export are wired',
  dialog.includes('f365-f366-visual-evidence-pack') &&
    dialog.includes('handleExportVisualEvidencePack') &&
    dialog.includes('medical_3d_visual_evidence_pack_') &&
    dialog.includes('requiredCapturePolicy'),
);
expect(
  'Review JSON includes visual gate and captures',
  dialog.includes('visualEvidenceGate') &&
    dialog.includes('visualEvidenceCaptures') &&
    dialog.includes('annexTargets'),
);
expect(
  'Package script F365-F366',
  pkg.scripts?.['test:f365-f366:visual-evidence-pack'] ===
    'node scripts/check-f365-f366-visual-evidence-pack-contracts.mjs',
);
expect(
  'Docs and Update Center mention F365-F366',
  update.includes('F365-F366 3D visual evidence pack') &&
    changelog.includes('F365-F366') &&
    versions.includes('F365-F366') &&
    manual.includes('Addendum F365-F366'),
);

if (failures.length > 0) {
  console.error('F365-F366 visual evidence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F365-F366 visual evidence contracts passed.');
