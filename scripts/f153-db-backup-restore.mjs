import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f153_db_backup_restore');
const backupDir = path.join(outDir, 'db_backup');
const jsonPath = path.join(outDir, 'f153_db_backup_restore.json');
const mdPath = path.join(root, 'outputs', 'fase_153_db_backup_restore.md');
const adminSqlPath = path.join(outDir, 'f153_restore_probe_admin_setup.sql');
const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
const dumpPath = path.join(backupDir, `radshield_mx_${timestamp}.sql`);

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

function mysqlArgs(db, extra = []) {
  return ['--host', db.host, '--port', db.port, '--user', db.user, ...extra];
}

function runMysql(mysqlPath, db, sql, database = null) {
  const args = mysqlArgs(db, [database ? database : '', '--batch', '--skip-column-names', '--execute', sql])
    .filter((value) => value !== '');
  return spawnSync(mysqlPath, args, {
    env: { ...process.env, MYSQL_PWD: db.password },
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 50,
  });
}

function mysqlQueryScalar(mysqlPath, db, sql, database = null) {
  const result = runMysql(mysqlPath, db, sql, database);
  if (result.status !== 0) {
    throw new Error(result.stderr.slice(0, 500) || `mysql query failed: ${sql}`);
  }
  return result.stdout.trim().split(/\s+/)[0] ?? '';
}

fs.mkdirSync(backupDir, { recursive: true });

const fileEnv = parseEnvFile(path.join(root, '.env'));
const databaseUrl = envValue('DATABASE_URL', fileEnv);
const allowBackup = process.env.RADSHIELD_ALLOW_DB_BACKUP === '1';
const allowRestore = process.env.RADSHIELD_ALLOW_DB_RESTORE_PROBE === '1';
const keepRestoreDb = process.env.RADSHIELD_KEEP_RESTORE_DB === '1';
const mysqlBinDir = envValue('MYSQL_BIN_DIR', fileEnv);
const configuredRestoreDb = envValue('RADSHIELD_RESTORE_DB_NAME', fileEnv) || 'radshield_restore_probe';
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
const db = parseMysqlUrl(databaseUrl);
const restoreDbName = db?.database ? configuredRestoreDb.replace(/[^a-zA-Z0-9_]/g, '_') : null;

const manifest = {
  phase: 'F153',
  title: 'Backup/restore DB real',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.db-backup-restore.f153.v1',
  status: 'blocked',
  flags: {
    allowBackup,
    allowRestore,
    keepRestoreDb,
  },
  tools: {
    mysqlPath,
    mysqldumpPath,
  },
  database: db
    ? {
        host: db.host,
        port: db.port,
        database: db.database,
        userPresent: Boolean(db.user),
        passwordPresent: Boolean(db.password),
      }
    : null,
  backup: null,
  restoreProbe: null,
  cleanup: null,
  adminSetup: null,
  safety: [
    'No se imprime password ni DATABASE_URL.',
    'La base original solo se lee con mysqldump.',
    'Restore probe usa base temporal y la elimina al final salvo RADSHIELD_KEEP_RESTORE_DB=1.',
  ],
};

