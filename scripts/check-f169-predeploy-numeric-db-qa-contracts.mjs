import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f169-predeploy-numeric-db-qa.mjs',
  'scripts/check-f169-predeploy-numeric-db-qa-contracts.mjs',
  'outputs/f169_predeploy_numeric_db_qa/f169_predeploy_numeric_db_qa.json',
  'outputs/fase_169_predeploy_numeric_db_qa.md',
  'scripts/f169-numeric-runtime-smoke.ts',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const requiredTokens = [
  ['scripts/f169-predeploy-numeric-db-qa.mjs', 'radshield-mx.predeploy-numeric-db-qa.f169.v1'],
  ['scripts/f169-predeploy-numeric-db-qa.mjs', 'f169-numeric-runtime-smoke.ts'],
  ['scripts/f169-numeric-runtime-smoke.ts', 'buildF149NormativeNumericQa'],
  ['scripts/f169-numeric-runtime-smoke.ts', 'tvlTransmission'],
  ['scripts/f169-predeploy-numeric-db-qa.mjs', 'f168-db-live-finalization.mjs'],
  ['scripts/f169-predeploy-numeric-db-qa.mjs', 'f149-normative-numeric-qa.mjs'],
  ['package.json', 'prepare:f169:numeric-db-qa'],
  ['package.json', 'test:f169:numeric-db-qa'],
  ['CHANGELOG.md', 'F169'],
  ['MANUAL_VERSIONES_v50.md', 'F169'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of requiredTokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f169_predeploy_numeric_db_qa', 'f169_predeploy_numeric_db_qa.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F169') failures.push('F169 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.predeploy-numeric-db-qa.f169.v1') failures.push('F169 schema mismatch');
  if (!['predeploy-numeric-ready', 'predeploy-numeric-gated'].includes(manifest.status)) failures.push(`Unexpected F169 status ${manifest.status}`);
  if (manifest.status === 'predeploy-numeric-ready') {
    for (const [gate, ok] of Object.entries(manifest.gates ?? {})) {
      if (!ok) failures.push(`F169 gate failed: ${gate}`);
    }
    if ((manifest.f149?.caseCount ?? 0) < 8) failures.push('F169 requires at least 8 F149 cases');
    if (manifest.f168?.status !== 'db-live-ready') failures.push('F169 requires F168 db-live-ready');
    if (!manifest.numericRuntimeSmoke?.ok) failures.push('F169 numeric runtime smoke did not pass');
    if ((manifest.numericRuntimeSmoke?.checksPassed ?? 0) < 8) failures.push('F169 numeric runtime smoke check count is unexpectedly low');
  }
}

if (failures.length) {
  console.error('F169 predeploy numeric DB QA contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F169 predeploy numeric DB QA contracts OK.');
