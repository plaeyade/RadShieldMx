import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f146MaterialReportAppendix.ts',
  'src/sections/dialogs/PdfReportDialog.tsx',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/f146_material_report_appendix/f146_material_report_appendix.json',
  'outputs/fase_146_material_report_appendix.md',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
for (const token of ['buildF146MaterialReportAppendix', 'formatF146MaterialAppendixText', 'citationHash', 'density_g_cm3', 'weight_kg', 'uncertaintyNote', 'evidenceStatus']) {
  if (!lib.includes(token)) failures.push(`F146 lib missing ${token}`);
}

const pdf = existsSync(requiredFiles[1]) ? read(requiredFiles[1]) : '';
for (const token of ['buildF146MaterialReportAppendix', 'f146_material_appendix', 'f146-material-report-appendix']) {
  if (!pdf.includes(token)) failures.push(`PdfReportDialog missing ${token}`);
}

const memoria = existsSync(requiredFiles[2]) ? read(requiredFiles[2]) : '';
for (const token of ['buildF146MaterialReportAppendix', 'f146MaterialAppendixText', 'f146-material-report-appendix-memoria']) {
  if (!memoria.includes(token)) failures.push(`MemoriaAIWizard missing ${token}`);
}

const evidence = existsSync(requiredFiles[3]) ? read(requiredFiles[3]) : '';
for (const token of ['buildF146MaterialReportAppendix', 'f146-material-appendix-evidence']) {
  if (!evidence.includes(token)) failures.push(`EvidencePackDialog missing ${token}`);
}

const update = existsSync(requiredFiles[4]) ? read(requiredFiles[4]) : '';
for (const token of ['buildF146MaterialReportAppendix', 'f146-material-report-appendix-update']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const output = existsSync(requiredFiles[5]) ? JSON.parse(read(requiredFiles[5])) : null;
if (output) {
  if (output.phase !== 'F146' || output.status !== 'ready') failures.push('F146 report not ready');
  for (const field of ['TVL summary', 'density_g_cm3', 'weight_kg', 'citationHash', 'uncertaintyNote']) {
    if (!output.requiredFields.includes(field)) failures.push(`F146 report missing field ${field}`);
  }
}

const pkg = existsSync(requiredFiles[7]) ? read(requiredFiles[7]) : '';
for (const token of ['prepare:f146:material-report', 'test:f146:material-report']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F146 material report appendix contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F146 material report appendix contracts OK.');
