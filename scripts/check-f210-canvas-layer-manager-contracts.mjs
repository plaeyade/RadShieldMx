import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f210CanvasLayerManagerPolish.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f210-canvas-layer-manager-contracts.mjs',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');

for (const token of [
  'F210',
  'buildF210CanvasLayerManagerPolish',
  'canvas-layer-manager-ready',
  'f210-canvas-layer-manager',
  'f210-active-layer',
  'f210-locked-layers',
  'f210-layer-row',
  'test:f210:canvas-layers',
  'Canvas Layer Manager Polish',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const field of ['visibleCount', 'lockedCount', 'dimmedCount', 'activeLayer', 'warnings']) {
  if (!joined.includes(field)) failures.push(`Missing summary field: ${field}`);
}

if (failures.length) {
  console.error('F210 canvas layer manager contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F210 canvas layer manager contracts OK.');
