import { existsSync, mkdirSync, statSync, writeFileSync, createReadStream } from 'node:fs';
import { createServer } from 'node:http';
import { extname, join, resolve } from 'node:path';
import { createRequire } from 'node:module';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.cwd();
const distRoot = resolve(root, 'dist');
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

if (!existsSync(join(distRoot, 'index.html'))) {
  console.error('F197 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F197 smoke could not find Chrome or Edge executable.');
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

const archivoItems = [
  /Nuevo Proyecto/i,
  /Abrir Proyecto/i,
  /Guardar/i,
  /Importar CSV/i,
  /Importar DXF/i,
  /Importar STEP/i,
  /Exportar CSV/i,
  /Exportar PDF/i,
  /Compartir resultados/i,
  /Exportar Reporte CNSNS/i,
  /Especificaciones Tecnicas/i,
  /Audit Trail/i,
  /Analisis de Logs/i,
  /Glosario/i,
  /Acerca de/i,
];

const result = {
  phase: 'F197',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f197_menu_canvas_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function visibleBox(page, testId) {
  const locator = page.getByTestId(testId).first();
  const visible = await locator.isVisible().catch(() => false);
  const box = visible ? await locator.boundingBox().catch(() => null) : null;
  return { visible, box };
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
    localStorage.removeItem('radshield_sidebar_width_f188');
  });
  await page.goto(result.url, { waitUntil: 'networkidle', timeout: 30000 });

  const continueButton = page.getByText('Continuar', { exact: false });
  if (await continueButton.count()) await continueButton.first().click();
  await page.waitForTimeout(500);
  const blankProject = page.getByText('Nuevo Proyecto en Blanco', { exact: false });
  if (await blankProject.count()) await blankProject.first().click();
  await page.waitForTimeout(1500);

  const sidebar = await visibleBox(page, 'f186-sidebar-stable-width');
  const collapsedSidebar = await visibleBox(page, 'f186-sidebar-collapsed-stable');
  record('sidebar visible or recoverable', sidebar.visible || collapsedSidebar.visible, JSON.stringify({ sidebar, collapsedSidebar }));

  const canvas = await visibleBox(page, 'f100-main-floorplan-canvas');
  record('main floorplan canvas visible', canvas.visible && (canvas.box?.width ?? 0) > 500 && (canvas.box?.height ?? 0) > 300, JSON.stringify(canvas.box));

  const toolbar = await visibleBox(page, 'f191-pyrate-inspired-toolbar');
  record('F191 canvas toolbar visible', toolbar.visible && (toolbar.box?.width ?? 0) > 300, JSON.stringify(toolbar.box));

  const workflowPanel = await visibleBox(page, 'canvas-workflow-panel');
  const restorePanel = await visibleBox(page, 'f188-hidden-panel-restore');
  record('workflow panel visible or restore visible', workflowPanel.visible || restorePanel.visible, JSON.stringify({ workflowPanel, restorePanel }));

  await page.getByRole('button', { name: /Archivo/i }).click();
  await page.waitForTimeout(250);
  for (const item of archivoItems) {
    record(`Archivo item ${item}`, await page.getByText(item).first().isVisible().catch(() => false));
  }

  await page.screenshot({ path: result.screenshot, fullPage: false });
  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f197_menu_canvas_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F197 - Resultado smoke menu/canvas',
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
writeFileSync(join(outputsDir, 'fase_197_menu_canvas_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F197 menu/canvas smoke failed. See outputs/f197_menu_canvas_smoke_result.json');
  process.exit(1);
}

console.log('F197 menu/canvas smoke OK');
