import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f151_prepublish_hardening', 'db_backup');
const manifestPath = path.join(outDir, 'db_backup_restore_manifest.json');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dumpPath = path.join(outDir, `radshield_mx_${timestamp}.sql`);

function parseEnvFile(file) {
  if (!fs.existsSync(file)) return {};
  return Object.fromEntries(
    fs.readFileSync(file, 'utf8')
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter((line) => line && !line.startsWith('#') && line.includes('='))
      .map((line) => {
        const index = line.indexOf('=');
        return [line.slice(0, index), line.slice(index + 1)];
      }),
  );
}

function envValue(key, fileEnv) {
  return process.env[key] || fileEnv[key] || '';
}

function commandExists(command) {
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const args = process.platform === 'win32' ? [command] : ['-v', command];
  return spawnSync(probe, args, { stdio: 'ignore', shell: process.platform !== 'win32' }).status === 0;
}

function commandPath(command, extraDirs = []) {
  const probe = process.platform === 'win32' ? 'where' : 'command';
  const args = process.platform === 'win32' ? [command] : ['-v', command];
  const result = spawnSync(probe, args, { encoding: 'utf8', shell: process.platform !== 'win32' });
  if (result.status === 0) {
    const found = result.stdout.split(/\r?\n/).map((line) => line.trim()).filter(Boolean)[0];
    if (found) return found;
  }
  const suffix = process.platform === 'win32' ? '.exe' : '';
  return extraDirs.map((dir) => path.join(dir, `${command}${suffix}`)).find((candidate) => fs.existsSync(candidate)) ?? null;
}

function parseMysqlUrl(raw) {
  if (!raw) return null;
  const url = new URL(raw);
  return {
    host: url.hostname || '127.0.0.1',
    port: url.port || '3306',
    database: url.pathname.replace(/^\//, ''),
    user: decodeURIComponent(url.username || ''),
    password: decodeURIComponent(url.password || ''),
  };
}

fs.mkdirSync(outDir, { recursive: true });

const fileEnv = parseEnvFile(path.join(root, '.env'));
const databaseUrl = envValue('DATABASE_URL', fileEnv);
const allowBackup = process.env.RADSHIELD_ALLOW_DB_BACKUP === '1';
const allowRestoreProbe = process.env.RADSHIELD_ALLOW_DB_RESTORE_PROBE === '1';
const mysqlBinDir = envValue('MYSQL_BIN_DIR', fileEnv);
const commonMysqlDirs = [
  mysqlBinDir,
  'C:\\Program Files\\MySQL\\MySQL Server 8.4\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.3\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.2\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.1\\bin',
  'C:\\Program Files\\MySQL\\MySQL Server 8.0\\bin',
  'C:\\Program Files\\MariaDB 11.4\\bin',
  'C:\\Program Files\\MariaDB 11.3\\bin',
].filter(Boolean);
const mysqlPath = commandPath('mysql', commonMysqlDirs);
const mysqldumpPath = commandPath('mysqldump', commonMysqlDirs);
const mysqldumpPresent = Boolean(mysqldumpPath);
const mysqlPresent = Boolean(mysqlPath);

const manifest = {
  phase: 'F151',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.db-backup-restore.f151.v1',
  status: 'ready-to-run',
  allowBackup,
  allowRestoreProbe,
  mysqlPresent,
  mysqldumpPresent,
  mysqlPath,
  mysqldumpPath,
  dumpPath: path.relative(root, dumpPath),
  database: null,
  backup: null,
  restoreProbe: null,
  notes: [
    'Este script no imprime secretos.',
    'Para ejecutar backup real: RADSHIELD_ALLOW_DB_BACKUP=1 npm run prepublish:backup-db',
    'Para restore probe real, usar una base temporal y RADSHIELD_ALLOW_DB_RESTORE_PROBE=1.',
  ],
};

try {
  const db = parseMysqlUrl(databaseUrl);
  manifest.database = db
    ? { host: db.host, port: db.port, database: db.database, userPresent: Boolean(db.user), passwordPresent: Boolean(db.password) }
    : null;

  if (!db) {
    manifest.status = 'gated';
    manifest.backup = { ok: false, reason: 'DATABASE_URL missing' };
  } else if (!mysqldumpPresent || !mysqlPresent) {
    manifest.status = 'gated';
    manifest.backup = { ok: false, reason: 'mysql/mysqldump not found in PATH' };
  } else if (!allowBackup) {
    manifest.status = 'ready-to-run';
    manifest.backup = { ok: false, reason: 'RADSHIELD_ALLOW_DB_BACKUP is not 1' };
  } else {
    const env = { ...process.env, MYSQL_PWD: db.password };
    const args = ['--host', db.host, '--port', db.port, '--user', db.user, '--single-transaction', '--routines', '--triggers', db.database];
    const result = spawnSync(mysqldumpPath, args, { env, encoding: 'utf8', maxBuffer: 1024 * 1024 * 200 });
    if (result.status !== 0) {
      manifest.status = 'gated';
      manifest.backup = { ok: false, reason: 'mysqldump failed', stderr: result.stderr.slice(0, 500) };
    } else {
      fs.writeFileSync(dumpPath, result.stdout, 'utf8');
      const hash = crypto.createHash('sha256').update(result.stdout).digest('hex');
      manifest.backup = { ok: true, file: path.relative(root, dumpPath), sha256: hash, bytes: Buffer.byteLength(result.stdout) };
      manifest.status = allowRestoreProbe ? 'ready-to-run' : 'backup-created-restore-pending';
      manifest.restoreProbe = allowRestoreProbe
        ? { ok: false, reason: 'Restore probe requires temporary DB name; not auto-created by release script.' }
        : { ok: false, reason: 'RADSHIELD_ALLOW_DB_RESTORE_PROBE is not 1' };
    }
  }
} catch (error) {
  manifest.status = 'gated';
  manifest.backup = { ok: false, reason: error instanceof Error ? error.message : String(error) };
}

fs.writeFileSync(manifestPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`F151 DB backup/restore manifest written: ${path.relative(root, manifestPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status === 'gated') process.exit(1);
