import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f415BimMepCoordination.ts'), 'utf8');

const markers = [
  'requiredChecks',
  'radiologicalRisk',
  'releaseBlocking',
  'Agregar penetracion',
  'Alternar MEP',
  'Revisar interferencias',
  'Shaded + edges',
  'Evidence Pack',
  'carga kg/m2',
  'shieldingStory',
  'surfaceRoles',
  'designQuestions',
  'referenceStandards',
  'Visible vs real',
  'Barrera primaria',
  'Barrera secundaria',
  'Laberinto',
  'Puerta blindada',
  'IAEA Safety Reports Series 47',
  'NCRP Report 151',
];

const failures = markers.filter((marker) => !text.includes(marker));
const highRiskCount = (text.match(/radiologicalRisk: 'high'/g) ?? []).length;
const gateCount = (text.match(/releaseBlocking/g) ?? []).length;

if (highRiskCount < 2) failures.push(`expected at least 2 high-risk MEP/shielding layers, found ${highRiskCount}`);
if (gateCount < 4) failures.push(`expected at least 4 gates, found ${gateCount}`);

const designQuestionCount = (text.match(/question: '/g) ?? []).length;
const standardCount = (text.match(/traceabilityRule:/g) ?? []).length;

if (designQuestionCount < 5) failures.push(`expected 5 design questions, found ${designQuestionCount}`);
if (standardCount < 5) failures.push(`expected 5 reference standards, found ${standardCount}`);

if (failures.length) {
  console.error('F415 BIM MEP coordination contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F415 BIM MEP coordination contracts passed.');
