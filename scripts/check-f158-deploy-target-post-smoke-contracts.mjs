import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f158DeployTargetPostSmoke.ts',
  'scripts/f158-deploy-target-post-smoke.mjs',
  'scripts/check-f158-deploy-target-post-smoke-contracts.mjs',
  'outputs/f158_deploy_target_post_smoke/f158_deploy_target_post_smoke.json',
  'outputs/fase_158_deploy_target_post_smoke.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f158DeployTargetPostSmoke.ts', 'buildF158DeployTargetPostSmoke'],
  ['src/lib/f158DeployTargetPostSmoke.ts', 'local-postdeploy-ready'],
  ['src/lib/f158DeployTargetPostSmoke.ts', 'external-postdeploy-ready'],
  ['scripts/f158-deploy-target-post-smoke.mjs', 'F154 smoke was not run against external HTTPS PUBLIC_DEPLOY_URL'],
  ['scripts/f158-deploy-target-post-smoke.mjs', 'Missing .openai/hosting.json'],
  ['scripts/f158-deploy-target-post-smoke.mjs', 'Missing local .git source state'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f158-deploy-target-post-smoke'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF158DeployTargetPostSmoke'],
  ['package.json', 'prepare:f158:deploy-target'],
  ['package.json', 'test:f158:deploy-target'],
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

const manifestPath = path.join(root, 'outputs', 'f158_deploy_target_post_smoke', 'f158_deploy_target_post_smoke.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F158') failures.push('F158 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.deploy-target-post-smoke.f158.v1') failures.push('F158 schema mismatch');
  if (!['local-postdeploy-ready', 'external-postdeploy-ready', 'deploy-target-gated'].includes(manifest.status)) {
    failures.push(`F158 invalid status: ${manifest.status}`);
  }
  if (!['local', 'external-public', 'external-non-tls', 'missing', 'invalid'].includes(manifest.targetClass)) {
    failures.push(`F158 invalid target class: ${manifest.targetClass}`);
  }
  for (const phase of ['F154', 'F155', 'F156', 'F157']) {
    if (!manifest.evidence?.some((item) => item.phase === phase && item.present)) failures.push(`F158 missing evidence ${phase}`);
  }
  if (!manifest.deployCapabilities || typeof manifest.deployCapabilities.distReady !== 'boolean') {
    failures.push('F158 missing deploy capabilities');
  }
  if (manifest.targetClass === 'local' && !manifest.externalDeployBlockers?.some((item) => item.includes('external HTTPS'))) {
    failures.push('F158 local target must retain external HTTPS blocker');
  }
  if (manifest.status === 'deploy-target-gated' && (!manifest.blockingReasons || manifest.blockingReasons.length === 0)) {
    failures.push('F158 gated status must include blocking reasons');
  }
}

if (failures.length) {
  console.error('F158 deploy target post-smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F158 deploy target post-smoke contracts OK.');
