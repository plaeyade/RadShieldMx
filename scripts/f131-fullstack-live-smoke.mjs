import { spawnSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const nodeBin = path.join(process.env.USERPROFILE ?? '', '.cache', 'codex-runtimes', 'codex-primary-runtime', 'dependencies', 'node', 'bin');
const env = {
  ...process.env,
  PATH: `${nodeBin};${process.env.PATH ?? ''}`,
};

const frontendBackendEnv = {
  VITE_ENABLE_BACKEND: 'true',
  VITE_BACKEND_URL: 'http://localhost:3000/api/trpc',
};

const outputDir = path.join(root, 'outputs');
fs.mkdirSync(outputDir, { recursive: true });

const steps = [];

function runStep(name, command, args, extraEnv = {}) {
  const startedAt = new Date().toISOString();
  const result = spawnSync(command, args, {
    cwd: root,
    env: { ...env, ...extraEnv },
    encoding: 'utf8',
    shell: process.platform === 'win32' && command.endsWith('.cmd'),
  });

  const step = {
    name,
    ok: result.status === 0,
    command: [command, ...args].join(' '),
    exitCode: result.status,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: (result.stdout ?? '').trim().slice(-4000),
    stderr: (result.stderr ?? '').trim().slice(-4000),
  };

  steps.push(step);
  if (!step.ok) {
    console.error(`${name} failed with exit ${result.status}`);
    if (step.stdout) console.error(step.stdout);
    if (step.stderr) console.error(step.stderr);
  }

  return step.ok;
}

function runFileCheckStep(name, files) {
  const startedAt = new Date().toISOString();
  const missing = files.filter((file) => !fs.existsSync(path.join(root, file)));
  steps.push({
    name,
    ok: missing.length === 0,
    command: `check files: ${files.join(', ')}`,
    exitCode: missing.length === 0 ? 0 : 1,
    startedAt,
    finishedAt: new Date().toISOString(),
    stdout: missing.length === 0 ? files.join('\n') : '',
    stderr: missing.length > 0 ? `Missing files: ${missing.join(', ')}` : '',
  });
  if (missing.length > 0) {
    console.error(`${name} failed: missing ${missing.join(', ')}`);
  }
  return missing.length === 0;
}

const checks = [
  ['db-live-validation', process.execPath, ['scripts/db-live-validation.mjs']],
  ['backend-bundle-present', 'file-check', ['dist-backend/server/boot.js', 'scripts/build-backend.mjs']],
  ['backend-health', process.execPath, ['scripts/check-backend-health.mjs']],
  ['backend-contracts', process.execPath, ['scripts/check-backend-contracts.mjs']],
  [
    'frontend-build-backend-enabled',
    path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'vite.cmd' : 'vite'),
    ['build', '--configLoader', 'runner'],
    frontendBackendEnv,
  ],
];

let ok = true;
for (const [name, command, args, extraEnv] of checks) {
  const stepOk =
    command === 'file-check'
        ? runFileCheckStep(name, args)
        : runStep(name, command, args, extraEnv);
  ok = stepOk && ok;
  if (!ok) break;
}

const dbValidationStep = steps.find((step) => step.name === 'db-live-validation');
let dbTableChecks = 0;
let dbSeedChecks = 0;
if (dbValidationStep?.stdout) {
  try {
    const parsed = JSON.parse(dbValidationStep.stdout);
    dbTableChecks = parsed.checks?.filter((check) => String(check.name).startsWith('table:') && check.ok).length ?? 0;
    dbSeedChecks = parsed.checks?.filter((check) => !String(check.name).startsWith('table:') && check.ok).length ?? 0;
  } catch {
    // Keep counts at zero; the raw stdout is still persisted for diagnosis.
  }
}

const output = {
  phase: 'F131',
  status: ok ? 'ready' : 'blocked',
  generatedAt: new Date().toISOString(),
  stackMode: 'Frontend Vite + Hono/tRPC API + MySQL 8 Windows live DB',
  databaseTarget: 'radshield@127.0.0.1:3306/radshield_mx_test',
  frontendBackendEnv,
  healthEndpoints: ['/health', '/api/health/db', '/api/trpc/ping'],
  protectedContracts: [
    'auth.me',
    'project.list',
    'simulation.list',
    'dosimetry.listWorkspaces',
    'controlledZone.listPlans',
  ],
  dbTableChecks,
  dbSeedChecks,
  steps,
  blockers: ok ? [] : steps.filter((step) => !step.ok).map((step) => step.name),
};

fs.writeFileSync(path.join(outputDir, 'f131_fullstack_live_smoke.json'), `${JSON.stringify(output, null, 2)}\n`);

const md = [
  '# F131 Full-stack live smoke',
  '',
  `Status: ${output.status}`,
  `Generated: ${output.generatedAt}`,
  `Stack: ${output.stackMode}`,
  `DB: ${output.databaseTarget}`,
  `Frontend env: VITE_ENABLE_BACKEND=${output.frontendBackendEnv.VITE_ENABLE_BACKEND}, VITE_BACKEND_URL=${output.frontendBackendEnv.VITE_BACKEND_URL}`,
  `DB checks: ${output.dbTableChecks} table checks, ${output.dbSeedChecks} seed/data checks`,
  '',
  '## Steps',
  ...output.steps.map((step) => `- ${step.ok ? 'OK' : 'FAIL'} ${step.name}: ${step.command}`),
  '',
  '## Decision',
  ok
    ? 'F131 confirms that the live DB, backend contracts and backend-enabled frontend build are ready for release-candidate persistence smoke.'
    : `F131 is blocked by: ${output.blockers.join(', ')}`,
  '',
];

fs.writeFileSync(path.join(outputDir, 'fase_131_fullstack_live_smoke.md'), md.join('\n'));
console.log(JSON.stringify(output, null, 2));

process.exit(ok ? 0 : 1);
