import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f172ReleaseCandidateFinal.ts',
  'scripts/f172-release-candidate-final.mjs',
  'scripts/check-f172-release-candidate-final-contracts.mjs',
  'outputs/f172_release_candidate_final/f172_release_candidate_final.json',
  'outputs/fase_172_release_candidate_final.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');

for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const manifest = existsSync(files[3]) ? JSON.parse(read(files[3])) : null;
if (manifest) {
  if (manifest.phase !== 'F172') failures.push('F172 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.release-candidate-final.f172.v1') failures.push('F172 schema mismatch');
  if (!['controlled-offline-ready', 'public-deploy-ready'].includes(manifest.status)) {
    failures.push(`F172 status not release-ready: ${manifest.status}`);
  }
  for (const id of ['db-live', 'numeric-db-qa', 'rag-citations', 'canonical-reindex', 'canvas-polish', 'arxiv-research', 'frontend-build']) {
    const gate = manifest.gates?.find((item) => item.id === id);
    if (!gate?.ok) failures.push(`F172 required local gate failed: ${id}`);
  }
  const deployGate = manifest.gates?.find((item) => item.id === 'deploy-target');
  if (!deployGate || deployGate.blockingPublicDeploy !== true) failures.push('F172 deploy target gate must be public-deploy blocker');
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
for (const token of [
  'F172',
  'Release candidate final',
  'controlled-offline-ready',
  'prepare:f172:release-final',
  'test:f172:release-final',
  'F154-F158',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

if (failures.length) {
  console.error('F172 release candidate final contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F172 release candidate final contracts OK.');
