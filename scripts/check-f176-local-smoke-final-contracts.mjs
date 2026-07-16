import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];
const files = [
  'scripts/f176-local-smoke-final.mjs',
  'scripts/check-f176-local-smoke-final-contracts.mjs',
  'outputs/f176_local_smoke_final/f176_local_smoke_final.json',
  'outputs/fase_176_local_smoke_final.md',
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
  'F176',
  'local-smoke-ready',
  'LOCAL_SMOKE_URL',
  'reset-cache.html',
  'enable-sw=1',
  'prepare:f176:local-smoke',
  'test:f176:local-smoke',
  'F176 Local smoke',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

const manifestPath = path.join(root, 'outputs/f176_local_smoke_final/f176_local_smoke_final.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F176') failures.push('F176 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.local-smoke-final.f176.v1') failures.push('F176 schema mismatch');
  if (manifest.status !== 'local-smoke-ready') failures.push(`F176 not ready: ${manifest.status}`);
  if (manifest.prerequisites?.f175Status !== 'local-delivery-ready') failures.push('F176 requires F175 ready');
  if (manifest.prerequisites?.f174aStatus !== 'predeploy-hardening-ready') failures.push('F176 requires F174A ready');
  if (!Array.isArray(manifest.http) || manifest.http.length < 3) failures.push('F176 missing HTTP checks');
  if (!manifest.http?.some((item) => item.url?.includes('reset-cache.html') && item.ok)) {
    failures.push('F176 reset-cache HTTP check missing');
  }
  if (manifest.blockingReasons?.length) failures.push(`F176 has blockers: ${manifest.blockingReasons.join('; ')}`);
}

if (failures.length) {
  console.error('F176 local smoke final contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F176 local smoke final contracts OK.');
