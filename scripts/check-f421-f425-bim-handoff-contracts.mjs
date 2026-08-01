import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const text = fs.readFileSync(path.join(root, 'src/lib/f421ToF425BimHandoff.ts'), 'utf8');

const markers = [
  'Snapshot BIM del canvas',
  'Anexo BIM PDF',
  'BIM handoff JSON',
  'Evidence visual pack',
  'DXF',
  'SVG',
  'IFC',
  'GLB',
  'DWG',
  'RFA/RVT',
  'IfcWall/IfcSlab',
  'IfcOpeningElement/MEP crossing',
  'Puerta blindada',
  'MEPcontent',
  'ProdLib',
  'Schedule RS_*',
  'IFC PropertySet RadShield',
  'Memoria IA BIM',
  'Cambiar renderer antes genera UI bonita pero sin contrato de datos',
];

const failures = markers.filter((marker) => !text.includes(marker));
const visualExportCount = (text.match(/format: '/g) ?? []).length;
const intakeCount = (text.match(/intakeRule:/g) ?? []).length;
const normalizationCount = (text.match(/validationRule:/g) ?? []).length;
const handoffCount = (text.match(/handoffRule:/g) ?? []).length;

if (visualExportCount < 4) failures.push(`expected at least 4 visual exports, found ${visualExportCount}`);
if (intakeCount < 6) failures.push(`expected at least 6 intake routes, found ${intakeCount}`);
if (normalizationCount < 6) failures.push(`expected at least 6 normalization maps, found ${normalizationCount}`);
if (handoffCount < 5) failures.push(`expected at least 5 handoff deliverables, found ${handoffCount}`);

if (failures.length) {
  console.error('F421-F425 BIM handoff contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F421-F425 BIM handoff contracts passed.');
