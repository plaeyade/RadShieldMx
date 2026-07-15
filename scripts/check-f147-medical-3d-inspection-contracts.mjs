import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f147Medical3DInspection.ts',
  'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  'outputs/f147_medical_3d_inspection/f147_medical_3d_inspection.json',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const f147Lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
for (const token of ['buildF147Medical3DInspection', 'F147InspectionStation', 'controlled-zone', 'critical-wall', 'exportArtifacts']) {
  if (!f147Lib.includes(token)) failures.push(`F147 lib missing ${token}`);
}

const dialog = existsSync(requiredFiles[1]) ? read(requiredFiles[1]) : '';
for (const token of ['buildF147Medical3DInspection', 'f147-medical-3d-inspection', 'handleExportF147Pack', 'Exportar F147 pack', 'setWalkthrough(true)']) {
  if (!dialog.includes(token)) failures.push(`MedicalFloorPlan3DDialog missing ${token}`);
}

const output = existsSync(requiredFiles[2]) ? JSON.parse(read(requiredFiles[2])) : null;
if (output) {
  if (output.phase !== 'F147' || output.status !== 'ready') failures.push('F147 report not ready');
  for (const layer of ['barrier thickness/material geometry', 'controlled/occupied zones', 'exportable review artifacts']) {
    if (!output.visualLayers.includes(layer)) failures.push(`F147 report missing visual layer ${layer}`);
  }
}

const pkg = existsSync(requiredFiles[3]) ? read(requiredFiles[3]) : '';
for (const token of ['prepare:f147:medical-3d', 'test:f147:medical-3d']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F147 medical 3D inspection contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F147 medical 3D inspection contracts OK.');
