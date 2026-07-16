import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const files = [
  'vercel.json',
  'netlify.toml',
  'public/_redirects',
  'public/_headers',
  'scripts/f178-alternate-deploy-readiness.mjs',
  'scripts/check-f178-alternate-deploy-contracts.mjs',
  'outputs/f178_alternate_deploy_readiness/f178_alternate_deploy_readiness.json',
  'outputs/f178_alternate_deploy_readiness/README_F178_ALTERNATE_DEPLOY.md',
  'outputs/fase_178_alternate_deploy_readiness.md',
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
  'F178',
  'alternate-deploy-ready',
  'vercel-static',
  'netlify-static',
  'cloudflare-pages',
  'vps-fullstack',
  'local-offline',
  'prepare:f178:alternate-deploy',
  'test:f178:alternate-deploy',
  'F178 Alternate deploy',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

const manifestPath = path.join(root, 'outputs/f178_alternate_deploy_readiness/f178_alternate_deploy_readiness.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F178') failures.push('F178 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.alternate-deploy-readiness.f178.v1') failures.push('F178 schema mismatch');
  if (manifest.status !== 'alternate-deploy-ready') failures.push(`F178 not ready: ${manifest.status}`);
  for (const provider of ['vercel-static', 'netlify-static', 'cloudflare-pages', 'vps-fullstack', 'local-offline']) {
    if (!manifest.providers?.some((item) => item.id === provider)) failures.push(`Missing provider ${provider}`);
  }
  if (!manifest.releasePolicy?.some((item) => item.includes('DATABASE_URL'))) {
    failures.push('F178 must warn against publishing DATABASE_URL');
  }
  if (manifest.blockers?.length) failures.push(`F178 has blockers: ${manifest.blockers.join('; ')}`);
}

if (failures.length) {
  console.error('F178 alternate deploy contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F178 alternate deploy contracts OK.');
