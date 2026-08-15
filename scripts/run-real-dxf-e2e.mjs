import { spawn } from 'node:child_process';
import http from 'node:http';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const host = '127.0.0.1';
const port = Number(process.env.REAL_DXF_E2E_PORT || 4178);
const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || `http://${host}:${port}/`;

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

async function waitFor(url, timeoutMs = 45_000) {
  const start = Date.now();
  while (Date.now() - start < timeoutMs) {
    if (await requestOk(url)) return true;
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
  return false;
}

function nodeScript(relativePath) {
  return path.join(root, relativePath);
}

let previewProcess = null;
let startedPreview = false;

try {
  if (process.env.REAL_DXF_E2E_SKIP_BUILD !== '1') {
    const buildProcess = spawn(process.execPath, [
      nodeScript('node_modules/vite/bin/vite.js'),
      'build',
      '--configLoader',
      'runner',
    ], {
      cwd: root,
      stdio: 'inherit',
      windowsHide: true,
      env: { ...process.env },
    });
    const buildCode = await new Promise((resolve) => {
      buildProcess.on('exit', (exitCode) => resolve(exitCode ?? 1));
    });
    if (Number(buildCode) !== 0) {
      throw new Error(`Vite build failed before real DXF E2E (exit ${buildCode})`);
    }
  }

  const alreadyRunning = await requestOk(baseUrl);
  if (!alreadyRunning) {
    previewProcess = spawn(process.execPath, [
      nodeScript('node_modules/vite/bin/vite.js'),
      'preview',
      '--configLoader',
      'runner',
      '--host',
      host,
      '--port',
      String(port),
    ], {
      cwd: root,
      stdio: ['ignore', 'pipe', 'pipe'],
      windowsHide: true,
      env: { ...process.env },
    });
    startedPreview = true;
    previewProcess.stdout.on('data', (chunk) => process.stdout.write(chunk));
    previewProcess.stderr.on('data', (chunk) => process.stderr.write(chunk));
    const ready = await waitFor(baseUrl);
    if (!ready) throw new Error(`Vite preview did not become ready at ${baseUrl}`);
  } else {
    console.log(`[real-dxf-e2e] Reusing existing preview at ${baseUrl}`);
  }

  const playwrightCli = nodeScript('node_modules/@playwright/test/cli.js');
  const testProcess = spawn(process.execPath, [
    playwrightCli,
    'test',
    'e2e/real-dxf-heavy-import.spec.ts',
    '--project=chromium',
    '--workers=1',
    '--reporter=list',
  ], {
    cwd: root,
    stdio: 'inherit',
    windowsHide: true,
    env: {
      ...process.env,
      PLAYWRIGHT_TEST_BASE_URL: baseUrl,
      PLAYWRIGHT_NO_WEBSERVER: '1',
    },
  });

  const code = await new Promise((resolve) => {
    testProcess.on('exit', (exitCode) => resolve(exitCode ?? 1));
  });
  process.exitCode = Number(code);
} catch (error) {
  console.error(`[real-dxf-e2e] ${error instanceof Error ? error.message : String(error)}`);
  process.exitCode = 1;
} finally {
  if (startedPreview && previewProcess && !previewProcess.killed) {
    previewProcess.kill();
  }
}
