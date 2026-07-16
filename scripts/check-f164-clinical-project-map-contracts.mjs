import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f164ClinicalProjectMap.ts',
  'src/components/ClinicalProjectMap.tsx',
  'src/sections/CanvasArea.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/f164_clinical_project_map/f164_clinical_project_map.json',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
for (const token of [
  'buildF164ClinicalProjectMap',
  'radiopharmacy',
  'radiationProtection',
  'shieldingConstruction',
  'softwareEvidence',
  'NuviaTech Healthcare nuclear healthcare map',
]) {
  if (!lib.includes(token)) failures.push(`F164 lib missing ${token}`);
}

const component = existsSync(requiredFiles[1]) ? read(requiredFiles[1]) : '';
for (const token of ['f164-clinical-project-map', '<svg', 'buildF164ClinicalProjectMap', 'Plano / areas / equipos']) {
  if (!component.includes(token)) failures.push(`ClinicalProjectMap missing ${token}`);
}

const canvas = existsSync(requiredFiles[2]) ? read(requiredFiles[2]) : '';
for (const token of ['ClinicalProjectMap', '<ClinicalProjectMap floorPlan={floorPlan} compact />']) {
  if (!canvas.includes(token)) failures.push(`CanvasArea missing ${token}`);
}

const update = existsSync(requiredFiles[3]) ? read(requiredFiles[3]) : '';
for (const token of ['buildF164ClinicalProjectMap', 'f164-clinical-project-map-update', 'F164 Clinical project map']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const report = existsSync(requiredFiles[4]) ? JSON.parse(read(requiredFiles[4])) : null;
if (report) {
  if (report.phase !== 'F164') failures.push('F164 report phase mismatch');
  if (report.status !== 'clinical-map-ready') failures.push('F164 report not ready');
  for (const domain of ['Radiodiagnostico', 'Medicina nuclear', 'Software/evidencia']) {
    if (!report.domains.includes(domain)) failures.push(`F164 report missing domain ${domain}`);
  }
}

const pkg = existsSync(requiredFiles[5]) ? read(requiredFiles[5]) : '';
for (const token of ['prepare:f164:clinical-map', 'test:f164:clinical-map']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F164 clinical project map contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F164 clinical project map contracts OK.');
