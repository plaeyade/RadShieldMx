import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f454PostBetaHeavyEngines.ts'), 'utf8');

const markers = [
  'stable-active',
  'post-beta-ready',
  'requires-local-dependency',
  'requires-external-url',
  'deferred-heavy',
  'VITE_MEDICAL_3D_UNITY_WEBGL_URL',
  '@babylonjs/core',
  '@babylonjs/loaders',
  'fallback obligatorio',
  'no declarar Babylon productivo',
  'Unity es visual-only',
  'lazy loading',
];

const failures = markers.filter((marker) => !text.includes(marker));
const gateCount = (text.match(/id: '/g) ?? []).length;

if (gateCount < 4) failures.push(`expected at least 4 F454 engine gates, found ${gateCount}`);

if (failures.length) {
  console.error('F454 post-beta heavy engines contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F454 post-beta heavy engines contracts passed.');
