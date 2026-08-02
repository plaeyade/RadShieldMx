import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f446ToF448CanvasStrongQa.ts'), 'utf8');

const markers = [
  'Sidebar estable',
  'Canvas principal',
  'Dock CAD',
  'Overlay renderer v2',
  'Boton derecho',
  'Accesos rapidos',
  'Ventanas controlables',
  'Seleccion segura',
  'Canvas visible despues de acciones',
  'Overlay no intercepta eventos',
  'Ventanas cierran/minimizan',
  'E2E dedicado requerido',
];

const failures = markers.filter((marker) => !text.includes(marker));
const f446Count = (text.match(/phase: 'F446'/g) ?? []).length;
const f447Count = (text.match(/phase: 'F447'/g) ?? []).length;
const f448Count = (text.match(/phase: 'F448'/g) ?? []).length;

if (f446Count < 4) failures.push(`expected at least 4 F446 surface checks, found ${f446Count}`);
if (f447Count < 4) failures.push(`expected at least 4 F447 interaction checks, found ${f447Count}`);
if (f448Count < 4) failures.push(`expected at least 4 F448 regression gates, found ${f448Count}`);

if (failures.length) {
  console.error('F446-F448 canvas strong QA contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F446-F448 canvas strong QA contracts passed.');
