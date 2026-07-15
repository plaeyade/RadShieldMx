import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f136ProductionDeployRehearsal.ts',
  'scripts/f136-production-deploy-rehearsal.mjs',
  'scripts/check-f136-production-deploy-rehearsal-contracts.mjs',
  'outputs/f136_production_deploy_rehearsal.json',
  'outputs/fase_136_production_deploy_rehearsal.md',
  'outputs/f136_production_deploy_rehearsal.png',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[3]) ? JSON.parse(fs.readFileSync(requiredFiles[3], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[6]) ? fs.readFileSync(requiredFiles[6], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[7]) ? fs.readFileSync(requiredFiles[7], 'utf8') : '';

for (const token of ['buildF136ProductionDeployRehearsal', 'Local production-like static server', 'F137 production cutover']) {
  if (!lib.includes(token)) failures.push(`F136 lib missing token: ${token}`);
}

for (const token of [
  'outputs/f135_release_candidate_package',
  'http:spa-fallback-served',
  'browser:shell-archivo-visible',
  'browser:update-center-button-visible',
  'f136_production_deploy_rehearsal.png',
]) {
  if (!script.includes(token)) failures.push(`F136 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F136') failures.push('F136 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F136 expected ready output, got ${output.status}`);
  if (!Array.isArray(output.checks) || output.checks.length < 10) failures.push('F136 expected broad rehearsal coverage');
  if (!output.checks?.every((check) => check.ok)) failures.push('F136 expected every check OK');
  for (const token of [
    'f135:manifest-ready',
    'f135:dist-index-hash-match',
    'http:index-served',
    'http:spa-fallback-served',
    'browser:shell-archivo-visible',
    'evidence:screenshot-created',
  ]) {
    if (!output.checks?.some((check) => check.name === token && check.ok)) failures.push(`F136 output missing check: ${token}`);
  }
}

for (const token of ['buildF136ProductionDeployRehearsal', 'F136 Production deploy rehearsal', 'f136-production-deploy-rehearsal']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f136:deploy-rehearsal', 'test:f136:deploy-rehearsal']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F136 production deploy rehearsal contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F136 production deploy rehearsal contracts OK.');
