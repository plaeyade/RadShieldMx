import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f130DbLiveRelease.ts',
  'scripts/f130-db-live-release.mjs',
  'outputs/f130_db_live_release.json',
  'outputs/fase_130_db_live_release.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[2]) ? JSON.parse(fs.readFileSync(requiredFiles[2], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[4]) ? fs.readFileSync(requiredFiles[4], 'utf8') : '';

for (const token of ['buildF130DbLiveRelease', 'expectedTables', 'documents', 'document_chunks', 'liveSeedPolicy']) {
  if (!lib.includes(token)) failures.push(`F130 lib missing token: ${token}`);
}

for (const token of ['ensureDatabaseAndUser', 'drizzle-kit', 'scripts/run-seed.mjs', 'scripts/db-live-validation.mjs']) {
  if (!script.includes(token)) failures.push(`F130 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F130') failures.push('F130 output phase mismatch');
  if (!['ready', 'partial', 'blocked'].includes(output.status)) failures.push(`F130 invalid status ${output.status}`);
  if (!Array.isArray(output.steps) || output.steps.length < 2) failures.push('F130 output expected multiple steps');
  if (output.status === 'ready' && output.tableCount < 1) failures.push('F130 ready output expected tables');
}

for (const token of ['buildF130DbLiveRelease', 'F130 DB live release']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

if (failures.length > 0) {
  console.error('F130 DB live contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F130 DB live contracts OK.');
