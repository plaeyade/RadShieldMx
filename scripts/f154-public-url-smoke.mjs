import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f154_public_url_smoke');
const jsonPath = path.join(outDir, 'f154_public_url_smoke.json');
const mdPath = path.join(root, 'outputs', 'fase_154_public_url_smoke.md');
const f153Path = path.join(root, 'outputs', 'f153_db_backup_restore', 'f153_db_backup_restore.json');

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

function safeOrigin(raw) {
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return 'invalid-url';
  }
}

function readJson(file) {
  return fs.existsSync(file) ? JSON.parse(fs.readFileSync(file, 'utf8')) : null;
}

const fileEnv = parseEnvFile(path.join(root, '.env'));
const publicUrl = envValue('PUBLIC_DEPLOY_URL', fileEnv) || envValue('PLAYWRIGHT_TEST_BASE_URL', fileEnv);
const allowPublicSmoke = process.env.RADSHIELD_ALLOW_PUBLIC_SMOKE === '1';
const allowOfflineWaiver = process.env.RADSHIELD_ALLOW_OFFLINE_RELEASE_WAIVER === '1';
const f153 = readJson(f153Path);
const f153Ready = f153?.status === 'ready';
const f153BackupOk = Boolean(f153?.backup?.ok);
const distReady = fs.existsSync(path.join(root, 'dist', 'index.html'));
const playwright = path.join(root, 'node_modules', '.bin', process.platform === 'win32' ? 'playwright.cmd' : 'playwright');

fs.mkdirSync(outDir, { recursive: true });

const manifest = {
  phase: 'F154',
  title: 'Smoke URL final',
  generatedAt: new Date().toISOString(),
  schema: 'radshield-mx.public-url-smoke.f154.v1',
  status: 'gated',
  publicUrlOrigin: safeOrigin(publicUrl),
  allowPublicSmoke,
  allowOfflineWaiver,
  prerequisites: {
    distReady,
    f153Status: f153?.status ?? 'missing',
    f153BackupOk,
    f153RestoreReady: f153Ready,
    f153RestoreWaived: allowOfflineWaiver && f153BackupOk,
  },
  command: 'RADSHIELD_ALLOW_PUBLIC_SMOKE=1 PUBLIC_DEPLOY_URL=https://<url-final> npm run prepare:f154:public-smoke',
  result: null,
  blockingReasons: [],
};

if (!distReady) manifest.blockingReasons.push('dist/index.html missing');
if (!publicUrl) manifest.blockingReasons.push('PUBLIC_DEPLOY_URL or PLAYWRIGHT_TEST_BASE_URL missing');
if (!allowPublicSmoke) manifest.blockingReasons.push('RADSHIELD_ALLOW_PUBLIC_SMOKE is not 1');
if (!f153Ready && !(allowOfflineWaiver && f153BackupOk)) {
  manifest.blockingReasons.push('F153 restore probe is not ready');
}

try {
  if (manifest.blockingReasons.length > 0) {
    manifest.status = publicUrl && distReady ? 'ready-to-run' : 'gated';
    manifest.result = { ok: false, reason: manifest.blockingReasons.join(' | ') };
  } else {
    const result = spawnSync(playwright, ['test', 'e2e/f134-release-candidate.spec.ts', '--project=chromium'], {
      cwd: root,
      env: { ...process.env, PLAYWRIGHT_TEST_BASE_URL: publicUrl },
      encoding: 'utf8',
      maxBuffer: 1024 * 1024 * 50,
      shell: process.platform === 'win32',
    });
    manifest.status = result.status === 0 ? 'ready' : 'gated';
    manifest.result = {
      ok: result.status === 0,
      exitCode: result.status,
      stdoutTail: result.stdout.slice(-3000),
      stderrTail: result.stderr.slice(-3000),
    };
    if (result.status !== 0) manifest.blockingReasons.push('Playwright smoke failed');
  }
} catch (error) {
  manifest.status = 'gated';
  manifest.result = { ok: false, reason: error instanceof Error ? error.message : String(error) };
  manifest.blockingReasons.push(manifest.result.reason);
}

fs.writeFileSync(jsonPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
fs.writeFileSync(mdPath, [
  '# F154 - Smoke URL Final',
  '',
  `Generado: ${manifest.generatedAt}`,
  '',
  `Estado: **${manifest.status}**`,
  `URL: ${manifest.publicUrlOrigin || 'pendiente'}`,
  '',
  '## Prerrequisitos',
  '',
  `- dist: ${manifest.prerequisites.distReady ? 'OK' : 'PENDIENTE'}`,
  `- F153 backup: ${manifest.prerequisites.f153BackupOk ? 'OK' : 'PENDIENTE'}`,
  `- F153 restore: ${manifest.prerequisites.f153RestoreReady ? 'OK' : manifest.prerequisites.f153RestoreWaived ? 'WAIVED' : 'PENDIENTE'}`,
  '',
  '## Resultado',
  '',
  manifest.result?.ok ? '- Smoke publico OK.' : `- Bloqueado: ${manifest.result?.reason || 'sin resultado'}`,
  '',
  '## Bloqueos',
  '',
  ...(manifest.blockingReasons.length ? manifest.blockingReasons.map((item) => `- ${item}`) : ['- Ninguno.']),
  '',
  `Comando: \`${manifest.command}\``,
  '',
].join('\n'), 'utf8');

console.log(`F154 public URL smoke written: ${path.relative(root, jsonPath)}`);
console.log(`Status: ${manifest.status}`);

if (manifest.status !== 'ready') process.exit(1);
