import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f139MaterialCitationOcrAudit.ts',
  'scripts/f139-material-citation-ocr-audit.mjs',
  'scripts/check-f139-material-citation-ocr-contracts.mjs',
  'outputs/f139_material_audit/f139_material_citation_ocr_audit.json',
  'outputs/fase_139_material_citation_ocr_audit.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[3]) ? JSON.parse(fs.readFileSync(requiredFiles[3], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[5]) ? fs.readFileSync(requiredFiles[5], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[6]) ? fs.readFileSync(requiredFiles[6], 'utf8') : '';

for (const token of ['buildF139MaterialCitationOcrAudit', 'ocrPending', 'resubmissionRequest']) {
  if (!lib.includes(token)) failures.push(`F139 lib missing token: ${token}`);
}

for (const token of [
  "source like 'f138-%'",
  'pageRefMissing',
  'hashTagMissing',
  'semanticWarnings',
  'Resubmit searchable/OCR PDF',
]) {
  if (!script.includes(token)) failures.push(`F139 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F139') failures.push('F139 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F139 expected ready after F141, got ${output.status}`);
  if (!output.db?.ok) failures.push('F139 expected DB readback OK');
  if ((output.db?.totalF138Chunks ?? 0) !== 111) failures.push(`F139 expected 111 F138 chunks, got ${output.db?.totalF138Chunks}`);
  if (output.db?.pageRefMissing !== 0) failures.push('F139 expected zero missing page refs');
  if (output.db?.hashTagMissing !== 0) failures.push('F139 expected zero missing hash tags');
  if (output.db?.modalityMismatch !== 0) failures.push('F139 expected zero modality mismatches');
  if ((output.ocr?.pendingCount ?? -1) !== 0) failures.push('F139 expected no OCR pending blockers after F141 recovery');
  if (!output.citationAudit?.vendorEvidencePolicy?.includes('Do not promote vendor/lab')) {
    failures.push('F139 expected vendor evidence policy');
  }
}

for (const token of ['buildF139MaterialCitationOcrAudit', 'F139 Material citation/OCR audit', 'f139-material-citation-ocr']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f139:material-audit', 'test:f139:material-audit']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F139 material citation/OCR contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F139 material citation/OCR contracts OK.');
