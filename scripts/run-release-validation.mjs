import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const isWindows = process.platform === 'win32';

function bin(name) {
  return path.join(root, 'node_modules', '.bin', isWindows ? `${name}.cmd` : name);
}

function psLine(line) {
  return ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-Command', line];
}

function run(command, args, options = {}) {
  const { allowFailure = false, env = {} } = options;
  const needsShell = isWindows && command.endsWith('.cmd');
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      env: { ...process.env, ...env },
      stdio: 'inherit',
      shell: needsShell,
    });

    child.on('error', reject);
    child.on('exit', (code) => {
      if (code === 0 || allowFailure) {
        resolve(code ?? 0);
        return;
      }
      reject(new Error(`${command} ${args.join(' ')} exited with ${code}`));
    });
  });
}

function runLine(line, options = {}) {
  if (!isWindows) {
    return run('sh', ['-c', line], options);
  }
  return run('powershell.exe', psLine(line), options);
}

function runNodeScript(script, options = {}) {
  return run(process.execPath, [script], options);
}

function runNodeBin(relativePath, args = [], options = {}) {
  return run(process.execPath, [path.join(root, relativePath), ...args], options);
}

function requestOk(url) {
  return new Promise((resolve) => {
    const req = http.get(url, (res) => {
      res.resume();
      resolve(Boolean(res.statusCode && res.statusCode >= 200 && res.statusCode < 500));
    });
    req.on('error', () => resolve(false));
    req.setTimeout(1000, () => {
      req.destroy();
      resolve(false);
    });
  });
}

async function waitFor(url, timeoutMs = 15000) {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    if (await requestOk(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

async function main() {
  if (!existsSync(path.join(root, 'node_modules'))) {
    throw new Error('node_modules not found. Install dependencies before running release validation.');
  }

  console.log('\n[release] TypeScript server');
  await runNodeBin('node_modules/typescript/bin/tsc', ['-p', 'tsconfig.server.json', '--pretty', 'false']);

  console.log('\n[release] TypeScript app');
  await runNodeBin('node_modules/typescript/bin/tsc', ['-p', 'tsconfig.app.json', '--pretty', 'false']);

  if (process.env.RADSHIELD_FULL_BUILD_VALIDATION === '1') {
    console.log('\n[release] Frontend production build');
    // On this Windows sandbox, Vite's .cmd shim resolves its package-local
    // paths reliably while direct node execution makes esbuild probe above
    // the workspace and hit filesystem ACLs.
    await run(bin('vite'), ['build', '--configLoader', 'runner']);

    console.log('\n[release] Backend build');
    await runNodeScript('scripts/build-backend.mjs');
  } else {
    console.log('\n[release] Frontend/backend builds skipped in orchestrated mode.');
    console.log('[release] Run `.\\node_modules\\.bin\\vite.cmd build` and then `node scripts\\build-backend.mjs` directly for the full build gate.');
    if (!existsSync(path.join(root, 'dist-backend', 'server', 'boot.js'))) {
      throw new Error('dist-backend/server/boot.js is missing. Run the direct backend build before health validation.');
    }
  }

  console.log('\n[release] Backend health checks');
  await runNodeScript('scripts/check-backend-health.mjs');

  console.log('\n[release] Backend auth contracts');
  await runNodeScript('scripts/check-backend-contracts.mjs');

  console.log('\n[release] DB preflight (informational gate)');
  const dbCode = await runNodeScript('scripts/db-preflight.mjs', { allowFailure: true });
  if (dbCode !== 0) {
    console.log('[release] DB preflight is not ready yet; this is expected without Docker/MySQL/DATABASE_URL.');
  }

  const previewUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4174/';
  let previewProcess;
  const alreadyRunning = await requestOk(previewUrl);

  if (!alreadyRunning) {
    console.log(`\n[release] Starting Vite preview at ${previewUrl}`);
    previewProcess = spawn(bin('vite'), ['preview', '--configLoader', 'runner', '--host', '127.0.0.1', '--port', '4174'], {
      cwd: root,
      env: process.env,
      stdio: 'inherit',
      shell: isWindows,
    });
    const ready = await waitFor(previewUrl);
    if (!ready) {
      previewProcess.kill();
      throw new Error(`Vite preview did not become ready at ${previewUrl}`);
    }
  } else {
    console.log(`\n[release] Reusing existing preview at ${previewUrl}`);
  }

  try {
    console.log('\n[release] Playwright chromium smoke/e2e');
    await runNodeBin('node_modules/@playwright/test/cli.js', ['test', '--project=chromium'], {
      env: { PLAYWRIGHT_TEST_BASE_URL: previewUrl },
    });
  } finally {
    if (previewProcess) {
      previewProcess.kill();
    }
  }

  console.log('\n[release] Validation completed.');
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
