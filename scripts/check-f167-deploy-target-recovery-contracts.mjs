import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f167-deploy-target-recovery.mjs',
  'outputs/f167_deploy_target_recovery/f167_deploy_target_recovery.json',
  'outputs/fase_167_deploy_target_recovery.md',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'package.json',
];

const tokens = [
  ['scripts/f167-deploy-target-recovery.mjs', 'git.chatgpt-team.site:443'],
  ['scripts/f167-deploy-target-recovery.mjs', 'save_site_version/deploy were intentionally skipped'],
  ['scripts/f167-deploy-target-recovery.mjs', 'deploy-network-gated'],
  ['outputs/fase_167_deploy_target_recovery.md', 'Deploy Target Recovery'],
  ['CHANGELOG.md', 'F167'],
  ['MANUAL_VERSIONES_v50.md', 'F167'],
  ['package.json', 'prepare:f167:deploy-target'],
  ['package.json', 'test:f167:deploy-target'],
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

const manifestPath = path.join(root, 'outputs', 'f167_deploy_target_recovery', 'f167_deploy_target_recovery.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F167') failures.push('F167 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.deploy-target-recovery.f167.v1') failures.push('F167 schema mismatch');
  if (!['deploy-network-gated', 'deploy-source-ready'].includes(manifest.status)) failures.push(`F167 invalid status ${manifest.status}`);
  if (!manifest.projectIdPresent) failures.push('F167 must retain project_id from hosting metadata');
  if (!manifest.archiveReady) failures.push('F167 requires F159 archive');
  if (!manifest.pushEvidence?.attempted) failures.push('F167 must record push attempt');
  if (manifest.pushEvidence?.ok && manifest.status !== 'deploy-source-ready') failures.push('F167 push OK must mark deploy-source-ready');
  if (!manifest.pushEvidence?.ok && manifest.saveSiteVersion?.attempted) failures.push('F167 must not save version when push failed');
  if (!manifest.tcpCheck?.target?.includes('git.chatgpt-team.site:443')) failures.push('F167 missing TCP target');
  if (manifest.status === 'deploy-network-gated' && !manifest.blockers?.some((item) => item.includes('git.chatgpt-team.site:443'))) {
    failures.push('F167 gated status must include git.chatgpt-team.site:443 blocker');
  }
}

if (failures.length) {
  console.error('F167 deploy target recovery contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F167 deploy target recovery contracts OK.');
