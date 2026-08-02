import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const files = [
  'src/lib/medical3D/unityWebglExportedBuild.ts',
  'src/sections/dialogs/MedicalFloorPlan3DDialog.tsx',
  'public/unity/radshield-medical-3d/README_UNITY_WEBGL_EXPORT.md',
];

const markers = [
  'UnityWebglExportedBuildContract',
  'F475',
  'F476',
  'F477',
  'F478',
  'VITE_MEDICAL_3D_UNITY_LOCAL_BUILD',
  'VITE_MEDICAL_3D_UNITY_WEBGL_URL',
  'public/unity/radshield-medical-3d',
  'Build/*.loader.js',
  'Build/*.wasm',
  'f475-f478-unity-webgl-exported-build',
  'f476-unity-webgl-iframe',
  'f477-unity-case-bridge',
  'visual walkthrough only',
];

const haystack = files.map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8')).join('\n');
const failures = markers.filter((marker) => !haystack.includes(marker));

if (failures.length) {
  console.error('F475-F478 Unity WebGL exported build contracts failed:');
  for (const failure of failures) console.error(`- missing marker "${failure}"`);
  process.exit(1);
}

console.log('F475-F478 Unity WebGL exported build contracts passed.');
