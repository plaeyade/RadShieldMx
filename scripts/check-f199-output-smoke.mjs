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
  console.error('F199 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F199 smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const surfaces = [
  {
    id: 'memoria-ai',
    opener: 'e2e-open-memoria-ai',
    signals: ['memoria-evidence-snapshot', 'f125-memoria-evidence-gate', 'f146-material-report-appendix-memoria', 'f149-normative-numeric-qa-memoria', 'f149c-monte-carlo-gateway-memoria', 'f208-canvas-reporting-memoria'],
  },
  {
    id: 'pdf-report',
    opener: 'e2e-open-pdf-report',
    signals: ['pdf-report-dialog', 'pdf-report-evidence-f76', 'f146-material-report-appendix', 'f149-f149b-pdf-export-smoke', 'f149c-monte-carlo-gateway-pdf', 'f208-canvas-reporting-pdf'],
  },
  {
    id: 'cnsns-report',
    opener: 'e2e-open-cnsns-report',
    signals: ['Generar Memoria Analitica CNSNS'],
  },
  {
    id: 'evidence-pack',
    opener: 'e2e-open-evidence-pack',
    signals: ['f93-citation-ledger-summary', 'f125-calculation-evidence-gate', 'f126-release-evidence-hardening', 'f149c-monte-carlo-gateway-evidence', 'f208-canvas-reporting-evidence'],
  },
  {
    id: 'cnsns-checklist',
    opener: 'e2e-open-cnsns-checklist',
    signals: ['Checklist CNSNS'],
  },
  {
    id: 'regulatory-report',
    opener: 'e2e-open-regulatory-report',
    signals: ['regulatory-report-dialog', 'regulatory-report-evidence-f76'],
  },
  {
    id: 'batch-report-exporter',
    opener: 'e2e-open-batch-report-exporter',
    signals: ['batch-report-exporter-dialog'],
  },
];

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
  phase: 'F199',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f199_output_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function primePage(page) {
  await page.addInitScript(() => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_mosaic', '1');
    localStorage.setItem('radshield-e2e-controls', 'true');
    localStorage.removeItem('radshield_canvas_panels_f188');
    localStorage.removeItem('radshield_canvas_workflow_dock_f188');
    localStorage.removeItem('radshield_sidebar_width_f188');
  });
}

async function checkCanvasGuards(page, suffix = '') {
  const sidebar = await page.getByTestId('f186-sidebar-stable-width').isVisible().catch(() => false);
  const canvas = await page.getByTestId('f100-main-floorplan-canvas').isVisible().catch(() => false);
  const toolbar = await page.getByTestId('f191-pyrate-inspired-toolbar').isVisible().catch(() => false);
  record(`canvas guards ${suffix}`.trim(), sidebar && canvas && toolbar, `sidebar=${sidebar} canvas=${canvas} toolbar=${toolbar}`);
}

async function hasSignal(page, signal) {
  const testIdLocator = page.getByTestId(signal).first();
  try {
    await testIdLocator.waitFor({ state: 'attached', timeout: 6000 });
    return true;
  } catch {
    // Fall through to text search. Some output contracts are title text instead of test ids.
  }
  const textLocator = page.getByText(signal, { exact: false }).first();
  try {
    await textLocator.waitFor({ state: 'attached', timeout: 6000 });
    return true;
  } catch {
    return false;
  }
}

let browser;
try {
  const port = await listen();
  result.url = `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });

  for (const surface of surfaces) {
    const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await primePage(page);
    await page.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });
    await page.waitForTimeout(900);
    await checkCanvasGuards(page, `${surface.id} before open`);
    const openerVisible = await page.getByTestId(surface.opener).isVisible().catch(() => false);
    record(`${surface.id} opener visible`, openerVisible, surface.opener);
    if (openerVisible) {
      await page.getByTestId(surface.opener).click();
      await page.waitForTimeout(900);
      for (const signal of surface.signals) {
        record(`${surface.id} signal ${signal}`, await hasSignal(page, signal));
      }
      await checkCanvasGuards(page, `${surface.id} after open`);
    }
    if (surface.id === 'evidence-pack') {
      await page.screenshot({ path: result.screenshot, fullPage: false });
    }
    await page.close();
  }

  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f199_output_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F199 - Resultado smoke de salidas',
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
writeFileSync(join(outputsDir, 'fase_199_output_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F199 output smoke failed. See outputs/f199_output_smoke_result.json');
  process.exit(1);
}

console.log('F199 output smoke OK');
