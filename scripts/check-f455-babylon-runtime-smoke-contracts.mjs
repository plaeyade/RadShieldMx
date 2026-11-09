import fs from 'node:fs';
import path from 'node:path';
import { readMedical3DDialogSource } from './medical3d-dialog-source.mjs';

const root = process.cwd();
const dialog = readMedical3DDialogSource(root);
const contract = fs.readFileSync(path.join(root, 'src', 'lib', 'medical3D', 'babylonRuntimeSmoke.ts'), 'utf8');

const markers = [
  'runtime-ready',
  'runtime-review',
  'lazy runtime import',
  'isolated canvas smoke',
  'no calculation mutation',
  'fallback renderer remains active',
  'PBR concrete shielding shell',
  'cutaway bunker preview',
  'controlled-area translucent overlay',
  'BabylonRuntimeSmokePreview',
  'await import(\'@babylonjs/core\')',
  'await import(\'@babylonjs/loaders\')',
  'await import(\'@babylonjs/materials\')',
  'f455-babylon-runtime-status',
];

const haystack = `${contract}\n${dialog}`;
const failures = markers.filter((marker) => !haystack.includes(marker));

if (failures.length) {
  console.error('F455 Babylon runtime smoke contracts failed:');
  for (const failure of failures) console.error(`- missing marker "${failure}"`);
  process.exit(1);
}

console.log('F455 Babylon runtime smoke contracts passed.');
