import 'dotenv/config';
import fs from 'node:fs';
import net from 'node:net';
import mysql from 'mysql2/promise';

function redactDatabaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return `${url.username || '<user>'}@${url.hostname}:${url.port || 3306}${url.pathname}`;
  } catch {
    return '<invalid DATABASE_URL>';
  }
}

function parseDatabaseUrl(value) {
  if (!value) return null;
  try {
    const url = new URL(value);
    return {
      protocol: url.protocol,
      host: url.hostname,
      port: Number(url.port || 3306),
      database: url.pathname.replace(/^\//, ''),
      username: url.username,
    };
  } catch {
    return null;
  }
}

function checkTcp(host, port, timeoutMs = 2500) {
  return new Promise((resolve) => {
    const socket = net.createConnection({ host, port });
    const done = (ok) => {
      socket.removeAllListeners();
      socket.destroy();
      resolve(ok);
    };
    socket.setTimeout(timeoutMs);
    socket.once('connect', () => done(true));
    socket.once('timeout', () => done(false));
    socket.once('error', () => done(false));
  });
}

const databaseUrl = process.env.DATABASE_URL ?? '';
const parsed = parseDatabaseUrl(databaseUrl);
const tcpReachable = parsed ? await checkTcp(parsed.host, parsed.port) : false;

let authOk = false;
let serverVersion = null;
let selectedDatabase = null;
let authError = null;

if (parsed && tcpReachable) {
  try {
    const connection = await mysql.createConnection(databaseUrl);
    const [rows] = await connection.query('select version() as version, database() as db');
    serverVersion = rows?.[0]?.version ?? null;
    selectedDatabase = rows?.[0]?.db ?? null;
    await connection.end();
    authOk = true;
  } catch (error) {
    authError = {
      code: error.code ?? 'MYSQL_CONNECTION_ERROR',
      message: error.message,
    };
  }
}

const status = !parsed ? 'missing-url' : !tcpReachable ? 'tcp-blocked' : authOk ? 'ready' : 'auth-blocked';
const output = {
  phase: 'F128',
  generatedAt: new Date().toISOString(),
  status,
  databaseUrlConfigured: Boolean(parsed),
  databaseUrlRedacted: redactDatabaseUrl(databaseUrl),
  dialectOk: parsed?.protocol === 'mysql:',
  tcpReachable,
  authOk,
  serverVersion,
  selectedDatabase,
  migrationAllowed: authOk,
  seedAllowed: authOk,
  authError,
  blockers: [
    ...(!parsed ? ['DATABASE_URL is missing or invalid.'] : []),
    ...(parsed && parsed.protocol !== 'mysql:' ? [`DATABASE_URL dialect is ${parsed.protocol}, expected mysql:.`] : []),
    ...(parsed && !tcpReachable ? [`MySQL TCP is not reachable at ${parsed.host}:${parsed.port}.`] : []),
    ...(parsed && tcpReachable && !authOk ? ['DATABASE_URL credentials were rejected by MySQL.'] : []),
  ],
  windowsMysqlFixSteps: [
    'Open MySQL Workbench or MySQL Shell as an admin/root user.',
    "CREATE DATABASE IF NOT EXISTS radshield_mx_test CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;",
    "CREATE USER IF NOT EXISTS 'radshield'@'localhost' IDENTIFIED BY 'radshield';",
    "CREATE USER IF NOT EXISTS 'radshield'@'127.0.0.1' IDENTIFIED BY 'radshield';",
    "GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'localhost';",
    "GRANT ALL PRIVILEGES ON radshield_mx_test.* TO 'radshield'@'127.0.0.1';",
    'FLUSH PRIVILEGES;',
  ],
  nextCommandsWhenReady: [
    'npm run db:preflight',
    'npm run db:migrate',
    'npm run db:seed',
    'npm run db:validate:live',
  ],
  decision: authOk
    ? 'Windows MySQL authentication is valid; migrations and live seed may proceed.'
    : 'Windows MySQL is not ready for migrations/seed until authentication succeeds.',
};

fs.mkdirSync('outputs', { recursive: true });
fs.writeFileSync('outputs/f128_mysql_windows_validation.json', `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# F128 MySQL Windows Validation',
  '',
  `Generated: ${output.generatedAt}`,
  `Status: ${output.status}`,
  `DATABASE_URL: ${output.databaseUrlRedacted ?? 'missing'}`,
  `TCP reachable: ${output.tcpReachable ? 'yes' : 'no'}`,
  `Auth OK: ${output.authOk ? 'yes' : 'no'}`,
  `Migration allowed: ${output.migrationAllowed ? 'yes' : 'no'}`,
  '',
  '## Blockers',
  ...(output.blockers.length ? output.blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Windows MySQL fix steps',
  ...output.windowsMysqlFixSteps.map((item) => `- ${item}`),
  '',
  '## Next commands when ready',
  ...output.nextCommandsWhenReady.map((item) => `- ${item}`),
  '',
  `Decision: ${output.decision}`,
  '',
].join('\n');
fs.writeFileSync('outputs/fase_128_mysql_windows_validation.md', md);

console.log(JSON.stringify(output, null, 2));

if (!authOk) {
  process.exitCode = 1;
}
