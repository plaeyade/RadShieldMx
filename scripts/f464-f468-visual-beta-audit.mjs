import { readFileSync } from 'node:fs';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const checks = [
  ['src/lib/medical3D/f464F468VisualBeta.ts', 'radshield-mx.medical3d.visual-beta.f464-f468.v1'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f464-f468-visual-beta'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f465-material-technical-links'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f466-canvas-3d-sync-map'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f467-memoria-visual-evidence'],
  ['src/sections/dialogs/MedicalFloorPlan3DDialog.tsx', 'f468-export-visual-beta-pack'],
  ['e2e/f464-f468-visual-beta.spec.ts', 'f464-f468-visual-beta'],
  ['CHANGELOG.md', 'F464-F468'],
  ['MANUAL_VERSIONES_v50.md', 'F464-F468'],
  ['MANUAL_USUARIO_v99.md', 'F464-F468'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F464-F468 visual beta'],
  ['package.json', 'prepare:f464-f468:visual-beta'],
  ['package.json', 'test:f464-f468:visual-beta'],
  ['package.json', 'test:f464-f468:visual-beta:e2e'],
];

const failures = [];
for (const [file, marker] of checks) {
  let text = '';
  try {
    text = file === 'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx' ? readMedical3DDialogSource() : readFileSync(file, 'utf8');
  } catch {
    failures.push(`${file}: missing file`);
    continue;
  }
  if (!text.includes(marker)) failures.push(`${file}: missing marker ${marker}`);
}

if (failures.length) {
  console.error('F464-F468 visual beta audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F464-F468 visual beta audit passed.');
