import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f211CanvasEquipmentSymbolSchedule.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/check-f211-canvas-equipment-symbol-schedule-contracts.mjs',
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
  'F211',
  'buildF211CanvasEquipmentSymbolSchedule',
  'canvas-equipment-symbols-ready',
  'f211-canvas-equipment-symbol-schedule',
  'f211-equipment-footprint-count',
  'f211-equipment-manufacturer-count',
  'f211-equipment-row',
  'test:f211:equipment-symbols',
  'Canvas Equipment Symbol Schedule',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const field of ['withFootprintCount', 'withManufacturerCount', 'withRotationCount', 'manufacturerVariant', 'rotationDeg']) {
  if (!joined.includes(field)) failures.push(`Missing equipment field: ${field}`);
}

if (failures.length) {
  console.error('F211 canvas equipment symbol schedule contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F211 canvas equipment symbol schedule contracts OK.');
