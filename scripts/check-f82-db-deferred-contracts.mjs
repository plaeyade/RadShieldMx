import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import process from 'node:process';

const root = process.cwd();

function read(path) {
  return existsSync(path) ? readFileSync(path, 'utf8') : '';
}

const files = {
  updateApp: resolve(root, 'src/sections/dialogs/UpdateAppDialog.tsx'),
  f81Runbook: resolve(root, 'F81_DOCKER_DESKTOP_DB_RUNBOOK.md'),
  f81Report: resolve(root, 'outputs/fase_81_database_url.md'),
  f82Report: resolve(root, 'outputs/fase_82_db_deferred_continuity.md'),
  packageJson: resolve(root, 'package.json'),
};

const pkg = JSON.parse(read(files.packageJson) || '{}');

const checks = [
  {
    name: 'f82:update-app-db-deferred-state',
    ok:
      read(files.updateApp).includes('F82 DB-deferred mode') &&
      read(files.updateApp).includes('Diferida') &&
      read(files.updateApp).includes('MySQL live queda diferido'),
  },
  {
    name: 'f82:update-app-no-stale-missing-url-copy',
    ok: !read(files.updateApp).includes('Sin URL'),
  },
  {
    name: 'f82:f81-runbook-cloudfront-fallbacks',
    ok:
      read(files.f81Runbook).includes('production.cloudfront.docker.com') &&
      read(files.f81Runbook).includes('docker load -i') &&
      read(files.f81Runbook).includes('existing MySQL 8') &&
      read(files.f81Runbook).includes('compatible server'),
  },
  {
    name: 'f82:f81-report-host-failure-captured',
    ok:
      read(files.f81Report).includes('production.cloudfront.docker.com') &&
      read(files.f81Report).includes('no es problema de schema ni de `DATABASE_URL`'),
  },
  {
    name: 'f82:continuity-report-written',
    ok:
      read(files.f82Report).includes('F82') &&
      read(files.f82Report).includes('DB diferida') &&
      read(files.f82Report).includes('retomar MySQL'),
  },
  {
    name: 'f82:package-script-present',
    ok: pkg.scripts?.['test:f82:db-deferred'] === 'node scripts/check-f82-db-deferred-contracts.mjs',
  },
];

const failed = checks.filter((check) => !check.ok);
const output = {
  phase: 'F82',
  ok: failed.length === 0,
  checks,
  failed,
};

console.log(JSON.stringify(output, null, 2));

if (failed.length > 0) {
  process.exit(1);
}
