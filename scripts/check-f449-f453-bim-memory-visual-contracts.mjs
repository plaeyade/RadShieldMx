import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f449ToF453BimMemoryVisual.ts'), 'utf8');

const markers = [
  'Primary barrier',
  'Secondary barrier',
  'Maze and door',
  'MEP penetrations',
  'Structural load',
  'NCRP 151',
  'IAEA SRS-47',
  'Material TVL/density',
  'Manufacturer equipment',
  'sala visible vs bunker real',
  'cada muro tiene un trabajo distinto',
  'interfaz BIM/CAD con ribbon',
  'Project manager',
  'Cutaway bunker',
  'Memory flow',
];

const failures = markers.filter((marker) => !text.includes(marker));
const f449Count = (text.match(/phase: 'F449'/g) ?? []).length;
const f450Count = (text.match(/phase: 'F450'/g) ?? []).length;
const f451Count = (text.match(/phase: 'F451'/g) ?? []).length;
const f452Count = (text.match(/phase: 'F452'/g) ?? []).length;
const f453Count = (text.match(/phase: 'F453'/g) ?? []).length;

if (f449Count < 5) failures.push(`expected at least 5 F449 trace bindings, found ${f449Count}`);
if (f450Count < 4) failures.push(`expected at least 4 F450 citation bindings, found ${f450Count}`);
if (f451Count < 5) failures.push(`expected at least 5 F451 visual adaptations, found ${f451Count}`);
if (f452Count < 3) failures.push(`expected at least 3 F452 graphic panels, found ${f452Count}`);
if (f453Count < 3) failures.push(`expected at least 3 F453 handoff gates, found ${f453Count}`);

if (failures.length) {
  console.error('F449-F453 BIM memory visual contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F449-F453 BIM memory visual contracts passed.');
