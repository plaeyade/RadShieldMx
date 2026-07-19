import { createReadStream, existsSync, mkdirSync, statSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { extname, join, resolve } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.cwd();
const distRoot = resolve(root, 'dist');
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

if (!existsSync(join(distRoot, 'index.html'))) {
  console.error('F201 smoke requires dist/index.html. Run vite build first.');
  process.exit(1);
}

const mime = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.json': 'application/json',
  '.wasm': 'application/wasm',
};

const chromePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((item) => existsSync(item));

if (!chromePath) {
  console.error('F201 smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const server = createServer((req, res) => {
  let urlPath = decodeURIComponent((req.url ?? '/').split('?')[0] || '/');
  if (urlPath === '/') urlPath = '/index.html';
  let filePath = join(distRoot, urlPath);
  if (!filePath.startsWith(distRoot) || !existsSync(filePath) || statSync(filePath).isDirectory()) {
    filePath = join(distRoot, 'index.html');
  }
  res.setHeader('Content-Type', mime[extname(filePath)] || 'application/octet-stream');
  createReadStream(filePath).pipe(res);
});

function listen() {
  return new Promise((resolveListen) => {
    server.listen(0, '127.0.0.1', () => resolveListen(server.address().port));
  });
}

function closeServer() {
  return new Promise((resolveClose) => server.close(resolveClose));
}

const result = {
  phase: 'F201',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f201_workflow_panel_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function canvasGuards(page, label) {
  const sidebar = await page.getByTestId('f186-sidebar-stable-width').isVisible().catch(() => false);
  const canvas = await page.getByTestId('f100-main-floorplan-canvas').isVisible().catch(() => false);
  const toolbar = await page.getByTestId('f191-pyrate-inspired-toolbar').isVisible().catch(() => false);
  record(`canvas guards ${label}`, sidebar && canvas && toolbar, `sidebar=${sidebar} canvas=${canvas} toolbar=${toolbar}`);
}

let browser;
try {
  const port = await listen();
  result.url = `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_mosaic', '1');
    localStorage.removeItem('radshield_canvas_panels_f188');
    localStorage.removeItem('radshield_canvas_workflow_dock_f188');
    localStorage.removeItem('radshield_canvas_workflow_compact_f201');
    localStorage.removeItem('radshield_sidebar_width_f188');
  });

  await page.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1000);
  await canvasGuards(page, 'initial');

  const panel = page.getByTestId('canvas-workflow-panel');
  record('workflow panel visible initially', await panel.isVisible().catch(() => false));
  const topBox = await panel.boundingBox();
  record('workflow panel starts at top of canvas', Boolean(topBox && topBox.y < 240), topBox ? `y=${topBox.y}` : 'no box');

  await page.getByTestId('f188-workflow-dock-button').click();
  await page.waitForTimeout(250);
  const rightBox = await panel.boundingBox();
  record('workflow panel moves right', Boolean(rightBox && rightBox.x > 1300 && rightBox.y > 40), rightBox ? `x=${rightBox.x} y=${rightBox.y}` : 'no box');

  await page.getByTestId('f188-workflow-dock-button').click();
  await page.waitForTimeout(250);
  const bottomBox = await panel.boundingBox();
  record('workflow panel moves bottom', Boolean(bottomBox && bottomBox.y > 560), bottomBox ? `y=${bottomBox.y}` : 'no box');

  await page.getByTestId('f201-workflow-compact-button').click();
  await page.waitForTimeout(250);
  record('workflow panel compacts body', !(await page.getByTestId('f90-e2e-qa-panel').isVisible().catch(() => false)));
  record('workflow panel header remains visible when compact', await panel.isVisible().catch(() => false));

  await page.getByTestId('f201-workflow-compact-button').click();
  await page.waitForTimeout(250);
  record('workflow panel expands body', await page.getByTestId('f90-e2e-qa-panel').isVisible().catch(() => false));

  await page.getByTestId('f201-workflow-close-button').click();
  await page.waitForTimeout(250);
  record('workflow panel closes', !(await panel.isVisible().catch(() => false)));
  record('workflow restore button appears', await page.getByTestId('f188-hidden-panel-restore').getByText('Flujo').isVisible().catch(() => false));
  await page.getByTestId('f188-hidden-panel-restore').getByText('Flujo').click();
  await page.waitForTimeout(250);
  record('workflow panel restores', await panel.isVisible().catch(() => false));
  await canvasGuards(page, 'after controls');
  await page.screenshot({ path: result.screenshot, fullPage: false });

  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f201_workflow_panel_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const markdown = [
  '# F201 - Workflow Panel Smoke',
  '',
  `- Estado: ${result.ok ? 'OK' : 'FAIL'}`,
  `- URL temporal: ${result.url}`,
  `- Screenshot: ${result.screenshot}`,
  '',
  '## Checks',
  '',
  ...result.checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  '',
].join('\n');
writeFileSync(join(outputsDir, 'fase_201_workflow_panel_smoke_result.md'), `${markdown}\n`, 'utf8');

if (!result.ok) {
  console.error('F201 workflow panel smoke failed. See outputs/f201_workflow_panel_smoke_result.json');
  process.exit(1);
}

console.log('F201 workflow panel smoke OK');
