import fs from 'node:fs';
import net from 'node:net';
import path from 'node:path';

const root = process.cwd();
const outputDir = path.join(root, 'outputs', 'f260_fullstack_db_gate');
const jsonPath = path.join(outputDir, 'f260_fullstack_db_gate.json');
const mdPath = path.join(root, 'outputs', 'fase_260_fullstack_db_gate.md');

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
      hasPassword: Boolean(url.password),
    };
  } catch {
    return null;
  }
}

function checkTcp(host, port, timeoutMs = 1500) {
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

const parsed = parseDatabaseUrl(process.env.DATABASE_URL ?? '');
const tcpReachable = parsed ? await checkTcp(parsed.host, parsed.port) : false;
const backupAllowed = process.env.RADSHIELD_ALLOW_DB_BACKUP === '1';
const restoreProbeAllowed = process.env.RADSHIELD_ALLOW_DB_RESTORE_PROBE === '1';
const backendUrl = process.env.BACKEND_HEALTH_URL || process.env.VITE_BACKEND_URL || '';

const checks = [
  {
    name: 'DATABASE_URL present',
    ok: Boolean(parsed),
    detail: parsed ? `${parsed.username}@${parsed.host}:${parsed.port}/${parsed.database}` : 'missing',
  },
  {
    name: 'DATABASE_URL dialect mysql',
    ok: parsed?.protocol === 'mysql:',
    detail: parsed?.protocol ?? 'missing',
  },
  {
    name: 'database tcp reachable',
    ok: tcpReachable,
    detail: parsed ? `${parsed.host}:${parsed.port}` : 'no database url',
  },
  {
    name: 'backup permission',
    ok: backupAllowed,
    detail: backupAllowed ? 'RADSHIELD_ALLOW_DB_BACKUP=1' : 'RADSHIELD_ALLOW_DB_BACKUP is not enabled',
  },
  {
    name: 'restore probe permission',
    ok: restoreProbeAllowed,
    detail: restoreProbeAllowed ? 'RADSHIELD_ALLOW_DB_RESTORE_PROBE=1' : 'RADSHIELD_ALLOW_DB_RESTORE_PROBE is not enabled',
  },
  {
    name: 'backend health url',
    ok: Boolean(backendUrl),
    detail: backendUrl || 'missing BACKEND_HEALTH_URL or VITE_BACKEND_URL',
  },
];

const ready = checks.every((check) => check.ok);
const manifest = {
  phase: 'F260',
  schema: 'radshield-mx.fullstack-db-gate.f260.v1',
  generatedAt: new Date().toISOString(),
  status: ready ? 'fullstack-db-gate-ready-to-smoke' : 'blocked-by-db-live-gates',
  checks,
  nextCommandsWhenReady: [
    'npm run db:preflight',
    'npm run test:f153:db-backup-restore',
    'npm run test:backend:health',
    'npm run test:f131:fullstack-live',
  ],
  staticReleaseFallback:
    'Keep VITE_ENABLE_BACKEND=false and keep private RAG/DB outside the public static host until this gate is ready.',
};

fs.mkdirSync(outputDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');

const markdown = [
  '# F260 Fullstack DB Gate',
  '',
  `Status: **${manifest.status}**`,
  '',
  '## Checks',
  '',
  ...checks.map((check) => `- ${check.ok ? 'PASS' : 'BLOCKED'} ${check.name}: ${check.detail}`),
  '',
  '## Next Commands When Ready',
  '',
  ...manifest.nextCommandsWhenReady.map((command) => `- ${command}`),
  '',
  `Fallback: ${manifest.staticReleaseFallback}`,
  '',
].join('\n');

fs.writeFileSync(mdPath, markdown, 'utf8');
console.log(JSON.stringify(manifest, null, 2));
