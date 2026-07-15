import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outputDir = join(root, 'outputs', 'f78_db_fullstack');
mkdirSync(outputDir, { recursive: true });

function commandPath(name) {
  const result = spawnSync('powershell.exe', [
    '-NoProfile',
    '-Command',
    `(Get-Command ${name} -ErrorAction SilentlyContinue).Source`,
  ], { encoding: 'utf8' });
  return result.status === 0 ? result.stdout.trim() : '';
}

function readJson(path) {
  return existsSync(path) ? JSON.parse(readFileSync(path, 'utf8')) : null;
}

function runNodeScript(script) {
  const node = process.execPath;
  const result = spawnSync(node, [script], {
    cwd: root,
    encoding: 'utf8',
    maxBuffer: 16 * 1024 * 1024,
  });
  let parsed = null;
  try {
    parsed = JSON.parse(result.stdout || '{}');
  } catch {
    parsed = null;
  }
  return {
    status: result.status,
    ok: result.status === 0,
    stdout: result.stdout,
    stderr: result.stderr,
    parsed,
  };
}

const preflight = runNodeScript('scripts/db-preflight.mjs');
const plan = runNodeScript('scripts/db-reconstruction-plan.mjs');
const f75 = readJson(join(root, 'outputs', 'f75_pdf_ingestion_summary.json'));
const f76Seed = readJson(join(root, 'outputs', 'f76_seed', 'f76_seed_document_chunks_report.json'));
const packageJson = JSON.parse(readFileSync(join(root, 'package.json'), 'utf8'));
const envExample = existsSync(join(root, '.env.example'))
  ? readFileSync(join(root, '.env.example'), 'utf8')
  : '';

const tools = {
  docker: commandPath('docker') || null,
  mysql: commandPath('mysql') || null,
  node: process.execPath,
};
const databaseUrlConfigured = Boolean(process.env.DATABASE_URL);
const backendBridgeDocumented = envExample.includes('VITE_ENABLE_BACKEND') ||
  envExample.includes('VITE_BACKEND_URL');
const requiredScripts = [
  'db:preflight',
  'db:reconstruct:plan',
  'db:migrate',
  'db:seed',
  'db:validate:live',
  'build:backend',
  'test:backend:health',
  'db:seed:f76:documents',
];

const checks = [
  {
    name: 'db:static-plan-ready',
    ok: plan.parsed?.checks?.filter((check) =>
      !check.ok && !['DATABASE_URL', 'Docker CLI', 'MySQL CLI'].includes(check.name),
    ).length === 0,
  },
  {
    name: 'db:preflight-blockers-explicit',
    ok: preflight.parsed?.checks?.some((check) => check.name === 'DATABASE_URL' && !check.ok) &&
      preflight.parsed?.checks?.some((check) => check.name === 'Docker CLI' && !check.ok),
  },
  {
    name: 'rag:document-draft-ready',
    ok: f75?.totalChunks === 229 && f76Seed?.chunkCount === 229,
  },
  {
    name: 'backend:scripts-present',
    ok: requiredScripts.every((script) => Boolean(packageJson.scripts?.[script])),
  },
  {
    name: 'frontend:backend-env-documented',
    ok: backendBridgeDocumented,
  },
  {
    name: 'live-db:disarmed',
    ok: !databaseUrlConfigured && process.env.F76_SEED_LIVE !== '1',
  },
];

const failed = checks.filter((check) => !check.ok);
const liveRunnable = databaseUrlConfigured && Boolean(tools.docker || tools.mysql);
const report = {
  phase: 'F78',
  generatedAt: new Date().toISOString(),
  ok: failed.length === 0,
  liveRunnable,
  databaseUrlConfigured,
  tools,
  checks,
  failed,
  blockers: [
    ...(!databaseUrlConfigured ? ['DATABASE_URL missing.'] : []),
    ...(!tools.docker ? ['Docker CLI missing; cannot start local MySQL from this shell.'] : []),
    ...(!tools.mysql ? ['MySQL CLI missing; manual DB inspection unavailable from this shell.'] : []),
  ],
  staticPlan: plan.parsed,
  dbPreflight: preflight.parsed,
  commandsWhenDbAvailable: [
    'docker compose -f docker-compose.db.yml up -d',
    '$env:DATABASE_URL="mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test"',
    'node scripts/db-preflight.mjs',
    'node scripts/db-reconstruction-plan.mjs',
    '.\\node_modules\\.bin\\drizzle-kit.cmd migrate',
    'node scripts/run-seed.mjs',
    'node scripts/db-live-validation.mjs',
    '$env:F76_SEED_LIVE="1"',
    'node scripts/f76-seed-document-chunks.mjs',
    'node scripts/build-backend.mjs',
    'node scripts/check-backend-health.mjs',
    'node scripts/check-backend-contracts.mjs',
  ],
};

writeFileSync(join(outputDir, 'f78_fullstack_db_readiness.json'), `${JSON.stringify(report, null, 2)}\n`, 'utf8');

const lines = [
  '# F78 full-stack DB readiness',
  '',
  `Generated: ${report.generatedAt}`,
  '',
  `Live runnable: ${report.liveRunnable ? 'yes' : 'no'}`,
  '',
  '## Blockers',
  '',
  ...(report.blockers.length ? report.blockers.map((item) => `- ${item}`) : ['- None']),
  '',
  '## Checks',
  '',
  ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'}: ${check.name}`),
  '',
  '## Commands when DB is available',
  '',
  '```powershell',
  ...report.commandsWhenDbAvailable,
  '```',
  '',
];

writeFileSync(join(outputDir, 'f78_fullstack_db_readiness.md'), `${lines.join('\n')}\n`, 'utf8');

if (failed.length > 0) {
  console.error(JSON.stringify(report, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({
  ok: report.ok,
  liveRunnable: report.liveRunnable,
  blockers: report.blockers,
}, null, 2));
