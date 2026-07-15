import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f137ProductionCutoverChecklist.ts',
  'scripts/f137-production-cutover-checklist.mjs',
  'scripts/check-f137-production-cutover-contracts.mjs',
  'outputs/f137_production_cutover_checklist.json',
  'outputs/fase_137_production_cutover_checklist.md',
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

for (const token of ['buildF137ProductionCutoverChecklist', 'productionBlockers', 'GO for controlled production cutover preparation']) {
  if (!lib.includes(token)) failures.push(`F137 lib missing token: ${token}`);
}

for (const token of [
  'f130_db_live_release.json',
  'f136_production_deploy_rehearsal.json',
  'public-url-smoke-required',
  'production-secrets-required',
  'production-db-backup-required',
]) {
  if (!script.includes(token)) failures.push(`F137 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F137') failures.push('F137 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F137 expected ready output, got ${output.status}`);
  if (!Array.isArray(output.releaseBasis) || output.releaseBasis.length !== 7) failures.push('F137 expected F130-F136 release basis');
  if (!output.releaseBasis?.every((gate) => gate.ok)) failures.push('F137 expected all F130-F136 gates ready');
  for (const token of ['public-url-smoke-required', 'production-secrets-required', 'production-db-backup-required']) {
    if (!output.cutoverGates?.some((gate) => gate.name === token && gate.blocker === true)) {
      failures.push(`F137 output missing production blocker gate: ${token}`);
    }
  }
  if (!String(output.goNoGoDecision || '').includes('NO-GO for public launch')) {
    failures.push('F137 expected controlled GO / public NO-GO decision');
  }
}

for (const token of ['buildF137ProductionCutoverChecklist', 'F137 Production cutover checklist', 'f137-production-cutover']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f137:cutover', 'test:f137:cutover']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F137 production cutover contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F137 production cutover contracts OK.');
