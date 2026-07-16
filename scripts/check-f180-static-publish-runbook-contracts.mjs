import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'scripts/f180-static-publish-runbook.mjs',
  'scripts/check-f180-static-publish-runbook-contracts.mjs',
  'outputs/f180_static_publish_runbook/f180_static_publish_runbook.json',
  'outputs/f180_static_publish_runbook/README_F180_STATIC_PUBLISH.md',
  'outputs/fase_180_static_publish_runbook.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) throw new Error(`Missing F180 files: ${missing.join(', ')}`);

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'outputs/f180_static_publish_runbook/f180_static_publish_runbook.json'), 'utf8'),
);

const expectations = [
  ['phase', manifest.phase === 'F180'],
  ['schema', manifest.schema === 'radshield-mx.static-publish-runbook.f180.v1'],
  ['status', manifest.status === 'static-publish-runbook-ready'],
  ['f179 prerequisite', manifest.prerequisites?.f179Status === 'deploy-lane-decided'],
  ['primary lane', manifest.prerequisites?.selectedPrimaryLane === 'vercel-static'],
  ['secondary lane', manifest.prerequisites?.selectedSecondaryLane === 'vps-fullstack'],
  ['no blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0],
  ['vercel provider', manifest.providers?.some((provider) => provider.id === 'vercel-static' && provider.recommended)],
  ['netlify provider', manifest.providers?.some((provider) => provider.id === 'netlify-static')],
  ['cloudflare provider', manifest.providers?.some((provider) => provider.id === 'cloudflare-pages')],
  ['vps provider', manifest.providers?.some((provider) => provider.id === 'vps-fullstack')],
  ['secret policy', manifest.secretPolicy?.forbiddenOnStaticHosts?.includes('DATABASE_URL')],
  ['post deploy smoke', manifest.postDeploySmoke?.commands?.some((command) => command.includes('prepare:f154'))],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`F180 contract failed: ${failed.join(', ')}`);

const combinedText = [
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/fase_180_static_publish_runbook.md',
]
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F180',
  'Static publish',
  'static-publish-runbook-ready',
  'vercel-static',
  'netlify-static',
  'cloudflare-pages',
  'vps-fullstack',
  'DATABASE_URL',
  'PUBLIC_DEPLOY_URL',
  'F154-F158',
  'prepare:f180:static-publish',
  'test:f180:static-publish',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F180 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f180-contracts-ready',
      checkedFiles: requiredFiles.length,
      providers: manifest.providers.map((provider) => provider.id),
    },
    null,
    2,
  ),
);
