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
  console.error('F207 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F207 smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const dxfFixture = `0
SECTION
2
ENTITIES
0
LINE
8
F207_PRIMARY_CONCRETE_240MM
10
80
20
80
11
560
21
80
0
LINE
8
F207_SECONDARY_CONCRETE_180MM
10
560
20
80
11
560
21
440
0
LWPOLYLINE
8
F207_CONTROLLED_ZONE
90
4
70
1
10
140
20
150
10
420
20
150
10
420
20
360
10
140
20
360
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
  phase: 'F207',
  schema: 'radshield-mx.functional-app-qa.f207.v1',
  generatedAt: new Date().toISOString(),
  ok: false,
  status: 'functional-app-qa-pending',
  url: '',
  checks: [],
  screenshots: {
    initial: 'outputs/f207_functional_app_qa_initial.png',
    dxf: 'outputs/f207_functional_app_qa_dxf.png',
    outputs: 'outputs/f207_functional_app_qa_outputs.png',
  },
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function prime(page, controls = false) {
  await page.addInitScript((enableControls) => {
    localStorage.setItem('radshield-tour-completed', 'true');
    localStorage.setItem('radshield_privacy_consent', 'true');
    localStorage.setItem('radshield_welcome_dismissed', 'true');
    localStorage.setItem('radshield_mosaic', '1');
    localStorage.removeItem('radshield_force_welcome');
    localStorage.removeItem('radshield_canvas_panels_f188');
    localStorage.removeItem('radshield_canvas_workflow_dock_f188');
    localStorage.removeItem('radshield_sidebar_width_f188');
    if (enableControls) localStorage.setItem('radshield-e2e-controls', 'true');
    else localStorage.removeItem('radshield-e2e-controls');
  }, controls);
}

async function visible(page, testId) {
  return page.getByTestId(testId).first().isVisible().catch(() => false);
}

async function guardShell(page, prefix) {
  const sidebar = await visible(page, 'f186-sidebar-stable-width');
  const canvas = await visible(page, 'f100-main-floorplan-canvas');
  const toolbar = await visible(page, 'f191-pyrate-inspired-toolbar');
  const workflowPanel = await visible(page, 'canvas-workflow-panel') || await visible(page, 'f188-hidden-panel-restore');
  record(`${prefix} sidebar/canvas/toolbar`, sidebar && canvas && toolbar, `sidebar=${sidebar} canvas=${canvas} toolbar=${toolbar}`);
  record(`${prefix} workflow panel recoverable`, workflowPanel);
}

async function hasSignal(page, signal) {
  if (await page.getByTestId(signal).first().isVisible().catch(() => false)) return true;
  if (await page.getByTestId(signal).first().isEnabled().catch(() => false)) return true;
  return page.getByText(signal, { exact: false }).first().isVisible().catch(() => false);
}

let browser;
try {
  const port = await listen();
  result.url = `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });

  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await prime(page);
  await page.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });
  await page.waitForTimeout(1400);
  record('welcome screen does not block normal startup', !(await page.locator('.welcome-panel').isVisible().catch(() => false)));
  await guardShell(page, 'startup');
  record('F209 dimension schedule visible on canvas', await visible(page, 'f209-canvas-dimension-schedule'));
  record('F210 layer manager visible on canvas', await visible(page, 'f210-canvas-layer-manager'));
  record('F211 equipment symbol schedule visible on canvas', await visible(page, 'f211-canvas-equipment-symbol-schedule'));
  record('F212 heatmap regulatory legend visible on canvas', await visible(page, 'f212-heatmap-regulatory-legend'));
  record('F214 SketchUp canvas reorg visible on canvas', await visible(page, 'f214-sketchup-canvas-reorg'));
  record('F215 canvas scene presets visible on canvas', await visible(page, 'f215-canvas-scene-presets'));
  record('F215 plan/extents scene buttons visible', await visible(page, 'f215-scene-preset-plan') && await visible(page, 'f215-scene-preset-extents'));
  record('F216 mini view manager visible on canvas', await visible(page, 'f216-mini-view-manager'));
  record('F216 zoom/pan indicators visible', await visible(page, 'f216-view-zoom') && await visible(page, 'f216-view-pan'));
  record('F216 save/restore view buttons visible', await visible(page, 'f216-save-view-A') && await visible(page, 'f216-restore-view-A'));
  record('F217 visual export by scene visible on canvas', await visible(page, 'f217-visual-export-by-scene'));
  record('F217 plan/heat scene export rows visible', await visible(page, 'f217-export-scene-plan') && await visible(page, 'f217-export-scene-heat'));
  record('F217 PNG export buttons visible', await visible(page, 'f217-export-png-plan') && await visible(page, 'f217-export-png-structure'));
  await page.screenshot({ path: result.screenshots.initial, fullPage: false });

  await page.getByRole('button', { name: /Archivo/i }).click();
  await page.waitForTimeout(250);
  const archivoItems = ['Nuevo Proyecto', 'Abrir Proyecto', 'Guardar', 'Importar DXF', 'Exportar PDF', 'Exportar Reporte CNSNS'];
  for (const item of archivoItems) {
    record(`Archivo exposes ${item}`, await page.getByText(item, { exact: false }).first().isVisible().catch(() => false));
  }
  await page.getByText(/Importar DXF/i).first().click();
  await page.waitForTimeout(700);
  record('DXF dialog opens from Archivo', await page.getByText(/Visor DXF/i).first().isVisible().catch(() => false));
  await page.locator('input[accept=".dxf,.dwg"]').setInputFiles({
    name: 'f207-functional-room.dxf',
    mimeType: 'application/dxf',
    buffer: Buffer.from(dxfFixture, 'utf8'),
  });
  await page.waitForTimeout(900);
  record('DXF maps barriers before apply', await page.getByText(/barreras/i).first().isVisible().catch(() => false));
  record('DXF apply-to-canvas enabled', await page.getByTestId('dxf-apply-to-canvas').isEnabled().catch(() => false));
  await page.getByTestId('dxf-apply-to-canvas').click();
  await page.waitForTimeout(1200);
  record('DXF dialog closes after apply', !(await page.getByText(/Visor DXF/i).first().isVisible().catch(() => false)));
  await guardShell(page, 'after DXF apply');
  await page.screenshot({ path: result.screenshots.dxf, fullPage: false });

  await page.getByTestId('f109-migrated-reports-dropdown').click();
  const reportsMenuVisible = await page.getByTestId('f109-migrated-reports-menu').isVisible().catch(() => false);
  record('Reportes menu opens', reportsMenuVisible);
  for (const item of ['Memoria IA', 'PDF analitico', 'Reporte CNSNS', 'Evidence Pack bridge']) {
    record(`Reportes exposes ${item}`, await page.getByText(item, { exact: false }).first().isVisible().catch(() => false));
  }
  await page.keyboard.press('Escape');
  await guardShell(page, 'after reports menu');
  await page.close();

  const outputsPage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await prime(outputsPage, true);
  await outputsPage.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });
  await outputsPage.waitForTimeout(900);
  const surfaces = [
    { id: 'memoria-ai', opener: 'e2e-open-memoria-ai', signals: ['memoria-evidence-snapshot', 'f146-material-report-appendix-memoria', 'f208-canvas-reporting-memoria', 'f218-report-handoff-memoria'] },
    { id: 'pdf-report', opener: 'e2e-open-pdf-report', signals: ['pdf-report-dialog', 'f146-material-report-appendix', 'f208-canvas-reporting-pdf', 'f218-report-handoff-pdf'] },
    { id: 'evidence-pack', opener: 'e2e-open-evidence-pack', signals: ['f93-citation-ledger-summary', 'f125-calculation-evidence-gate', 'f208-canvas-reporting-evidence', 'f218-report-handoff-evidence'] },
  ];
  for (const surface of surfaces) {
    await guardShell(outputsPage, `${surface.id} before`);
    record(`${surface.id} opener exists`, await visible(outputsPage, surface.opener));
    await outputsPage.getByTestId(surface.opener).click();
    await outputsPage.waitForTimeout(900);
    for (const signal of surface.signals) {
      record(`${surface.id} signal ${signal}`, await hasSignal(outputsPage, signal));
    }
    await outputsPage.keyboard.press('Escape');
    await outputsPage.waitForTimeout(250);
  }
  await guardShell(outputsPage, 'after output surfaces');
  await outputsPage.screenshot({ path: result.screenshots.outputs, fullPage: false });
  await outputsPage.close();

  result.ok = result.checks.every((check) => check.ok);
  result.status = result.ok ? 'functional-app-qa-pass' : 'functional-app-qa-fail';
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
  result.status = 'functional-app-qa-fail';
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f207_functional_app_qa_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F207 - Functional App QA',
  '',
  `- Estado: ${result.ok ? 'OK' : 'FAIL'}`,
  `- Status: ${result.status}`,
  `- URL temporal: ${result.url}`,
  `- Screenshot inicial: ${result.screenshots.initial}`,
  `- Screenshot DXF: ${result.screenshots.dxf}`,
  `- Screenshot salidas: ${result.screenshots.outputs}`,
  '',
  '## Checks',
  '',
  ...result.checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  '',
].join('\n');
writeFileSync(join(outputsDir, 'fase_207_functional_app_qa.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F207 functional app QA failed. See outputs/f207_functional_app_qa_smoke_result.json');
  process.exit(1);
}

console.log('F207 functional app QA OK');
