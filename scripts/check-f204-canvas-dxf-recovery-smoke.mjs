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
  console.error('F204 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F204 smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const dxfFixture = `0
SECTION
2
ENTITIES
0
LINE
8
WALL_PRIMARY_200MM
10
100
20
100
11
500
21
100
0
LINE
8
WALL_SECONDARY_200MM
10
500
20
100
11
500
21
420
0
LWPOLYLINE
8
CONTROL_ROOM_CONCRETE
90
4
70
1
10
120
20
140
10
300
20
140
10
300
20
300
10
120
20
300
0
ENDSEC
0
EOF
`;

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
  phase: 'F204',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f204_canvas_dxf_recovery_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function visible(page, testId) {
  return page.getByTestId(testId).isVisible().catch(() => false);
}

let browser;
try {
  const port = await listen();
  result.url = `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1500);

  record('welcome screen not blocking by default', !(await page.locator('.welcome-panel').isVisible().catch(() => false)));
  record('sidebar visible for fresh user', await visible(page, 'f186-sidebar-stable-width'));
  record('canvas visible for fresh user', await visible(page, 'f100-main-floorplan-canvas'));
  record('CAD toolbar visible for fresh user', await visible(page, 'f191-pyrate-inspired-toolbar'));

  await page.getByRole('button', { name: /Archivo/i }).click();
  await page.getByText(/Importar DXF/i).first().click();
  await page.waitForTimeout(700);
  record('DXF viewer opened', await page.getByText(/Visor DXF/i).first().isVisible().catch(() => false));

  await page.locator('input[accept=".dxf,.dwg"]').setInputFiles({
    name: 'f204-smoke-room.dxf',
    mimeType: 'application/dxf',
    buffer: Buffer.from(dxfFixture, 'utf8'),
  });
  await page.waitForTimeout(900);
  record('DXF apply button enabled', await page.getByTestId('dxf-apply-to-canvas').isEnabled().catch(() => false));
  record('DXF mapped barrier count visible', await page.getByText(/barreras/i).first().isVisible().catch(() => false));
  await page.getByTestId('dxf-apply-to-canvas').click();
  await page.waitForTimeout(1200);

  record('DXF dialog closes after applying', !(await page.getByText(/Visor DXF/i).first().isVisible().catch(() => false)));
  record('canvas remains visible after DXF apply', await visible(page, 'f100-main-floorplan-canvas'));
  record('sidebar remains visible after DXF apply', await visible(page, 'f186-sidebar-stable-width'));
  await page.screenshot({ path: result.screenshot, fullPage: false });

  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f204_canvas_dxf_recovery_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F204 - Canvas/DXF Recovery Smoke',
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
writeFileSync(join(outputsDir, 'fase_204_canvas_dxf_recovery_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F204 canvas/DXF smoke failed. See outputs/f204_canvas_dxf_recovery_smoke_result.json');
  process.exit(1);
}

console.log('F204 canvas/DXF recovery smoke OK');
