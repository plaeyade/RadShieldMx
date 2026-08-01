import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f426ToF430CalcRendererClosure.ts'), 'utf8');

const markers = [
  'Primaria',
  'Secundaria',
  'Laberinto',
  'Puerta',
  'Penetracion',
  'Sleeve en primaria',
  'Marco/solape de puerta',
  'Hueco no sellado',
  'Carga estructural integrada',
  'LINAC 6 MV primaria',
  'LINAC 15/18 MV secundaria + neutrones',
  'CT/RX diagnostico',
  'Gamma Knife / Co-60',
  'PET/NM fuente puntual',
  'Ciclotron 18 MeV',
  'Geometry core normalizado',
  'Cutaway 2.5D visible/real',
  'Penetraciones MEP reales',
  'Export visual BIM conectado',
  'QA visual/E2E renderer profundo',
  'plano -> equipo -> barreras -> calculo -> evidencia -> PDF',
];

const failures = markers.filter((marker) => !text.includes(marker));
const roleCount = (text.match(/role: '/g) ?? []).length;
const penaltyCount = (text.match(/defaultPenaltyFactor:/g) ?? []).length;
const qaCount = (text.match(/tolerancePercent:/g) ?? []).length;
const memoryStepCount = (text.match(/fromCanvas:/g) ?? []).length;
const rendererStepCount = (text.match(/phase: 'F4/g) ?? []).length;

if (roleCount < 5) failures.push(`expected at least 5 role calculations, found ${roleCount}`);
if (penaltyCount < 4) failures.push(`expected at least 4 penetration penalties, found ${penaltyCount}`);
if (qaCount < 6) failures.push(`expected at least 6 normative QA cases, found ${qaCount}`);
if (memoryStepCount < 6) failures.push(`expected at least 6 auto-memory steps, found ${memoryStepCount}`);
if (rendererStepCount < 5) failures.push(`expected at least 5 renderer steps, found ${rendererStepCount}`);

if (failures.length) {
  console.error('F426-F430 calc/renderer contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F426-F430 calc/renderer contracts passed.');
