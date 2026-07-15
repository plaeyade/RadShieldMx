import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'src/lib/f149NormativeNumericQa.ts',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/EvidencePackDialog.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'scripts/f149-normative-numeric-qa.mjs',
  'outputs/f149_normative_numeric_qa/f149_normative_numeric_qa.json',
  'outputs/fase_149_normative_numeric_qa.md',
];

const requiredTokens = [
  ['src/lib/f149NormativeNumericQa.ts', 'buildF149NormativeNumericQa'],
  ['src/lib/f149NormativeNumericQa.ts', 'formatF149NormativeNumericQaText'],
  ['src/lib/f149NormativeNumericQa.ts', 'F149-NCRP151-LINAC-PRIMARY'],
  ['src/lib/f149NormativeNumericQa.ts', 'F149-TG108-PET-F18'],
  ['src/lib/f149NormativeNumericQa.ts', 'protocol-internal'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', 'f149-normative-numeric-qa-memoria'],
  ['src/sections/dialogs/MemoriaAIWizard.tsx', '7.6 QA NUMERICO NORMATIVO F149'],
  ['src/sections/dialogs/EvidencePackDialog.tsx', 'f149-normative-numeric-qa-evidence'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f149-normative-numeric-qa-update'],
  ['package.json', 'prepare:f149:numeric-qa'],
  ['package.json', 'test:f149:numeric-qa'],
];

const missing = [];
for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) missing.push(`missing file: ${file}`);
}

for (const [file, token] of requiredTokens) {
  const fullPath = path.join(root, file);
  if (!fs.existsSync(fullPath)) {
    missing.push(`missing token file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(fullPath, 'utf8');
  if (!content.includes(token)) missing.push(`missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f149_normative_numeric_qa', 'f149_normative_numeric_qa.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F149') missing.push('manifest phase is not F149');
  if (!Array.isArray(manifest.caseIds) || manifest.caseIds.length < 8) missing.push('manifest has too few F149 cases');
  if (!manifest.releasePolicy?.some((item) => item.includes('block F150'))) missing.push('manifest release policy does not block F150 failures');
}

if (missing.length) {
  console.error('F149 contract check failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F149 contract check passed');
