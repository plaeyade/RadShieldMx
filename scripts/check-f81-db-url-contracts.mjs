import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();
const envPath = resolve(root, '.env');
const preflightPath = resolve(root, 'scripts/db-preflight.mjs');
const planPath = resolve(root, 'scripts/db-reconstruction-plan.mjs');
const livePath = resolve(root, 'scripts/db-live-validation.mjs');
const reportPath = resolve(root, 'outputs/fase_81_database_url.md');
const packagePath = resolve(root, 'package.json');
const dockerRunbookPath = resolve(root, 'F81_DOCKER_DESKTOP_DB_RUNBOOK.md');
const dockerStatusPath = resolve(root, 'outputs/f81_docker_engine_status.json');

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

function readJson(path) {
  try {
    return JSON.parse(read(path));
  } catch {
    return null;
  }
}

const env = read(envPath);
const pkg = JSON.parse(read(packagePath) || '{}');
const dockerStatus = readJson(dockerStatusPath);
const checks = [
  {
    name: 'f81:env-created',
    ok: existsSync(envPath),
  },
  {
    name: 'f81:database-url-local-test',
    ok: env.includes('DATABASE_URL=mysql://radshield:radshield@127.0.0.1:3306/radshield_mx_test'),
  },
  {
    name: 'f81:owner-union-id-seed-admin',
    ok: env.includes('OWNER_UNION_ID=seed-admin'),
  },
  {
    name: 'f81:preflight-loads-dotenv',
    ok: read(preflightPath).startsWith('import "dotenv/config";'),
  },
  {
    name: 'f81:plan-loads-dotenv',
    ok: read(planPath).startsWith('import "dotenv/config";'),
  },
  {
    name: 'f81:live-validation-loads-dotenv',
    ok: read(livePath).startsWith('import "dotenv/config";'),
  },
  {
    name: 'f81:live-validation-clean-error',
    ok: read(livePath).includes('connect ECONNREFUSED') === false &&
      read(livePath).includes('Start a MySQL server matching DATABASE_URL.'),
  },
  {
    name: 'f81:report-written',
    ok: existsSync(reportPath),
  },
  {
    name: 'f81:start-script-present',
    ok: existsSync(resolve(root, 'scripts/f81-start-local-mysql.mjs')) &&
      pkg.scripts?.['db:start:f81'] === 'node scripts/f81-start-local-mysql.mjs',
  },
  {
    name: 'f81:docker-runbook-present',
    ok: read(dockerRunbookPath).includes('Docker Desktop') &&
      read(dockerRunbookPath).includes('docker compose -f docker-compose.db.yml up -d') &&
      read(dockerRunbookPath).includes('.\\scripts\\f81-host-docker-reconstruct.ps1') &&
      read(reportPath).includes('Opcion recomendada: **Docker Desktop + `docker-compose.db.yml`**'),
  },
  {
    name: 'f81:host-powershell-helper-present',
    ok: existsSync(resolve(root, 'scripts/f81-host-docker-reconstruct.ps1')),
  },
  {
    name: 'f81:docker-engine-status-captured',
    ok: dockerStatus?.tools?.docker === true &&
      dockerStatus?.tools?.dockerEngineReachable === false &&
      `${dockerStatus?.tools?.dockerEngineError}\n${dockerStatus?.attemptedStart?.stderr}`.includes('docker_engine') &&
      `${dockerStatus?.tools?.dockerEngineError}\n${dockerStatus?.attemptedStart?.stderr}`.includes('permission denied'),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F81',
  ok: failed.length === 0,
  checks,
  failed,
};

console.log(JSON.stringify(output, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
