import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const files = [
  'scripts/f177-sites-deploy-retry.mjs',
  'scripts/check-f177-sites-deploy-retry-contracts.mjs',
  'outputs/f177_sites_deploy_retry/f177_sites_deploy_retry.json',
  'outputs/fase_177_sites_deploy_retry.md',
  '.openai/hosting.json',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

for (const file of files) {
  if (!fs.existsSync(path.join(root, file))) failures.push(`Missing ${file}`);
}

const joined = files.filter((file) => fs.existsSync(path.join(root, file))).map(read).join('\n');
for (const token of [
  'F177',
  'sites-deploy-network-gated',
  'sites-deploy-source-ready',
  'git.chatgpt-team.site',
  'prepare:f177:sites-deploy',
  'test:f177:sites-deploy',
  'F177 Sites deploy',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

const manifestPath = path.join(root, 'outputs/f177_sites_deploy_retry/f177_sites_deploy_retry.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F177') failures.push('F177 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.sites-deploy-retry.f177.v1') failures.push('F177 schema mismatch');
  if (!['sites-deploy-network-gated', 'sites-deploy-source-ready'].includes(manifest.status)) {
    failures.push(`F177 invalid status: ${manifest.status}`);
  }
  if (!manifest.projectIdPresent) failures.push('F177 missing project_id');
  if (manifest.f159Status !== 'sites-deploy-ready') failures.push('F177 requires F159 ready');
  if (manifest.f176Status !== 'local-smoke-ready') failures.push('F177 requires F176 ready');
  if (!manifest.commitSha) failures.push('F177 missing commit SHA');
  if (!manifest.tcpProbe || manifest.tcpProbe.host !== 'git.chatgpt-team.site') failures.push('F177 missing TCP probe');
  if (manifest.status === 'sites-deploy-network-gated' && !manifest.blockers?.length) {
    failures.push('F177 network-gated status must include blockers');
  }
}

if (failures.length) {
  console.error('F177 Sites deploy retry contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F177 Sites deploy retry contracts OK.');
