import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f151_prepublish_hardening');
const jsonPath = path.join(outDir, 'public_url_smoke.json');

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

const fileEnv = parseEnvFile(path.join(root, '.env'));
const publicUrl = process.env.PUBLIC_DEPLOY_URL || process.env.PLAYWRIGHT_TEST_BASE_URL || fileEnv.PUBLIC_DEPLOY_URL || fileEnv.PLAYWRIGHT_TEST_BASE_URL || '';
const allow = process.env.RADSHIELD_ALLOW_PUBLIC_SMOKE === '1';
const playwright = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright');

fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  phase: 'F151',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.public-url-smoke.f151.v1',
  status: 'gated',
  publicUrlOrigin: null,
  allowPublicSmoke: allow,
  command: 'RADSHIELD_ALLOW_PUBLIC_SMOKE=1 PUBLIC_DEPLOY_URL=https://<url-final> npm run prepublish:smoke-url',
  result: null,
};

try {
  if (!publicUrl) {
    manifest.result = { ok: false, reason: 'PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL missing' };
  } else if (!allow) {
    manifest.publicUrlOrigin = new URL(publicUrl).origin;
    manifest.status = 'ready-to-run';
    manifest.result = { ok: false, reason: 'RADSHIELD_ALLOW_PUBLIC_SMOKE is not 1' };
  } else {
    manifest.publicUrlOrigin = new URL(publicUrl).origin;
    const result = spawnSync(playwright, ['test', 'e2e/f134-release-candidate.spec.ts', '--project=chromium'], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_TEST_BASE_URL: publicUrl },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      shell: process.platform === 'win32',
    });
    manifest.status = result.status === 0 ? 'pass' : 'gated';
    manifest.result = {
      ok: result.status === 0,
      exitCode: result.status,
      stdoutTail: result.stdout.slice(-2000),
      stderrTail: result.stderr.slice(-2000),
    };
  }
} catch (error) {
  manifest.status = 'gated';
  manifest.result = { ok: false, reason: error instanceof Error ? error.message : String(error) };
}

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`F151 public URL smoke manifest written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status === 'gated') process.exit(1);
