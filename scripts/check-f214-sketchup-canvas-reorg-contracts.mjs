import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f214SketchUpCanvasReorg.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f214-sketchup-canvas-reorg-contracts.mjs',
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
  'F214',
  'buildF214SketchUpCanvasReorg',
  'sketchup-canvas-reorg-ready',
  'sketchup-inspired-medical-cad',
  'f214-sketchup-viewport-frame',
  'f214-sketchup-canvas-reorg',
  'f214-view-cube',
  'f214-axis-triad',
  'f214-sketchup-chip-scene',
  'test:f214:sketchup-canvas',
  'SketchUp-inspired Canvas Reorg',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const tooltip of [
  'Ajustar vista: centra todo el plano como Zoom Extents CAD/SketchUp',
  'Activar/desactivar snap a grilla para muros, cotas, equipos y puntos de control',
  'Cubo de vista tipo SketchUp',
  'Ejes XYZ de orientacion',
]) {
  if (!joined.includes(tooltip)) failures.push(`Missing tooltip text: ${tooltip}`);
}

if (failures.length) {
  console.error('F214 SketchUp canvas reorg contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F214 SketchUp canvas reorg contracts OK.');
