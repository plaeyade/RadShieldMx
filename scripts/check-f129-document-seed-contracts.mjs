import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f129DocumentSeedReadiness.ts',
  'scripts/f129-document-seed-readiness.mjs',
  'outputs/f129_document_seed_readiness.json',
  'outputs/fase_129_document_seed_readiness.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const out = fs.existsSync(requiredFiles[2]) ? JSON.parse(fs.readFileSync(requiredFiles[2], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[4]) ? fs.readFileSync(requiredFiles[4], 'utf8') : '';

for (const token of [
  'buildF129DocumentSeedReadiness',
  'ncrp-147-medical-xray-desktop',
  'iaea-srs-47-radiotherapy-facilities-desktop',
  'ncrp-49-structural-shielding',
  'zumaya-memoria-al',
  'seedMode',
  'dry-run-until-mysql',
]) {
  if (!lib.includes(token)) failures.push(`F129 lib missing token: ${token}`);
}

if (out) {
  if (out.phase !== 'F129') failures.push('F129 output phase mismatch');
  if ((out.totals?.seedReady ?? 0) < 5) failures.push('F129 output expected at least 5 seed-ready documents');
  if ((out.totals?.chunksReady ?? 0) < 200) failures.push('F129 output expected at least 200 ready chunks');
  if (!out.needsOcrIds?.includes('ncrp-49-structural-shielding')) failures.push('F129 output missing NCRP-49 OCR blocker');
  if (!out.needsOcrIds?.includes('zumaya-memoria-al')) failures.push('F129 output missing Memoria AL OCR blocker');
  if (!out.suppressedDuplicateIds?.includes('ncrp-147-medical-xray')) failures.push('F129 output missing NCRP-147 duplicate suppression');
  if (!out.mysqlNextSteps?.some((step) => step.includes('DATABASE_URL'))) failures.push('F129 output missing DATABASE_URL next step');
}

for (const token of ['buildF129DocumentSeedReadiness', 'F129 Document seed readiness']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

if (failures.length > 0) {
  console.error('F129 document seed contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F129 document seed contracts OK.');
