import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f431ToF435RendererReleaseGate.ts'), 'utf8');

const markers = [
  'F426-F430 panel',
  'Roles por superficie',
  'Penetraciones MEP',
  'Carga estructural',
  'QA normativo',
  'Flujo Memoria IA',
  'Renderer profundo',
  'Tabla de roles de barrera',
  'Anexo de penetraciones',
  'Anexo estructural',
  'Ledger QA normativo',
  'Export visual BIM',
  'Renderer base v2',
  'allow-flagged-renderer-v2',
  'CanvasArea/useCanvas actual como ruta primaria',
  'F436',
  'F437',
  'F438',
];

const failures = markers.filter((marker) => !text.includes(marker));
const smokeCount = (text.match(/testId:/g) ?? []).length;
const manifestCount = (text.match(/memoryOutput:/g) ?? []).length;
const handoffCount = (text.match(/nextPhase:/g) ?? []).length;

if (smokeCount < 7) failures.push(`expected at least 7 visual smoke surfaces, found ${smokeCount}`);
if (manifestCount < 5) failures.push(`expected at least 5 evidence/memory manifest rows, found ${manifestCount}`);
if (handoffCount < 3) failures.push(`expected at least 3 next-phase handoff rows, found ${handoffCount}`);

if (failures.length) {
  console.error('F431-F435 renderer release gate contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F431-F435 renderer release gate contracts passed.');
