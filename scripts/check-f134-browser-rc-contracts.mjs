import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f134BrowserRcSmoke.ts',
  'e2e/f134-release-candidate.spec.ts',
  'scripts/check-f134-browser-rc-contracts.mjs',
  'outputs/f134_release_candidate_browser_smoke.json',
  'outputs/fase_134_release_candidate_browser_smoke.md',
  'outputs/f134_release_candidate_browser_smoke.png',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const spec = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[3]) ? JSON.parse(fs.readFileSync(requiredFiles[3], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[6]) ? fs.readFileSync(requiredFiles[6], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[7]) ? fs.readFileSync(requiredFiles[7], 'utf8') : '';

for (const token of ['buildF134BrowserRcSmoke', 'Playwright Chromium', 'f134-browser-rc-smoke']) {
  if (!lib.includes(token)) failures.push(`F134 lib missing token: ${token}`);
}

for (const token of [
  'f100-main-floorplan-canvas',
  'canvas-workflow-panel',
  'f99-cad-like-readiness-panel',
  'f131-fullstack-live-smoke',
  'f132-rc-persistence-smoke',
  'f133-api-authenticated-smoke',
  'f134-browser-rc-smoke',
  'f134_release_candidate_browser_smoke.png',
]) {
  if (!spec.includes(token)) failures.push(`F134 spec missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F134') failures.push('F134 output phase mismatch');
  if (output.status !== 'ready') failures.push(`F134 expected ready output, got ${output.status}`);
  if (!Array.isArray(output.checks) || output.checks.length < 20) failures.push('F134 expected broad browser check coverage');
  if (!output.checks?.every((check) => check.ok)) failures.push('F134 expected every check OK');
  for (const token of [
    'canvas:f100-main-floorplan-canvas-visible-and-sized',
    'update-card:f131-fullstack-live-smoke',
    'update-card:f132-rc-persistence-smoke',
    'update-card:f133-api-authenticated-smoke',
    'update-card:f134-browser-rc-smoke',
    'evidence:screenshot-created',
  ]) {
    if (!output.checks?.some((check) => check.name === token && check.ok)) failures.push(`F134 output missing check: ${token}`);
  }
}

for (const token of ['buildF134BrowserRcSmoke', 'F134 Browser RC smoke', 'f134-browser-rc-smoke']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['test:f134:browser-rc', 'test:f134:browser-rc-contracts']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F134 browser RC contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F134 browser RC contracts OK.');
