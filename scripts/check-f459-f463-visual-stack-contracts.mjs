import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const texts = [
  fs.readFileSync(path.join(root, 'src', 'lib', 'medical3D', 'f459F463VisualStack.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'lib', 'medical3D', 'pbrMaterialDatabase.ts'), 'utf8'),
  fs.readFileSync(path.join(root, 'src', 'sections', 'dialogs', 'MedicalFloorPlan3DDialog.tsx'), 'utf8'),
].join('\n');

const markers = [
  'visual-stack-ready',
  'Unity bridge realista',
  'Unity scene payload',
  'Fotorealismo avanzado nivel 1',
  'Galeria PBR de materiales',
  'Recorrido WASD visual',
  'localStorage-versioned-json',
  'buildPbrMaterialDbUpdate',
  'handleUpdatePbrMaterialDb',
  'handleExportPbrMaterialDb',
  'VITE_MEDICAL_3D_UNITY_WEBGL_URL',
  'visual-only',
];

const failures = markers.filter((marker) => !texts.includes(marker));
if (failures.length) {
  console.error('F459-F463 visual stack contracts failed:');
  for (const marker of failures) console.error(`- missing marker "${marker}"`);
  process.exit(1);
}

console.log('F459-F463 visual stack contracts passed.');
