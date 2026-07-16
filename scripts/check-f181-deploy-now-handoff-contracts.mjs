import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'scripts/f181-deploy-now-handoff.mjs',
  'scripts/check-f181-deploy-now-handoff-contracts.mjs',
  'outputs/f181_deploy_now_handoff/f181_deploy_now_handoff.json',
  'outputs/f181_deploy_now_handoff/README_F181_DEPLOY_NOW.md',
  'outputs/fase_181_deploy_now_handoff.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) throw new Error(`Missing F181 files: ${missing.join(', ')}`);

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'outputs/f181_deploy_now_handoff/f181_deploy_now_handoff.json'), 'utf8'),
);

const archivePath = path.join(root, manifest.staticDeploy?.archive?.path ?? '');
const expectations = [
  ['phase', manifest.phase === 'F181'],
  ['schema', manifest.schema === 'radshield-mx.deploy-now-handoff.f181.v1'],
  [
    'status',
    ['sites-deploy-blocked-static-package-ready', 'sites-deploy-network-ready-static-package-ready'].includes(
      manifest.status,
    ),
  ],
  ['f180 prerequisite', manifest.prerequisites?.f180Status === 'static-publish-runbook-ready'],
  ['sites attempted', manifest.sites?.attempted === true],
  ['no unsafe save', manifest.sites?.saveVersionAttempted === false],
  ['no unsafe deploy', manifest.sites?.deployAttempted === false],
  ['static archive', fs.existsSync(archivePath) && fs.statSync(archivePath).size > 0],
  ['provider', manifest.staticDeploy?.recommendedProvider === 'vercel-static'],
  ['post smoke', manifest.staticDeploy?.postDeployCommands?.some((command) => command.includes('f154'))],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`F181 contract failed: ${failed.join(', ')}`);

const combinedText = [
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/fase_181_deploy_now_handoff.md',
]
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F181',
  'Deploy now',
  'sites-deploy-blocked-static-package-ready',
  'vercel-static',
  'PUBLIC_DEPLOY_URL',
  'F154-F158',
  'prepare:f181:deploy-now',
  'test:f181:deploy-now',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F181 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f181-contracts-ready',
      deployStatus: manifest.status,
      archive: manifest.staticDeploy.archive.path,
    },
    null,
    2,
  ),
);
