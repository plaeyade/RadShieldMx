import { readFileSync, writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

const root = process.cwd();
const read = (path) => readFileSync(join(root, path), 'utf8');

const files = {
  boot: read('api/boot.ts'),
  security: read('api/lib/security.ts'),
  env: read('api/lib/env.ts'),
  session: read('api/kimi/session.ts'),
  constants: read('contracts/constants.ts'),
  audit: read('api/audit-router.ts'),
  ai: read('api/ai-router.ts'),
  rag: read('api/rag-router.ts'),
  calculation: read('api/calculation-router.ts'),
  report: read('api/report-router.ts'),
  material: read('api/material-router.ts'),
  ml: read('api/ml-router.ts'),
  agent: read('api/agent-router.ts'),
};

function hasNoPublicMutation(source) {
  return !/publicQuery[\s\S]{0,120}\.mutation/.test(source);
}

const checks = [
  {
    name: 'headers:security-middleware-mounted',
    ok: files.boot.includes('securityHeaders') &&
      files.security.includes('X-Content-Type-Options') &&
      files.security.includes('X-Frame-Options') &&
      files.security.includes('X-Request-Id'),
  },
  {
    name: 'auth:session-max-12h',
    ok: files.constants.includes('12 * 60 * 60 * 1000') &&
      files.session.includes('Session.maxAgeMs') &&
      !files.session.includes('1 year'),
  },
  {
    name: 'auth:production-secret-minimum',
    ok: files.env.includes('must be at least 32 characters') &&
      files.env.includes('productionSecret("APP_SECRET")'),
  },
  {
    name: 'routers:no-public-user-data-mutations',
    ok: [
      files.audit,
      files.ai,
      files.rag,
      files.calculation,
      files.report,
      files.material,
      files.ml,
      files.agent,
    ].every(hasNoPublicMutation),
  },
  {
    name: 'rag:ingest-reset-admin-only',
    ok: files.rag.includes('ingest: adminQuery') &&
      files.rag.includes('ingestBatch: adminQuery') &&
      files.rag.includes('reset: adminQuery'),
  },
  {
    name: 'ownership:user-id-forced-from-context',
    ok: files.calculation.includes('ctx.user.unionId') &&
      files.report.includes('ctx.user.unionId') &&
      files.material.includes('ctx.user.unionId') &&
      files.agent.includes('ctx.user.unionId') &&
      !files.calculation.includes('userId: z.string()') &&
      !files.report.includes('userId: z.string()') &&
      !files.material.includes('userId: z.string()'),
  },
  {
    name: 'ai:session-history-namespaced',
    ok: files.ai.includes('`${ctx.user.unionId}:${input.sessionId}`'),
  },
  {
    name: 'ml:reset-admin-only',
    ok: files.ml.includes('reset: adminQuery') &&
      files.ml.includes('dataset: adminQuery') &&
      files.ml.includes('stats: adminQuery'),
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F79',
  ok: failed.length === 0,
  checks,
  failed,
  generatedAt: new Date().toISOString(),
};

mkdirSync(join(root, 'outputs'), { recursive: true });
writeFileSync(join(root, 'outputs', 'f79_security_contracts.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');

if (failed.length > 0) {
  console.error(JSON.stringify(output, null, 2));
  process.exit(1);
}

console.log('F79 security contracts passed');
