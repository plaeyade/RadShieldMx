import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f155ControlledReleaseDecision.ts',
  'scripts/f155-controlled-release-decision.mjs',
  'scripts/check-f155-controlled-release-decision-contracts.mjs',
  'outputs/f155_controlled_release_decision/f155_controlled_release_decision.json',
  'outputs/fase_155_controlled_release_decision.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f155ControlledReleaseDecision.ts', 'buildF155ControlledReleaseDecision'],
  ['src/lib/f155ControlledReleaseDecision.ts', 'public-release-ready'],
  ['src/lib/f155ControlledReleaseDecision.ts', 'offline-rc-ready'],
  ['scripts/f155-controlled-release-decision.mjs', 'RADSHIELD_ALLOW_OFFLINE_RELEASE_WAIVER'],
  ['scripts/f155-controlled-release-decision.mjs', 'F153 restore probe is not ready'],
  ['scripts/f155-controlled-release-decision.mjs', 'F154 public URL smoke is not ready'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f155-controlled-release-decision'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF155ControlledReleaseDecision'],
  ['package.json', 'prepare:f155:release-decision'],
  ['package.json', 'test:f155:release-decision'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

for (const [file, token] of tokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    failures.push(`Missing token file ${file}`);
    continue;
  }
  if (!fs.readFileSync(full, 'utf8').includes(token)) failures.push(`Missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f155_controlled_release_decision', 'f155_controlled_release_decision.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F155') failures.push('F155 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.controlled-release-decision.f155.v1') failures.push('F155 schema mismatch');
  if (!['public-release-ready', 'offline-rc-ready', 'blocked'].includes(manifest.status)) {
    failures.push(`F155 invalid status: ${manifest.status}`);
  }
  if (!Array.isArray(manifest.evidence) || manifest.evidence.length < 5) failures.push('F155 missing F150-F154 evidence list');
  for (const phase of ['F150', 'F151', 'F152', 'F153', 'F154']) {
    if (!manifest.evidence?.some((item) => item.phase === phase)) failures.push(`F155 missing evidence ${phase}`);
  }
  if (!manifest.prerequisites || typeof manifest.prerequisites.f153RestoreReady !== 'boolean') {
    failures.push('F155 missing release prerequisites');
  }
  if (!Array.isArray(manifest.releaseLanes) || !manifest.releaseLanes.some((lane) => lane.id === 'public')) {
    failures.push('F155 missing public release lane');
  }
  if (manifest.status !== 'public-release-ready' && (!Array.isArray(manifest.blockingReasons) || manifest.blockingReasons.length === 0)) {
    failures.push('F155 gated output must include blocking reasons');
  }
}

if (failures.length) {
  console.error('F155 controlled release decision contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F155 controlled release decision contracts OK.');
