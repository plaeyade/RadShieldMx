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
  console.error('F362 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F362 smoke could not find Chrome or Edge executable.');
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
  phase: 'F362',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f362_ui_regression_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

function boxLeft(box) {
  return box?.left ?? box?.x ?? 0;
}

function boxTop(box) {
  return box?.top ?? box?.y ?? 0;
}

async function visibleBox(page, locator) {
  const visible = await locator.first().isVisible().catch(() => false);
  const box = visible ? await locator.first().boundingBox().catch(() => null) : null;
  return { visible, box };
}

async function closeOpenDialogs(page) {
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(100);
  const closeButtons = page.locator('button[aria-label*="Cerrar"], button[aria-label*="Close"], [data-slot="dialog-close"]');
  const count = await closeButtons.count().catch(() => 0);
  for (let i = count - 1; i >= 0; i -= 1) {
    await closeButtons.nth(i).click().catch(() => undefined);
    await page.waitForTimeout(100);
  }
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(150);
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

  const fileTrigger = page.getByTestId('f295-primary-file-dropdown');
  const fileTriggerBox = await visibleBox(page, fileTrigger);
  record('primary Archivo trigger visible', fileTriggerBox.visible, JSON.stringify(fileTriggerBox.box));

  const legacyZone = page.getByTestId('f114-deduped-legacy-menu-zone');
  const legacyVisible = await legacyZone.isVisible().catch(() => false);
  const legacyText = legacyVisible ? await legacyZone.innerText().catch(() => '') : '';
  record('legacy Archivo zone no longer exposes menu content', !legacyVisible || legacyText.trim().length === 0, legacyText.trim());

  await fileTrigger.click();
  await page.waitForTimeout(250);
  const fileMenu = page.getByTestId('f295-primary-file-menu');
  const fileMenuBox = await visibleBox(page, fileMenu);
  const aligned = Boolean(
    fileMenuBox.visible &&
    fileTriggerBox.box &&
    fileMenuBox.box &&
    boxLeft(fileMenuBox.box) >= boxLeft(fileTriggerBox.box) - 16 &&
    boxLeft(fileMenuBox.box) <= boxLeft(fileTriggerBox.box) + 32 &&
    fileMenuBox.box.width >= 240 &&
    fileMenuBox.box.width <= 300
  );
  record('Archivo menu aligned below trigger with stable width', aligned, JSON.stringify({ trigger: fileTriggerBox.box, menu: fileMenuBox.box }));
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  const viewport = page.getByTestId('f214-sketchup-viewport-frame');
  const viewportBox = await visibleBox(page, viewport);
  record('canvas viewport visible', viewportBox.visible && (viewportBox.box?.width ?? 0) > 500 && (viewportBox.box?.height ?? 0) > 300, JSON.stringify(viewportBox.box));
  if (viewportBox.box) {
    await page.mouse.click(boxLeft(viewportBox.box) + viewportBox.box.width / 2, boxTop(viewportBox.box) + viewportBox.box.height / 2, { button: 'right' });
    await page.waitForTimeout(250);
  }
  const contextMenuVisible = await page.getByTestId('canvas-context-menu').isVisible().catch(() => false);
  record('canvas right-click opens context menu', contextMenuVisible);
  await page.keyboard.press('Escape');
  await page.waitForTimeout(100);

  await page.getByRole('button', { name: 'Update Center' }).click();
  await page.waitForTimeout(1500);
  const updateVisible = (
    await page.getByText('RadShield-MX Update Center', { exact: false }).isVisible().catch(() => false)
  ) || (
    await page.getByText('F362 UI regression repair', { exact: false }).isVisible().catch(() => false)
  );
  record('quick access Update Center opens dialog', updateVisible);
  await closeOpenDialogs(page);

  await page.getByRole('button', { name: 'Manual' }).click();
  await page.waitForTimeout(1500);
  const manualVisible = await page.getByText(/Manual|Usuario|RadShield/i).first().isVisible().catch(() => false);
  record('quick access Manual opens content', manualVisible);
  await closeOpenDialogs(page);

  await page.getByRole('button', { name: 'Floor Plan Tools' }).click();
  await page.waitForTimeout(1500);
  const floorToolsVisible = await page.getByText('Floor Plan Tools', { exact: false }).isVisible().catch(() => false);
  record('quick access Floor Plan Tools opens dialog', floorToolsVisible);
  await closeOpenDialogs(page);

  await page.screenshot({ path: result.screenshot, fullPage: false });
  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f362_ui_regression_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F362 - UI regression smoke',
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
writeFileSync(join(outputsDir, 'fase_362_ui_regression_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F362 UI regression smoke failed. See outputs/f362_ui_regression_smoke_result.json');
  process.exit(1);
}

console.log('F362 UI regression smoke OK');
