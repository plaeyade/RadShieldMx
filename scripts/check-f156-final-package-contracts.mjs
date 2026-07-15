import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f156FinalPackage.ts',
  'scripts/f156-final-package.mjs',
  'scripts/check-f156-final-package-contracts.mjs',
  'outputs/f156_final_package/f156_final_package.json',
  'outputs/f156_final_package/README_F156_FINAL_PACKAGE.md',
  'outputs/fase_156_final_package.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const tokens = [
  ['src/lib/f156FinalPackage.ts', 'buildF156FinalPackage'],
  ['src/lib/f156FinalPackage.ts', 'public-package-ready'],
  ['src/lib/f156FinalPackage.ts', 'offline-package-ready'],
  ['scripts/f156-final-package.mjs', 'No DATABASE_URL copied'],
  ['scripts/f156-final-package.mjs', 'F155 release decision is not ready'],
  ['scripts/f156-final-package.mjs', 'outputs/f153_db_backup_restore/db_backup'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f156-final-package'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF156FinalPackage'],
  ['package.json', 'prepare:f156:final-package'],
  ['package.json', 'test:f156:final-package'],
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

const manifestPath = path.join(root, 'outputs', 'f156_final_package', 'f156_final_package.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F156') failures.push('F156 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.final-package.f156.v1') failures.push('F156 schema mismatch');
  if (!['public-package-ready', 'offline-package-ready', 'package-gated'].includes(manifest.status)) {
    failures.push(`F156 invalid status: ${manifest.status}`);
  }
  if (!Array.isArray(manifest.releaseArtifacts) || manifest.releaseArtifacts.length < 2) failures.push('F156 missing release artifacts');
  if (!manifest.releaseArtifacts?.some((item) => item.path === 'dist/index.html' && item.present)) {
    failures.push('F156 missing frontend dist artifact');
  }
  if (!manifest.releaseArtifacts?.some((item) => item.path === 'dist-backend/server/boot.js' && item.present)) {
    failures.push('F156 missing backend boot artifact');
  }
  for (const phase of ['F150', 'F151', 'F152', 'F153', 'F154', 'F155']) {
    if (!manifest.evidence?.some((item) => item.phase === phase && item.present)) failures.push(`F156 missing evidence ${phase}`);
  }
  if (!manifest.securityPolicy?.some((item) => item.includes('DATABASE_URL'))) {
    failures.push('F156 missing DATABASE_URL safety policy');
  }
  if (manifest.status !== 'public-package-ready' && (!Array.isArray(manifest.blockingReasons) || manifest.blockingReasons.length === 0)) {
    failures.push('F156 gated/offline output must include blocking reasons');
  }
}

if (failures.length) {
  console.error('F156 final package contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F156 final package contracts OK.');
