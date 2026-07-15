import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f144SourceGovernance.ts',
  'scripts/f144-source-governance.mjs',
  'scripts/check-f144-source-governance-contracts.mjs',
  'outputs/f144_source_governance/f144_source_governance.json',
  'outputs/fase_144_source_governance.md',
  'src/sections/dialogs/MemoriaAIWizard.tsx',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const report = existsSync(requiredFiles[3]) ? JSON.parse(read(requiredFiles[3])) : null;
if (report) {
  if (report.phase !== 'F144') failures.push('F144 report phase mismatch');
  if (report.status !== 'ready') failures.push(`Unexpected F144 status: ${report.status}`);
  if (report.sourceCount < 8) failures.push(`Expected at least 8 governed sources, got ${report.sourceCount}`);
  if (report.canonicalCount < 3) failures.push(`Expected at least 3 canonical sources, got ${report.canonicalCount}`);
  const modalities = new Set((report.memoryProfiles ?? []).map((profile) => profile.modality));
  for (const modality of ['LINAC', 'GAMMA_KNIFE']) {
    if (!modalities.has(modality)) failures.push(`Missing ${modality} memory profile`);
  }
  const reviewText = (report.methodologyReview ?? []).join(' ');
  for (const token of ['No silent calculation change', 'NCRP 151', 'NCRP 144', 'review-required']) {
    if (!reviewText.includes(token)) failures.push(`Methodology review missing ${token}`);
  }
}

const memoria = existsSync('src/sections/dialogs/MemoriaAIWizard.tsx') ? read('src/sections/dialogs/MemoriaAIWizard.tsx') : '';
for (const token of ['buildF144SourceGovernance', 'f144-source-governance-memoria', 'LINAC', 'GAMMA_KNIFE']) {
  if (!memoria.includes(token)) failures.push(`MemoriaAIWizard missing ${token}`);
}

const update = existsSync('src/sections/dialogs/UpdateAppDialog.tsx') ? read('src/sections/dialogs/UpdateAppDialog.tsx') : '';
for (const token of ['buildF144SourceGovernance', 'f144-source-governance', 'F144 Source governance']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const pkg = existsSync('package.json') ? read('package.json') : '';
for (const token of ['prepare:f144:source-governance', 'test:f144:source-governance']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F144 source governance contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F144 source governance contracts OK.');
