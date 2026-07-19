import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f209CanvasDimensionSchedule.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f209-canvas-dimension-schedule-contracts.mjs',
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
  'F209',
  'buildF209CanvasDimensionSchedule',
  'canvas-dimension-schedule-ready',
  'f209-canvas-dimension-schedule',
  'f209-dimension-total-length',
  'f209-dimension-barrier-count',
  'f209-dimension-row',
  'test:f209:canvas-dimensions',
  'Canvas Dimension Schedule',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const column of ['Barrera', 'Tipo', 'Material', 'Longitud m', 'Espesor mm', 'Resultado']) {
  if (!joined.includes(column)) failures.push(`Missing report column: ${column}`);
}

if (failures.length) {
  console.error('F209 canvas dimension schedule contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F209 canvas dimension schedule contracts OK.');
