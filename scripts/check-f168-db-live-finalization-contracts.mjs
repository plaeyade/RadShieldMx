import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'scripts/f168-db-live-finalization.mjs',
  'scripts/check-f168-db-live-finalization-contracts.mjs',
  'outputs/f168_db_live_finalization/f168_db_live_finalization.json',
  'outputs/fase_168_db_live_finalization.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const tokens = [
  ['scripts/f168-db-live-finalization.mjs', 'radshield-mx.db-live-finalization.f168.v1'],
  ['scripts/f168-db-live-finalization.mjs', 'db-live-validation.mjs'],
  ['scripts/f168-db-live-finalization.mjs', 'No se escribe password ni DATABASE_URL completo'],
  ['package.json', 'prepare:f168:db-live-final'],
  ['package.json', 'test:f168:db-live-final'],
  ['CHANGELOG.md', 'F168'],
  ['MANUAL_VERSIONES_v50.md', 'F168'],
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

const manifestPath = path.join(root, 'outputs', 'f168_db_live_finalization', 'f168_db_live_finalization.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F168') failures.push('F168 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.db-live-finalization.f168.v1') failures.push('F168 schema mismatch');
  if (!['db-live-ready', 'db-live-gated'].includes(manifest.status)) failures.push(`Unexpected F168 status ${manifest.status}`);
  if (manifest.status === 'db-live-ready') {
    if (!manifest.gates?.mysqlWindowsReady) failures.push('F168 MySQL gate missing');
    if (!manifest.gates?.migrationsAndSeedReady) failures.push('F168 migration/seed gate missing');
    if (!manifest.gates?.backupReady) failures.push('F168 backup gate missing');
    if (!manifest.gates?.restoreProbeReady) failures.push('F168 restore probe gate missing');
    if (!manifest.gates?.restoreCleanupReady) failures.push('F168 cleanup gate missing');
    if (!manifest.liveValidation?.ok) failures.push('F168 live validation missing');
    if (!manifest.backupRestore?.backup?.sha256) failures.push('F168 backup sha missing');
    if (!manifest.releaseImpact?.localFullstackReleaseReady) failures.push('F168 release impact not ready');
  }
  const serialized = JSON.stringify(manifest);
  if (/mysql:\/\/[^:@/\s]+:[^@/\s]+@/i.test(serialized)) failures.push('F168 artifact appears to contain a DB password');
}

if (failures.length) {
  console.error('F168 DB live finalization contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F168 DB live finalization contracts OK.');
