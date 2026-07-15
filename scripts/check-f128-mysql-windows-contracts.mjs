import fs from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f128MysqlWindowsValidation.ts',
  'scripts/f128-mysql-windows-validation.mjs',
  'outputs/f128_mysql_windows_validation.json',
  'outputs/fase_128_mysql_windows_validation.md',
  'src/sections/dialogs/UpdateAppDialog.tsx',
];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = fs.existsSync(requiredFiles[0]) ? fs.readFileSync(requiredFiles[0], 'utf8') : '';
const script = fs.existsSync(requiredFiles[1]) ? fs.readFileSync(requiredFiles[1], 'utf8') : '';
const output = fs.existsSync(requiredFiles[2]) ? JSON.parse(fs.readFileSync(requiredFiles[2], 'utf8')) : null;
const update = fs.existsSync(requiredFiles[4]) ? fs.readFileSync(requiredFiles[4], 'utf8') : '';

for (const token of [
  'buildF128MysqlWindowsValidation',
  'auth-blocked',
  'migrationAllowed',
  'seedAllowed',
  'CREATE DATABASE IF NOT EXISTS radshield_mx_test',
  "CREATE USER IF NOT EXISTS 'radshield'@'127.0.0.1'",
]) {
  if (!lib.includes(token)) failures.push(`F128 lib missing token: ${token}`);
}

for (const token of [
  'mysql2/promise',
  'f128_mysql_windows_validation.json',
  'fase_128_mysql_windows_validation.md',
  'DATABASE_URL credentials were rejected',
]) {
  if (!script.includes(token)) failures.push(`F128 script missing token: ${token}`);
}

if (output) {
  if (output.phase !== 'F128') failures.push('F128 output phase mismatch');
  if (typeof output.tcpReachable !== 'boolean') failures.push('F128 output missing tcpReachable boolean');
  if (typeof output.authOk !== 'boolean') failures.push('F128 output missing authOk boolean');
  if (output.authOk === false && output.migrationAllowed !== false) failures.push('F128 output must block migrations when auth fails');
  if (!Array.isArray(output.windowsMysqlFixSteps) || output.windowsMysqlFixSteps.length < 5) failures.push('F128 output missing Windows MySQL fix steps');
}

for (const token of ['buildF128MysqlWindowsValidation', 'F128 MySQL Windows validation']) {
  if (!update.includes(token)) failures.push(`UpdateAppDialog missing token: ${token}`);
}

if (failures.length > 0) {
  console.error('F128 MySQL Windows contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F128 MySQL Windows contracts OK.');
