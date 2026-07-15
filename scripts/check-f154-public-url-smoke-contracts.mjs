import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f154PublicUrlSmoke.ts',
  'scripts/f154-public-url-smoke.mjs',
  'scripts/check-f154-public-url-smoke-contracts.mjs',
  'outputs/f154_public_url_smoke/f154_public_url_smoke.json',
  'outputs/fase_154_public_url_smoke.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f154PublicUrlSmoke.ts', 'buildF154PublicUrlSmoke'],
  ['src/lib/f154PublicUrlSmoke.ts', 'F153 restore probe ready'],
  ['scripts/f154-public-url-smoke.mjs', 'RADSHIELD_ALLOW_PUBLIC_SMOKE'],
  ['scripts/f154-public-url-smoke.mjs', 'RADSHIELD_ALLOW_OFFLINE_RELEASE_WAIVER'],
  ['scripts/f154-public-url-smoke.mjs', 'e2e/f134-release-candidate.spec.ts'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f154-public-url-smoke'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF154PublicUrlSmoke'],
  ['package.json', 'prepare:f154:public-smoke'],
  ['package.json', 'test:f154:public-smoke'],
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

const manifestPath = path.join(root, 'outputs', 'f154_public_url_smoke', 'f154_public_url_smoke.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F154') failures.push('F154 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.public-url-smoke.f154.v1') failures.push('F154 schema mismatch');
  if (!['ready', 'ready-to-run', 'gated'].includes(manifest.status)) failures.push(`F154 invalid status: ${manifest.status}`);
  if (!manifest.prerequisites || typeof manifest.prerequisites.distReady !== 'boolean') failures.push('F154 missing prerequisites');
  if (manifest.status !== 'ready' && (!Array.isArray(manifest.blockingReasons) || manifest.blockingReasons.length === 0)) {
    failures.push('F154 gated/ready-to-run output must include blocking reasons');
  }
}

if (failures.length) {
  console.error('F154 public URL smoke contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F154 public URL smoke contracts OK.');
