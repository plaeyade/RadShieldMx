import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f131FullstackLiveSmoke.ts',
  'scripts/f131-fullstack-live-smoke.mjs',
  'outputs/f131_fullstack_live_smoke.json',
  'outputs/fase_131_fullstack_live_smoke.md',
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

for (const token of ['buildF131FullstackLiveSmoke', 'VITE_ENABLE_BACKEND', 'protectedContracts', 'healthEndpoints']) {
  if (!lib.includes(token)) failures.push(`F131 lib missing token: ${token}`);
}

for (const token of [
  'scripts/db-live-validation.mjs',
  'scripts/build-backend.mjs',
  'scripts/check-backend-health.mjs',
  'scripts/check-backend-contracts.mjs',
  'VITE_ENABLE_BACKEND',
]) {
  if (!script.includes(token)) failures.push(`F131 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F131') failures.push('F131 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F131 expected ready output, got ${output.status}`);
  if (output.frontendBackendEnv?.VITE_ENABLE_BACKEND !== 'true') failures.push('F131 expected backend-enabled frontend env');
  if (!Array.isArray(output.steps) || output.steps.length < 5) failures.push('F131 expected five validation steps');
  if (!output.steps?.every((step) => step.ok)) failures.push('F131 expected all steps OK');
  if (output.dbTableChecks < 20) failures.push(`F131 expected at least 20 DB table checks, got ${output.dbTableChecks}`);
}

for (const token of ['buildF131FullstackLiveSmoke', 'F131 Full-stack live smoke', 'f131-fullstack-live-smoke']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f131:fullstack-live', 'test:f131:fullstack-live']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F131 full-stack live contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F131 full-stack live contracts OK.');
