import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  'scripts/f200-static-frontend-release-gate.mjs',
  'scripts/check-f200-static-frontend-release-gate-contracts.mjs',
  'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json',
  'outputs/f200_static_frontend_release_gate/README_F200_STATIC_FRONTEND_RELEASE_GATE.md',
  'outputs/fase_200_static_frontend_release_gate.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

const missing = requiredFiles.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missing.length > 0) throw new Error(`Missing F200 files: ${missing.join(', ')}`);

const manifest = JSON.parse(
  fs.readFileSync(
    path.join(root, 'outputs/f200_static_frontend_release_gate/f200_static_frontend_release_gate.json'),
    'utf8',
  ),
);

const expectations = [
  ['phase', manifest.phase === 'F200'],
  ['schema', manifest.schema === 'radshield-mx.static-frontend-release-gate.f200.v1'],
  ['status', manifest.status === 'static-frontend-release-ready'],
  ['f197 gate', manifest.gates?.some((gate) => gate.id === 'f197-menu-canvas' && gate.status === 'pass')],
  ['f198 gate', manifest.gates?.some((gate) => gate.id === 'f198-full-menus' && gate.status === 'pass')],
  ['f199 gate', manifest.gates?.some((gate) => gate.id === 'f199-output-surfaces' && gate.status === 'pass')],
  ['static config gate', manifest.gates?.some((gate) => gate.id === 'static-hosting-config' && gate.status === 'pass')],
  ['archive present', manifest.artifacts?.some((artifact) => artifact.path.endsWith('radshield-mx-f200-static-dist.zip') && artifact.present && artifact.bytes > 0)],
  ['public deploy url', typeof manifest.publicDeployUrl === 'string' && manifest.publicDeployUrl.startsWith('https://')],
  ['no blockers', Array.isArray(manifest.blockers) && manifest.blockers.length === 0],
];

const failed = expectations.filter(([, ok]) => !ok).map(([name]) => name);
if (failed.length > 0) throw new Error(`F200 contract failed: ${failed.join(', ')}`);

const combinedText = [
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
  'MANUAL_USUARIO_v99.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'outputs/fase_200_static_frontend_release_gate.md',
]
  .map((relativePath) => fs.readFileSync(path.join(root, relativePath), 'utf8'))
  .join('\n');

const requiredTokens = [
  'F200',
  'Static frontend release gate',
  'static-frontend-release-ready',
  'radshield-mx-static-dist.vercel.app',
  'prepare:f200:static-release-gate',
  'test:f200:static-release-gate',
  'F201 public URL smoke',
];

const missingTokens = requiredTokens.filter((token) => !combinedText.includes(token));
if (missingTokens.length > 0) throw new Error(`F200 tokens missing: ${missingTokens.join(', ')}`);

console.log(
  JSON.stringify(
    {
      status: 'f200-contracts-ready',
      releaseStatus: manifest.status,
      publicDeployUrl: manifest.publicDeployUrl,
    },
    null,
    2,
  ),
);
