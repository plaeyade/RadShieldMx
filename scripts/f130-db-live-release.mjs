import 'dotenv/config';
import fs from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';
import mysql from 'mysql2/promise';

const appUrl = process.env.DATABASE_URL || 'mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test';
const adminUrl = process.env.F130_ADMIN_DATABASE_URL || 'mysql://root:root@127.0.0.1:3306/mysql';

function redact(value) {
  try {
    const url = new URL(value);
    return `${url.username || '<user>'}@${url.hostname}:${url.port || 3306}${url.pathname}`;
  } catch {
    return '<invalid-url>';
  }
}

function run(command, args) {
  const result = spawnSync(command, args, {
    cwd: process.cwd(),
    env: { ...process.env },
    encoding: 'utf8',
    shell: process.platform === 'win32',
  });
  return {
    command: `${command} ${args.join(' ')}`,
    status: result.status,
    ok: result.status === 0,
    stdout: result.stdout?.slice(-6000) ?? '',
    stderr: result.stderr?.slice(-6000) ?? '',
  };
}

function localBin(name) {
  const suffix = process.platform === 'win32' ? '.cmd' : '';
  return path.join(process.cwd(), 'node_modules', '.bin', `${name}${suffix}`);
}

async function ensureDatabaseAndUser() {
  const connection = await mysql.createConnection(adminUrl);
  const statements = [
    'CREATE DATABASE IF NOT EXISTS radshield_mx_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci',
    "CREATE USER IF NOT EXISTS 'radshield'@'localhost' IDENTIFIED BY 'radshield'",
    "CREATE USER IF NOT EXISTS 'radshield'@'127.0.0.1' IDENTIFIED BY 'radshield'",
    "ALTER USER 'radshield'@'localhost' IDENTIFIED BY 'radshield'",
    "ALTER USER 'radshield'@'127.0.0.1' IDENTIFIED BY 'radshield'",
    "GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'localhost'",
    "GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'127.0.0.1'",
    'FLUSH PRIVILEGES',
  ];
  for (const statement of statements) {
    await connection.query(statement);
  }
  await connection.end();
  return statements.length;
}

async function validateAppConnection() {
  const connection = await mysql.createConnection(appUrl);
  const [rows] = await connection.query('select version() as version, database() as db, user() as user');
  await connection.end();
  return rows?.[0] ?? {};
}

async function countTables() {
  const connection = await mysql.createConnection(appUrl);
  const [rows] = await connection.query(
    "select table_name as tableName from information_schema.tables where table_schema = database() order by table_name",
  );
  await connection.end();
  return rows.map((row) => row.tableName);
}

const steps = [];
let appConnection = null;
let tables = [];
let status = 'blocked';
const blockers = [];

try {
  const grantCount = await ensureDatabaseAndUser();
  steps.push({ name: 'ensure-db-user-grants', ok: true, detail: `${grantCount} statements applied` });
} catch (error) {
  steps.push({ name: 'ensure-db-user-grants', ok: false, detail: error.code || error.message });
  blockers.push(`Admin grant step failed: ${error.code || error.message}`);
}

try {
  appConnection = await validateAppConnection();
  steps.push({ name: 'validate-app-database-url', ok: true, detail: appConnection });
} catch (error) {
  steps.push({ name: 'validate-app-database-url', ok: false, detail: error.code || error.message });
  blockers.push(`App DATABASE_URL failed: ${error.code || error.message}`);
}

if (blockers.length === 0) {
  const migration = run(localBin('drizzle-kit'), ['migrate']);
  steps.push({ name: 'drizzle-migrate', ok: migration.ok, detail: migration.ok ? 'migrations applied' : migration.stderr || migration.stdout });
  if (!migration.ok) blockers.push('Drizzle migration failed.');
}

if (blockers.length === 0) {
  const seed = run('node', ['scripts/run-seed.mjs']);
  steps.push({ name: 'app-seed', ok: seed.ok, detail: seed.ok ? 'seed completed' : seed.stderr || seed.stdout });
  if (!seed.ok) blockers.push('Application seed failed.');
}

if (blockers.length === 0) {
  const liveValidation = run('node', ['scripts/db-live-validation.mjs']);
  steps.push({ name: 'db-live-validation', ok: liveValidation.ok, detail: liveValidation.ok ? 'live validation completed' : liveValidation.stderr || liveValidation.stdout });
  if (!liveValidation.ok) blockers.push('Live DB validation failed.');
}

if (appConnection) {
  try {
    tables = await countTables();
    steps.push({ name: 'table-count', ok: tables.length > 0, detail: `${tables.length} tables` });
  } catch (error) {
    steps.push({ name: 'table-count', ok: false, detail: error.code || error.message });
    blockers.push(`Table count failed: ${error.code || error.message}`);
  }
}

if (blockers.length === 0) status = 'ready';
else if (steps.some((step) => step.ok)) status = 'partial';

const output = {
  phase: 'F130',
  generatedAt: new Date().toISOString(),
  status,
  appDatabaseUrl: redact(appUrl),
  adminDatabaseUrl: redact(adminUrl),
  appConnection,
  tableCount: tables.length,
  tables,
  steps,
  blockers,
  decision:
    status === 'ready'
      ? 'DB live path is ready: auth, migrations, seed and validation passed.'
      : 'DB live path is not complete; inspect blockers before release.',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/f130_db_live_release.json', `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# F130 DB Live Release',
  '',
  `Generated: ${output.generatedAt}`,
  `Status: ${output.status}`,
  `App DB: ${output.appDatabaseUrl}`,
  `Tables: ${output.tableCount}`,
  '',
  '## Steps',
  ...steps.map((step) => `- ${step.name}: ${step.ok ? 'OK' : 'FAIL'} - ${typeof step.detail === 'string' ? step.detail.split('\n')[0] : JSON.stringify(step.detail)}`),
  '',
  '## Blockers',
  ...(blockers.length ? blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  `Decision: ${output.decision}`,
  '',
].join('\n');
fs.writeFileSync('outputs/fase_130_db_live_release.md', md);

console.log(JSON.stringify(output, null, 2));

if (status !== 'ready') process.exitCode = 1;
