import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f442ToF445RendererV2Runtime.ts'), 'utf8');

const markers = [
  'polyline',
  'polygon',
  'footprint',
  'badge',
  'buildF442ToF445RendererV2Runtime',
  'buildPasses',
  'activationModeFor',
  'drawF442ToF445RendererV2Overlay',
  'Apagar overlay runtime',
  'Apagar flag alto riesgo',
  'Mantener event controller v2 apagado',
  'Runtime v2 visible como preview',
  'Runtime v2 activo bajo flag',
];

const failures = markers.filter((marker) => !text.includes(marker));
const instructionCount = (text.match(/F442RendererInstruction/g) ?? []).length;
const passCount = (text.match(/F443RendererPass/g) ?? []).length;
const gateCount = (text.match(/id: 'f444-/g) ?? []).length;
const rollbackCount = (text.match(/id: 'f445-/g) ?? []).length;

if (instructionCount < 2) failures.push(`expected F442 instruction contract references, found ${instructionCount}`);
if (passCount < 2) failures.push(`expected F443 pass contract references, found ${passCount}`);
if (gateCount < 4) failures.push(`expected at least 4 F444 gates, found ${gateCount}`);
if (rollbackCount < 3) failures.push(`expected at least 3 F445 rollback actions, found ${rollbackCount}`);

if (failures.length) {
  console.error('F442-F445 renderer v2 runtime contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F442-F445 renderer v2 runtime contracts passed.');
