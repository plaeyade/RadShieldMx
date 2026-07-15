import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f153DbBackupRestore.ts',
  'scripts/f153-db-backup-restore.mjs',
  'scripts/check-f153-db-backup-restore-contracts.mjs',
  'outputs/f153_db_backup_restore/f153_db_backup_restore.json',
  'outputs/fase_153_db_backup_restore.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f153DbBackupRestore.ts', 'buildF153DbBackupRestore'],
  ['src/lib/f153DbBackupRestore.ts', 'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1'],
  ['scripts/f153-db-backup-restore.mjs', 'radshield_restore_probe'],
  ['scripts/f153-db-backup-restore.mjs', 'DROP DATABASE'],
  ['scripts/f153-db-backup-restore.mjs', 'sha256'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f153-db-backup-restore'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF153DbBackupRestore'],
  ['package.json', 'prepare:f153:db-backup-restore'],
  ['package.json', 'test:f153:db-backup-restore'],
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

const manifestPath = path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F153') failures.push('F153 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.db-backup-restore.f153.v1') failures.push('F153 schema mismatch');
  if (!['ready', 'backup-ready-restore-gated'].includes(manifest.status)) {
    failures.push(`F153 expected ready or backup-ready-restore-gated status, got ${manifest.status}`);
  }
  if (!manifest.backup?.ok || !manifest.backup?.sha256) failures.push('F153 backup evidence missing');
  if (manifest.status === 'ready') {
    if (!manifest.restoreProbe?.ok || !manifest.restoreProbe?.tableCountMatches) failures.push('F153 restore probe evidence missing');
    if (!manifest.cleanup?.ok) failures.push('F153 cleanup evidence missing');
  } else if (!manifest.adminSetup?.file && !String(manifest.error || '').includes('Access denied')) {
    failures.push('F153 restore-gated output must include admin setup or access-denied evidence');
  }
}

if (failures.length) {
  console.error('F153 DB backup/restore contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F153 DB backup/restore contracts OK.');
