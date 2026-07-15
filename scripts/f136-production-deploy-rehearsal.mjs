import crypto from 'node:crypto';
import { createReadStream, existsSync, readFileSync, statSync, writeFileSync } from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { chromium } from 'playwright';

const root = process.cwd();
const outputsDir = path.join(root, 'outputs');
const packageDir = path.join(outputsDir, 'f135_release_candidate_package');
const distDir = path.join(packageDir, 'dist');
const manifestPath = path.join(packageDir, 'manifest.json');
const port = Number(process.env.F136_REHEARSAL_PORT || 4186);
const baseUrl = `http://127.0.0.1:${port}/`;
const screenshotPath = path.join(outputsDir, 'f136_production_deploy_rehearsal.png');
const jsonPath = path.join(outputsDir, 'f136_production_deploy_rehearsal.json');
const mdPath = path.join(outputsDir, 'fase_136_production_deploy_rehearsal.md');
const checks = [];

function addCheck(name, ok, detail = {}) {
  checks.push({ name, ok, detail });
}

function sha256(file) {
  const hash = crypto.createHash('sha256');
  hash.update(readFileSync(file));
  return hash.digest('hex');
}

function contentType(file) {
  const ext = path.extname(file).toLowerCase();
  return {
    '.html': 'text/html; charset=utf-8',
    '.js': 'application/javascript; charset=utf-8',
    '.css': 'text/css; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.wasm': 'application/wasm',
    '.pdf': 'application/pdf',
  }[ext] || 'application/octet-stream';
}

function safeJoin(base, requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^(\.\.[/\\])+/, '');
  const target = path.join(base, normalized === '/' ? 'index.html' : normalized);
  return target.startsWith(base) ? target : path.join(base, 'index.html');
}

function startStaticServer() {
  const server = http.createServer((req, res) => {
    const requested = new URL(req.url || '/', baseUrl).pathname;
    let target = safeJoin(distDir, requested);
    if (!existsSync(target) || statSync(target).isDirectory()) {
      target = path.join(distDir, 'index.html');
    }
    res.statusCode = 200;
    res.setHeader('Content-Type', contentType(target));
    if (target.includes(`${path.sep}assets${path.sep}`)) {
      res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
    }
    createReadStream(target).pipe(res);
  });

  return new Promise((resolve, reject) => {
    server.once('error', reject);
    server.listen(port, '127.0.0.1', () => resolve(server));
  });
}

async function fetchOk(url, expectedContentType) {
  const response = await fetch(url);
  const type = response.headers.get('content-type') || '';
  return {
    ok: response.ok,
    status: response.status,
    contentType: type,
    contentTypeOk: expectedContentType ? type.includes(expectedContentType) : true,
    text: await response.text(),
  };
}

async function main() {
  if (!existsSync(manifestPath)) throw new Error('F135 package manifest is missing.');
  if (!existsSync(path.join(distDir, 'index.html'))) throw new Error('F135 packaged dist/index.html is missing.');

  const manifest = JSON.parse(readFileSync(manifestPath, 'utf8'));
  addCheck('f135:manifest-ready', manifest.phase === 'F135' && manifest.status === 'ready', {
    phase: manifest.phase,
    status: manifest.status,
  });
  addCheck('f135:dist-index-hash-match', sha256(path.join(distDir, 'index.html')) === manifest.dist?.indexSha256, {
    expected: manifest.dist?.indexSha256,
    actual: sha256(path.join(distDir, 'index.html')),
  });

  const server = await startStaticServer();
  let browser;
  try {
    const index = await fetchOk(baseUrl, 'text/html');
    addCheck('http:index-served', index.ok && index.contentTypeOk && index.text.includes('RadShield-MX'), {
      status: index.status,
      contentType: index.contentType,
    });

    const manifestResponse = await fetchOk(new URL('manifest.json', baseUrl), 'application/json');
    addCheck('http:manifest-served', manifestResponse.ok && manifestResponse.contentTypeOk, {
      status: manifestResponse.status,
      contentType: manifestResponse.contentType,
    });

    const manual = await fetchOk(new URL('manual_usuario.html', baseUrl), 'text/html');
    addCheck('http:manual-served', manual.ok && manual.contentTypeOk, {
      status: manual.status,
      contentType: manual.contentType,
    });

    const fallback = await fetchOk(new URL('release/rehearsal/deep-link', baseUrl), 'text/html');
    addCheck('http:spa-fallback-served', fallback.ok && fallback.contentTypeOk && fallback.text.includes('RadShield-MX'), {
      status: fallback.status,
      contentType: fallback.contentType,
    });

    browser = await chromium.launch({ channel: 'chrome' });
    const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
    const consoleErrors = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') consoleErrors.push(msg.text());
    });
    await page.addInitScript(() => {
      localStorage.removeItem('radshield_backend_url');
      localStorage.removeItem('radshield_session_token');
      localStorage.setItem('radshield-tour-completed', 'true');
      localStorage.setItem('radshield_privacy_consent', 'true');
      localStorage.setItem('radshield_welcome_dismissed', 'true');
      localStorage.setItem('radshield_mosaic', '1');
    });
    await page.goto(baseUrl, { waitUntil: 'networkidle' });
    const title = await page.title();
    const archivoVisible = await page.getByRole('button', { name: /Archivo/i }).isVisible({ timeout: 15000 }).catch(() => false);
    const updateVisible = await page.getByRole('button', { name: /Update Center/i }).isVisible({ timeout: 5000 }).catch(() => false);
    addCheck('browser:title', /RadShield-MX/i.test(title), { title });
    addCheck('browser:shell-archivo-visible', archivoVisible);
    addCheck('browser:update-center-button-visible', updateVisible);
    addCheck('browser:no-console-errors', consoleErrors.length === 0, { consoleErrors });
    await page.screenshot({ path: screenshotPath, fullPage: true });
    addCheck('evidence:screenshot-created', existsSync(screenshotPath), { path: screenshotPath });
  } finally {
    if (browser) await browser.close();
    await new Promise((resolve) => server.close(resolve));
  }

  const ready = checks.every((check) => check.ok);
  const output = {
    phase: 'F136',
    status: ready ? 'ready' : 'blocked',
    generatedAt: new Date().toISOString(),
    rehearsalMode: 'static-server-from-f135-package',
    baseUrl,
    packageSource: 'outputs/f135_release_candidate_package/dist',
    checks,
    evidence: [
      'outputs/f136_production_deploy_rehearsal.json',
      'outputs/fase_136_production_deploy_rehearsal.md',
      'outputs/f136_production_deploy_rehearsal.png',
    ],
    publicDeployDecision: ready
      ? 'Local production deploy rehearsal passed. Public deployment remains gated by hosting, secrets, DB backup and final URL smoke.'
      : 'Public deployment blocked until local production rehearsal passes.',
    nextPhase: ready ? 'F137 production cutover checklist or hardening backlog execution' : 'Resolve F136 blockers',
  };

  writeFileSync(jsonPath, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  writeFileSync(
    mdPath,
    [
      '# F136 Production Deploy Rehearsal',
      '',
      `Status: ${output.status}`,
      `Generated: ${output.generatedAt}`,
      `Base URL: ${output.baseUrl}`,
      `Package source: ${output.packageSource}`,
      '',
      '## Checks',
      ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
      '',
      '## Decision',
      output.publicDeployDecision,
      '',
      `Next: ${output.nextPhase}`,
      '',
    ].join('\n'),
    'utf8',
  );

  console.log(`F136 production deploy rehearsal ${output.status}: ${baseUrl}`);
  if (!ready) process.exit(1);
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
