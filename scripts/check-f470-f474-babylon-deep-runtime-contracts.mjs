import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const dialog = fs.readFileSync(path.join(root, 'src', 'sections', 'dialogs', 'MedicalFloorPlan3DDialog.tsx'), 'utf8');
const contract = fs.readFileSync(path.join(root, 'src', 'lib', 'medical3D', 'babylonDeepRuntime.ts'), 'utf8');

const markers = [
  'BabylonDeepRuntimeContract',
  'deep-runtime-ready',
  'deep-runtime-review',
  'F470',
  'F471',
  'F472',
  'F473',
  'F474',
  'f470-f474-babylon-deep-runtime',
  'f471-babylon-pick-hud',
  'f472-babylon-camera-modes',
  'f473-babylon-overlays',
  'registerPick',
  'ActionManager.OnPickTrigger',
  'buildBabylonDeepRuntimeContract',
  'Three/R3F remains the production renderer',
];

const haystack = `${dialog}\n${contract}`;
const failures = markers.filter((marker) => !haystack.includes(marker));

if (failures.length) {
  console.error('F470-F474 Babylon deep runtime contracts failed:');
  for (const failure of failures) console.error(`- missing marker "${failure}"`);
  process.exit(1);
}

console.log('F470-F474 Babylon deep runtime contracts passed.');
