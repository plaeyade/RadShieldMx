import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f132RcPersistenceSmoke.ts',
  'scripts/f132-rc-persistence-smoke.mjs',
  'outputs/f132_rc_persistence_smoke.json',
  'outputs/fase_132_rc_persistence_smoke.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[2]) ? JSON.parse(fs.readFileSync(requiredFiles[2], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[4]) ? fs.readFileSync(requiredFiles[4], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[5]) ? fs.readFileSync(requiredFiles[5], 'utf8') : '';

for (const token of ['buildF132RcPersistenceSmoke', 'controlled_zone_plans', 'project_report_exports', 'audit_trail']) {
  if (!lib.includes(token)) failures.push(`F132 lib missing token: ${token}`);
}

for (const token of [
  'projects',
  'calculations',
  'reports',
  'controlled_zone_calculations',
  'analytic_memory_snapshots',
  'joined-evidence-chain',
]) {
  if (!script.includes(token)) failures.push(`F132 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F132') failures.push('F132 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F132 expected ready output, got ${output.status}`);
  if (!Array.isArray(output.checks) || output.checks.length < 15) failures.push('F132 expected broad check coverage');
  if (!output.checks?.every((check) => check.ok)) failures.push('F132 expected every check OK');
  for (const token of ['readback:project', 'readback:calculation', 'readback:report', 'readback:joined-evidence-chain']) {
    if (!output.checks?.some((check) => check.name === token && check.ok)) failures.push(`F132 output missing check: ${token}`);
  }
}

for (const token of ['buildF132RcPersistenceSmoke', 'F132 RC persistence smoke', 'f132-rc-persistence-smoke']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f132:rc-persistence', 'test:f132:rc-persistence']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F132 RC persistence contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F132 RC persistence contracts OK.');
