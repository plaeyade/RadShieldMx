import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f151PrepublishHardening.ts',
  'scripts/f151-prepublish-hardening.mjs',
  'scripts/f151-db-backup-restore.mjs',
  'scripts/f151-public-url-smoke.mjs',
  'scripts/check-f151-prepublish-hardening-contracts.mjs',
  'outputs/f151_prepublish_hardening/f151_prepublish_hardening.json',
  'outputs/f151_prepublish_hardening/RELEASE_FREEZE.md',
  'outputs/fase_151_prepublish_hardening.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f151PrepublishHardening.ts', 'buildF151PrepublishHardening'],
  ['src/lib/f151PrepublishHardening.ts', 'public-no-go-until-runtime-gates-pass'],
  ['scripts/f151-prepublish-hardening.mjs', 'PUBLIC_DEPLOY_URL'],
  ['scripts/f151-prepublish-hardening.mjs', 'production-secrets'],
  ['scripts/f151-prepublish-hardening.mjs', 'db-backup-restore'],
  ['scripts/f151-prepublish-hardening.mjs', 'public-url-smoke'],
  ['scripts/f151-prepublish-hardening.mjs', 'release-freeze'],
  ['scripts/f151-db-backup-restore.mjs', 'RADSHIELD_ALLOW_DB_BACKUP'],
  ['scripts/f151-public-url-smoke.mjs', 'RADSHIELD_ALLOW_PUBLIC_SMOKE'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f151-prepublish-hardening'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF151PrepublishHardening'],
  ['package.json', 'prepare:f151:prepublish'],
  ['package.json', 'test:f151:prepublish'],
  ['package.json', 'prepublish:backup-db'],
  ['package.json', 'prepublish:smoke-url'],
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

const manifestPath = path.join(root, 'outputs', 'f151_prepublish_hardening', 'f151_prepublish_hardening.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F151') failures.push('F151 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.prepublish-hardening.f151.v1') failures.push('F151 manifest schema mismatch');
  if (!Array.isArray(manifest.gates) || manifest.gates.length !== 5) failures.push('F151 manifest must include five gates');
  for (const id of ['deploy-target', 'production-secrets', 'db-backup-restore', 'public-url-smoke', 'release-freeze']) {
    if (!manifest.gates?.some((gate) => gate.id === id)) failures.push(`F151 manifest missing gate ${id}`);
  }
  if (!String(manifest.goNoGo || '').includes('public-no-go')) failures.push('F151 manifest should stay public NO-GO until runtime gates pass');
}

if (failures.length) {
  console.error('F151 prepublish hardening contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F151 prepublish hardening contracts OK.');
