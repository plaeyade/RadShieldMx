import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const missing = [];

const requiredFiles = [
  'src/lib/f150ReleaseCandidateControlled.ts',
  'scripts/f150-release-candidate-controlled.mjs',
  'scripts/check-f150-release-candidate-controlled-contracts.mjs',
  'outputs/f150_release_candidate_controlled/f150_release_candidate_controlled.json',
  'outputs/fase_150_release_candidate_controlled.md',
  'outputs/f150_release_candidate_controlled/README_F150_RC.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const requiredTokens = [
  ['src/lib/f150ReleaseCandidateControlled.ts', 'buildF150ReleaseCandidateControlled'],
  ['src/lib/f150ReleaseCandidateControlled.ts', 'controlled-rc-go-public-no-go'],
  ['src/lib/f150ReleaseCandidateControlled.ts', 'F149c Monte Carlo Gateway'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f150-release-candidate-controlled'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF150ReleaseCandidateControlled'],
  ['package.json', 'prepare:f150:release-candidate'],
  ['package.json', 'test:f150:release-candidate'],
];

for (const file of requiredFiles) {
  if (!fs.existsSync(path.join(root, file))) missing.push(`missing file: ${file}`);
}

for (const [file, token] of requiredTokens) {
  const full = path.join(root, file);
  if (!fs.existsSync(full)) {
    missing.push(`missing token file: ${file}`);
    continue;
  }
  const content = fs.readFileSync(full, 'utf8');
  if (!content.includes(token)) missing.push(`missing token "${token}" in ${file}`);
}

const manifestPath = path.join(root, 'outputs', 'f150_release_candidate_controlled', 'f150_release_candidate_controlled.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F150') missing.push('manifest phase is not F150');
  if (manifest.status !== 'release-candidate-controlled') missing.push('manifest status is not release-candidate-controlled');
  if (manifest.decision !== 'controlled-rc-go-public-no-go') missing.push('manifest decision is not controlled RC GO/public NO-GO');
  if (!Array.isArray(manifest.gates) || manifest.gates.length < 7) missing.push('manifest missing release gates');
  if (!manifest.gates?.some((gate) => gate.id === 'mc-gateway')) missing.push('manifest missing F149c MC gateway gate');
  const blockers = (manifest.productionBlockers || []).join(' ').toLowerCase();
  for (const token of ['backup', 'secrets', 'url smoke']) {
    if (!blockers.includes(token)) missing.push(`manifest missing production blocker: ${token}`);
  }
  if (!manifest.goNoGo?.includes('NO-GO')) missing.push('manifest missing public NO-GO statement');
}

if (missing.length) {
  console.error('F150 release candidate contract failed:');
  for (const item of missing) console.error(`- ${item}`);
  process.exit(1);
}

console.log('F150 release candidate contract passed');
