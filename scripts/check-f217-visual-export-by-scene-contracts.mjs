import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f217VisualExportByScene.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f217-visual-export-by-scene-contracts.mjs',
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
  'F217',
  'buildF217VisualExportByScene',
  'visual-export-by-scene-ready',
  'f217-visual-export-by-scene',
  'f217-export-ready-count',
  'f217-export-scene-plan',
  'f217-export-scene-heat',
  'f217-export-scene-isocontours',
  'f217-export-scene-structure',
  'f217-export-png-plan',
  'test:f217:visual-export-scenes',
  'Visual Export by Scene',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const target of ['Memoria IA', 'PDF', 'Evidence Pack', 'Anexo estructural']) {
  if (!joined.includes(target)) failures.push(`Missing export target: ${target}`);
}

if (failures.length) {
  console.error('F217 visual export by scene contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F217 visual export by scene contracts OK.');
