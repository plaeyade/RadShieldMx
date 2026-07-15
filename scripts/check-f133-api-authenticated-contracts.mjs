import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f133ApiAuthenticatedSmoke.ts',
  'scripts/f133-api-authenticated-smoke.mjs',
  'outputs/f133_api_authenticated_smoke.json',
  'outputs/fase_133_api_authenticated_smoke.md',
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

for (const token of ['buildF133ApiAuthenticatedSmoke', 'Signed kimi_sid', 'project.create', 'controlledZone.persistDraft']) {
  if (!lib.includes(token)) failures.push(`F133 lib missing token: ${token}`);
}

for (const token of [
  'SignJWT',
  'kimi_sid',
  'security:unauthenticated-project-list-401',
  'project.create',
  'calculation.create',
  'report.create',
  'controlledZone.persistDraft',
  'db:no-spoofed-project-owner',
]) {
  if (!script.includes(token)) failures.push(`F133 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F133') failures.push('F133 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F133 expected ready output, got ${output.status}`);
  if (!Array.isArray(output.checks) || output.checks.length < 20) failures.push('F133 expected broad API/DB check coverage');
  if (!output.checks?.every((check) => check.ok)) failures.push('F133 expected every check OK');
  for (const token of [
    'security:unauthenticated-project-list-401',
    'ownership:project-forced-to-session-user',
    'api-result:controlled-zone-readback',
    'db:no-spoofed-project-owner',
  ]) {
    if (!output.checks?.some((check) => check.name === token && check.ok)) failures.push(`F133 output missing check: ${token}`);
  }
}

for (const token of ['buildF133ApiAuthenticatedSmoke', 'F133 API authenticated smoke', 'f133-api-authenticated-smoke']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f133:api-auth', 'test:f133:api-auth']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F133 API authenticated contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F133 API authenticated contracts OK.');
