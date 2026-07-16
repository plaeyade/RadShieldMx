import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'scripts/f179-deploy-lane-decision.mjs',
  'scripts/check-f179-deploy-lane-decision-contracts.mjs',
  'outputs/f179_deploy_lane_decision/f179_deploy_lane_decision.json',
  'outputs/f179_deploy_lane_decision/README_F179_DEPLOY_LANE.md',
  'outputs/fase_179_deploy_lane_decision.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) {
  throw new Error(`Missing F179 files: ${missing.join(', ')}`);
}

const manifest = JSON.parse(
  fs.readFileSync(path.join(root, 'outputs/f179_deploy_lane_decision/f179_deploy_lane_decision.json'), 'utf8'),
);

const expectations = [
  ['phase', manifest.phase === 'F179'],
  ['schema', manifest.schema === 'radshield-mx.deploy-lane-decision.f179.v1'],
  ['status', manifest.status === 'deploy-lane-decided'],
  ['primary', manifest.decision?.primary?.id === 'vercel-static'],
  ['secondary', manifest.decision?.secondary?.id === 'vps-fullstack'],
  ['fallback', manifest.decision?.fallback?.id === 'local-offline'],
  ['sites gated evidence', manifest.evidence?.sitesNetworkGated === true],
  ['no blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0],
  [
    'database url guardrail',
    manifest.releasePolicy?.some((item) => item.includes('DATABASE_URL')) === true,
  ],
  [
    'post deploy F154-F158',
    manifest.releasePolicy?.some((item) => item.includes('F154-F158')) === true,
  ],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) {
  throw new Error(`F179 contract failed: ${failed.join(', ')}`);
}

const combinedText = [
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/fase_179_deploy_lane_decision.md',
]
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F179',
  'Deploy lane',
  'deploy-lane-decided',
  'vercel-static',
  'vps-fullstack',
  'local-offline',
  'PUBLIC_DEPLOY_URL',
  'F154-F158',
  'prepare:f179:deploy-lane',
  'test:f179:deploy-lane',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) {
  throw new Error(`F179 tokens missing: ${missingTokens.join(', ')}`);
}

console.log(
  JSON.stringify(
    {
      status: 'f179-contracts-ready',
      checkedFiles: requiredFiles.length,
      primary: manifest.decision.primary.id,
      secondary: manifest.decision.secondary.id,
    },
    null,
    2,
  ),
);
