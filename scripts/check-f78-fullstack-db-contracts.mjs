import { existsSync, readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');
const readinessPath = join(root, 'outputs', 'f78_db_fullstack', 'f78_fullstack_db_readiness.json');
const readiness = existsSync(readinessPath)
  ? JSON.parse(read('outputs/f78_db_fullstack/f78_fullstack_db_readiness.json'))
  : null;
const pkg = JSON.parse(read('package.json'));
const runbook = read('DB_RECONSTRUCTION_RUNBOOK.md');

const checks = [
  {
    name: 'f78:readiness-generated',
    ok: readiness?.phase === 'F78' && Array.isArray(readiness?.checks),
  },
  {
    name: 'f78:static-db-plan-ready',
    ok: Boolean(readiness?.checks?.find((check) => check.name === 'db:static-plan-ready')?.ok),
  },
  {
    name: 'f78:rag-draft-ready',
    ok: Boolean(readiness?.checks?.find((check) => check.name === 'rag:document-draft-ready')?.ok),
  },
  {
    name: 'f78:live-db-not-armed-without-env',
    ok: readiness?.liveRunnable === false &&
      readiness?.databaseUrlConfigured === false &&
      readiness?.blockers?.some((item) => item.includes('DATABASE_URL')),
  },
  {
    name: 'f78:scripts-registered',
    ok: pkg.scripts?.['prepare:f78:db-fullstack'] === 'node scripts/f78-fullstack-db-readiness.mjs' &&
      pkg.scripts?.['test:f78:db-fullstack'] === 'node scripts/check-f78-fullstack-db-contracts.mjs',
  },
  {
    name: 'f78:runbook-rag-seed-documented',
    ok: runbook.includes('Seed F75/F76 RAG document chunks') &&
      runbook.includes('F76_SEED_LIVE=1'),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F78',
  ok: failed.length === 0,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f78_fullstack_db_contracts.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F78 full-stack DB contracts passed');
