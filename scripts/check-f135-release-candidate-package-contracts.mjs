import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f135ReleaseCandidatePackage.ts',
  'scripts/f135-release-candidate-package.mjs',
  'scripts/check-f135-release-candidate-package-contracts.mjs',
  'outputs/f135_release_candidate_package.json',
  'outputs/fase_135_release_candidate_package.md',
  'outputs/f135_release_candidate_package/manifest.json',
  'outputs/f135_release_candidate_package/README_F135_RC.md',
  'outputs/f135_release_candidate_package/dist/index.html',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const manifest = fs.existsSync(requiredFiles[3]) ? JSON.parse(fs.readFileSync(requiredFiles[3], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[8]) ? fs.readFileSync(requiredFiles[8], 'utf8') : '';
const pkg = fs.existsSync(requiredFiles[9]) ? fs.readFileSync(requiredFiles[9], 'utf8') : '';

for (const token of ['buildF135ReleaseCandidatePackage', 'productionBlockers', 'F136 production deploy rehearsal']) {
  if (!lib.includes(token)) failures.push(`F135 lib missing token: ${token}`);
}

for (const token of [
  'f130_db_live_release.json',
  'f131_fullstack_live_smoke.json',
  'f132_rc_persistence_smoke.json',
  'f133_api_authenticated_smoke.json',
  'f134_release_candidate_browser_smoke.json',
  'productionCutoverChecklist',
]) {
  if (!script.includes(token)) failures.push(`F135 script missing token: ${token}`);
}

if (manifest) {
  if (manifest.phase !== 'F135') failures.push('F135 manifest phase mismatch');
  if (manifest.status !== 'ready') failures.push(`F135 expected ready manifest, got ${manifest.status}`);
  if (!manifest.dist?.ready) failures.push('F135 dist inventory is not ready');
  if (manifest.dist?.copiedTo !== 'outputs/f135_release_candidate_package/dist') failures.push('F135 dist copy path missing from manifest');
  if (!Array.isArray(manifest.gates) || manifest.gates.length < 5) failures.push('F135 expected F130-F134 gates');
  if (!manifest.gates?.every((gate) => gate.ok)) failures.push('F135 expected every gate OK');
  if (!Array.isArray(manifest.evidence) || manifest.evidence.length < 10) failures.push('F135 expected copied evidence files');
  if (!manifest.productionCutoverChecklist?.some((item) => item.includes('Backup MySQL'))) failures.push('F135 missing DB backup checklist item');
}

for (const token of ['buildF135ReleaseCandidatePackage', 'F135 Release candidate package', 'f135-release-candidate-package']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

for (const token of ['prepare:f135:release-package', 'test:f135:release-package']) {
  if (!pkg.includes(token)) failures.push(`package.json missing script: ${token}`);
}

if (failures.length > 0) {
  console.error('F135 release candidate package contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F135 release candidate package contracts OK.');
