import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

const requiredFiles = [
  'src/lib/f152ProductionEnvironmentPrep.ts',
  'scripts/f152-production-environment-prep.mjs',
  'scripts/check-f152-production-environment-contracts.mjs',
  'outputs/f152_production_environment_prep/f152_production_environment_prep.json',
  'outputs/fase_152_production_environment_prep.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
  '.env.example',
];

const tokens = [
  ['src/lib/f152ProductionEnvironmentPrep.ts', 'buildF152ProductionEnvironmentPrep'],
  ['src/lib/f152ProductionEnvironmentPrep.ts', 'ready-for-f153-db-backup'],
  ['scripts/f152-production-environment-prep.mjs', 'MYSQL_BIN_DIR'],
  ['scripts/f152-production-environment-prep.mjs', 'PUBLIC_DEPLOY_URL'],
  ['scripts/f152-production-environment-prep.mjs', 'dist-backend/server/boot.js'],
  ['scripts/f152-production-environment-prep.mjs', 'ready-for-f153-db-backup'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'f152-production-environment-prep'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'buildF152ProductionEnvironmentPrep'],
  ['package.json', 'prepare:f152:environment'],
  ['package.json', 'test:f152:environment'],
  ['.env.example', 'MYSQL_BIN_DIR'],
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

const manifestPath = path.join(root, 'outputs', 'f152_production_environment_prep', 'f152_production_environment_prep.json');
if (fs.existsSync(manifestPath)) {
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
  if (manifest.phase !== 'F152') failures.push('F152 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.production-environment-prep.f152.v1') failures.push('F152 schema mismatch');
  if (!Array.isArray(manifest.runtimeOptions) || manifest.runtimeOptions.length < 3) failures.push('F152 missing runtime options');
  if (!Array.isArray(manifest.gates) || manifest.gates.length < 7) failures.push('F152 missing environment gates');
  for (const id of ['release-basis', 'deploy-target', 'frontend-artifact', 'backend-artifact', 'backend-bridge', 'production-secrets', 'mysql-tools']) {
    if (!manifest.gates?.some((gate) => gate.id === id)) failures.push(`F152 missing gate ${id}`);
  }
  if (!manifest.requiredEnv?.some((item) => item.includes('MYSQL_BIN_DIR'))) failures.push('F152 required env missing MYSQL_BIN_DIR');
}

if (failures.length) {
  console.error('F152 production environment contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F152 production environment contracts OK.');
