import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f416ToF420BimCanvasSequence.ts'), 'utf8');

const markers = [
  'qaRisk',
  'integrationMode',
  'manual-download',
  'future-api',
  'LINAC',
  'Gamma Knife',
  'Ciclotron',
  'Ducto/penetracion',
  'visible-vs-real-ratio',
  'Barrera primaria',
  'Barrera secundaria',
  'Ducto cruzando barrera primaria',
  'Continuidad de puerta blindada',
  'MEP sin capa/categoria',
  'reemplazar candidatos por geometria real',
];

const failures = markers.filter((marker) => !text.includes(marker));
const providerCount = (text.match(/providerType:/g) ?? []).length;
const objectCount = (text.match(/canvasAction:/g) ?? []).length;
const clashCount = (text.match(/requiredAction:/g) ?? []).length;

if (providerCount < 4) failures.push(`expected at least 4 BIM providers, found ${providerCount}`);
if (objectCount < 8) failures.push(`expected at least 8 visual object templates, found ${objectCount}`);
if (clashCount < 4) failures.push(`expected at least 4 clash candidates, found ${clashCount}`);

if (failures.length) {
  console.error('F416-F420 BIM canvas sequence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F416-F420 BIM canvas sequence contracts passed.');
