import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f215CanvasScenePresets.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f215-canvas-scene-presets-contracts.mjs',
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
  'F215',
  'buildF215CanvasScenePresets',
  'canvas-scene-presets-ready',
  'f215-canvas-scene-presets',
  'f215-scene-preset-plan',
  'f215-scene-preset-heat',
  'f215-scene-preset-isocontours',
  'f215-scene-preset-structure',
  'f215-scene-preset-extents',
  'test:f215:canvas-scenes',
  'Canvas Scene Presets',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const preset of ['Planta clinica', 'Mapa de calor', 'Isodosis', 'Estructura', 'Zoom extents']) {
  if (!joined.includes(preset)) failures.push(`Missing scene preset: ${preset}`);
}

if (failures.length) {
  console.error('F215 canvas scene presets contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F215 canvas scene presets contracts OK.');
