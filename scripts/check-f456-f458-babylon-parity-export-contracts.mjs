import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dialog = fs.readFileSync(path.join(root, 'src', 'sections', 'dialogs', 'MedicalFloorPlan3DDialog.tsx'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'src', 'lib', 'medical3D', 'babylonRuntimeSmoke.ts'), 'utf8');

const markers = [
  'BabylonSceneParityContract',
  'parity-ready',
  'parity-review',
  'scene.walls.forEach',
  'scene.equipment.forEach',
  'f457-babylon-performance-gate',
  'firstFrameMs',
  'getFps',
  'toDataURL',
  'f458-babylon-export-png',
  'fallbackRenderer',
  'visual evidence only',
];

const haystack = `${dialog}\n${contract}`;
const failures = markers.filter((marker) => !haystack.includes(marker));

if (failures.length) {
  console.error('F456-F458 Babylon parity/export contracts failed:');
  for (const failure of failures) console.error(`- missing marker "${failure}"`);
  process.exit(1);
}

console.log('F456-F458 Babylon parity/export contracts passed.');
