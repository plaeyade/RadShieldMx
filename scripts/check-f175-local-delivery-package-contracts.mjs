import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const files = [
  'index.html',
  'public/reset-cache.html',
  'dist/reset-cache.html',
  'scripts/f175-local-delivery-package.mjs',
  'scripts/check-f175-local-delivery-package-contracts.mjs',
  'outputs/f175_local_delivery_package/f175_local_delivery_package.json',
  'outputs/f175_local_delivery_package/README_F175_LOCAL_DELIVERY.md',
  'outputs/fase_175_local_delivery_package.md',
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
  'F175',
  'local-delivery-ready',
  'reset-cache.html',
  'radshield-',
  'enable-sw=1',
  'prepare:f175:local-package',
  'test:f175:local-package',
  'F175 Local delivery',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

const manifestPath = path.join(root, 'outputs/f175_local_delivery_package/f175_local_delivery_package.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F175') failures.push('F175 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.local-delivery-package.f175.v1') failures.push('F175 schema mismatch');
  if (manifest.status !== 'local-delivery-ready') failures.push(`F175 not ready: ${manifest.status}`);
  if (!manifest.localUrls?.cacheReset?.includes('reset-cache.html')) failures.push('F175 missing reset-cache URL');
  if (!manifest.artifacts?.some((item) => item.path === 'dist/reset-cache.html' && item.present)) {
    failures.push('F175 reset-cache artifact missing');
  }
  if (!manifest.evidence?.some((item) => item.phase === 'F174A' && item.status === 'predeploy-hardening-ready')) {
    failures.push('F175 requires F174A ready evidence');
  }
  if (manifest.blockingReasons?.length) failures.push(`F175 has blockers: ${manifest.blockingReasons.join('; ')}`);
}

if (failures.length) {
  console.error('F175 local delivery contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F175 local delivery contracts OK.');