try {
  if (!db) throw new Error('DATABASE_URL missing or invalid');
  if (!mysqlPath || !mysqldumpPath) throw new Error('mysql/mysqldump not found');
  if (!allowBackup) throw new Error('RADSHIELD_ALLOW_DB_BACKUP must be 1');
  if (!allowRestore) throw new Error('RADSHIELD_ALLOW_DB_RESTORE_PROBE must be 1');

  const originalTableCount = Number(mysqlQueryScalar(
    mysqlPath,
    db,
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${db.database.replace(/'/g, "''")}'`,
  ));

  const dump = spawnSync(
    mysqldumpPath,
    ['--host', db.host, '--port', db.port, '--user', db.user, '--single-transaction', '--routines', '--triggers', db.database],
    {
      env: { ...process.env, MYSQL_PWD: db.password },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 300,
    },
  );

  if (dump.status !== 0) {
    throw new Error(`mysqldump failed: ${dump.stderr.slice(0, 800)}`);
  }

  fs.writeFileSync(dumpPath, dump.stdout, 'utf8');
  const sha256 = crypto.createHash('sha256').update(dump.stdout).digest('hex');
  const bytes = Buffer.byteLength(dump.stdout);
  manifest.backup = {
    ok: true,
    file: path.relative(root, dumpPath),
    bytes,
    sha256,
    originalTableCount,
  };

  const schemaExists = Number(mysqlQueryScalar(
    mysqlPath,
    db,
    `SELECT COUNT(*) FROM information_schema.schemata WHERE schema_name='${restoreDbName.replace(/'/g, "''")}'`,
  ));

  if (!schemaExists) {
    const create = runMysql(mysqlPath, db, `CREATE DATABASE \`${restoreDbName}\``);
    if (create.status !== 0) {
      const user = db.user.replace(/'/g, "''");
      const host = db.host === '127.0.0.1' ? '127.0.0.1' : '%';
      const adminSql = [
        '-- F153 restore probe setup. Ejecutar una sola vez con usuario administrador/root.',
        `CREATE DATABASE IF NOT EXISTS \`${restoreDbName}\`;`,
        `GRANT ALL PRIVILEGES ON \`${restoreDbName}\`.* TO '${user}'@'${host}';`,
        `GRANT ALL PRIVILEGES ON \`${restoreDbName}\`.* TO '${user}'@'localhost';`,
        'FLUSH PRIVILEGES;',
        '',
      ].join('\n');
      fs.writeFileSync(adminSqlPath, adminSql, 'utf8');
      manifest.adminSetup = {
        required: true,
        file: path.relative(root, adminSqlPath),
        reason: create.stderr.slice(0, 800),
      };
      throw new Error(`restore DB create failed: ${create.stderr.slice(0, 800)}`);
    }
  } else {
    const clear = runMysql(mysqlPath, db, `DROP DATABASE \`${restoreDbName}\`; CREATE DATABASE \`${restoreDbName}\``);
    if (clear.status !== 0) {
      throw new Error(`restore DB reset failed: ${clear.stderr.slice(0, 800)}`);
    }
  }

  const restore = spawnSync(mysqlPath, mysqlArgs(db, [restoreDbName]), {
    env: { ...process.env, MYSQL_PWD: db.password },
    input: dump.stdout,
    encoding: 'utf8',
    maxBuffer: 1024 * 1024 * 100,
  });

  if (restore.status !== 0) {
    manifest.restoreProbe = {
      ok: false,
      database: restoreDbName,
      reason: restore.stderr.slice(0, 800),
    };
    throw new Error('restore probe failed');
  }

  const restoredTableCount = Number(mysqlQueryScalar(
    mysqlPath,
    db,
    `SELECT COUNT(*) FROM information_schema.tables WHERE table_schema='${restoreDbName.replace(/'/g, "''")}'`,
  ));

  manifest.restoreProbe = {
    ok: restoredTableCount === originalTableCount,
    database: restoreDbName,
    originalTableCount,
    restoredTableCount,
    tableCountMatches: restoredTableCount === originalTableCount,
  };

  if (!manifest.restoreProbe.ok) {
    throw new Error('restore table count mismatch');
  }

  if (keepRestoreDb) {
    manifest.cleanup = { ok: true, kept: true, database: restoreDbName };
  } else {
    const drop = runMysql(mysqlPath, db, `DROP DATABASE IF EXISTS \`${restoreDbName}\``);
    manifest.cleanup = {
      ok: drop.status === 0,
      kept: false,
      database: restoreDbName,
      reason: drop.status === 0 ? null : drop.stderr.slice(0, 800),
    };
    if (drop.status !== 0) throw new Error('cleanup drop restore DB failed');
  }

  manifest.status = 'ready';
} catch (error) {
  manifest.status = manifest.backup?.ok ? 'backup-ready-restore-gated' : 'blocked';
  manifest.error = error instanceof Error ? error.message : String(error);
  if (restoreDbName && manifest.restoreProbe?.database && !keepRestoreDb && mysqlPath && db) {
    const drop = runMysql(mysqlPath, db, `DROP DATABASE IF EXISTS \`${restoreDbName}\``);
    manifest.cleanup = {
      ok: drop.status === 0,
      kept: false,
      database: restoreDbName,
      reason: drop.status === 0 ? null : drop.stderr.slice(0, 800),
    };
  }
}

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F153 - Backup/Restore DB Real',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  '',
  '## Backup',
  '',
  manifest.backup?.ok
    ? `- OK ${manifest.backup.file} (${manifest.backup.bytes} bytes, sha256 ${manifest.backup.sha256})`
    : `- Pendiente: ${manifest.error || 'sin backup'}`,
  '',
  '## Restore Probe',
  '',
  manifest.restoreProbe?.ok
    ? `- OK ${manifest.restoreProbe.database}: ${manifest.restoreProbe.restoredTableCount}/${manifest.restoreProbe.originalTableCount} tablas`
    : `- Pendiente/Fallo: ${manifest.restoreProbe?.reason || manifest.error || 'sin restore'}`,
  manifest.adminSetup?.required ? `- Setup admin requerido: ${manifest.adminSetup.file}` : '- Setup admin: no requerido.',
  '',
  '## Cleanup',
  '',
  manifest.cleanup
    ? `- ${manifest.cleanup.ok ? 'OK' : 'WARN'} ${manifest.cleanup.kept ? 'base temporal conservada' : 'base temporal eliminada'}: ${manifest.cleanup.database}`
    : '- Sin cleanup requerido.',
  '',
  '## Seguridad',
  '',
  ...manifest.safety.map((item) => `- ${item}`),
  '',
  'Siguiente: F154 smoke URL final.',
  '',
].join('\n'), 'utf8');

console.log(`F153 DB backup/restore written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status !== 'ready') process.exit(1);
