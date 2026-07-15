import { existsSync, mkdirSync, readFileSync, statSync, writeFileSync, createReadStream } from 'node:fs';
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
  console.error('F115 visual smoke requires dist/index.html. Run vite build first.');
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

const requiredCanonical = [
  'f96-migrated-design-dropdown',
  'f97-migrated-equipment-dropdown',
  'f107-migrated-shielding-dropdown',
  'f108-migrated-verification-dropdown',
  'f109-migrated-reports-dropdown',
  'f110-migrated-evidence-dropdown',
  'f116-migrated-integrations-dropdown',
];
const requiredProfiles = ['f113-profile-dx', 'f113-profile-tx', 'f113-profile-nm', 'f113-profile-cy'];
const expectedLegacy = ['Archivo'];
const forbiddenLegacy = ['Calcular', 'Física', 'Fisica', 'Med. Nuclear', 'Normativa', 'Herramientas', 'Eficiencia'];

const chromePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((item) => existsSync(item));

if (!chromePath) {
  console.error('F115 visual smoke could not find Chrome or Edge executable.');
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
  phase: 'F115',
  generatedAt: new Date().toISOString(),
  ok: false,
  checks: [],
  legacyZoneText: '',
  screenshot: 'outputs/f115_visual_menu_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

let browser;
try {
  const port = await listen();
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.goto(`http://127.0.0.1:${port}/`, { waitUntil: 'networkidle', timeout: 30000 });

  const continueButton = page.getByText('Continuar', { exact: false });
  if (await continueButton.count()) await continueButton.first().click();
  await page.waitForTimeout(800);
  const newProject = page.getByText('Nuevo Proyecto en Blanco', { exact: false });
  if (await newProject.count()) await newProject.first().click();
  await page.waitForTimeout(2000);

  for (const testId of requiredCanonical) {
    record(testId, await page.getByTestId(testId).isVisible().catch(() => false));
  }
  for (const testId of requiredProfiles) {
    record(testId, await page.getByTestId(testId).isVisible().catch(() => false));
  }

  const legacyZone = page.getByTestId('f114-deduped-legacy-menu-zone');
  const legacyZoneVisible = await legacyZone.isVisible().catch(() => false);
  record('f114-deduped-legacy-menu-zone', legacyZoneVisible);
  result.legacyZoneText = legacyZoneVisible ? (await legacyZone.innerText()).replace(/\s+/g, ' ').trim() : '';

  for (const label of expectedLegacy) {
    record(`legacy visible ${label}`, result.legacyZoneText.includes(label), result.legacyZoneText);
  }
  for (const label of forbiddenLegacy) {
    record(`legacy hidden ${label}`, !result.legacyZoneText.includes(label), result.legacyZoneText);
  }

  await page.screenshot({ path: result.screenshot, fullPage: false });
  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f115_visual_menu_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F115 - Resultado smoke visual de menus',
  '',
  `- Estado: ${result.ok ? 'OK' : 'FAIL'}`,
  `- Legacy visible: ${result.legacyZoneText || '(vacio)'}`,
  `- Screenshot: ${result.screenshot}`,
  '',
  '## Checks',
  '',
  ...result.checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  '',
].join('\n');
writeFileSync(join(outputsDir, 'fase_115_visual_menu_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F115 visual menu smoke failed. See outputs/f115_visual_menu_smoke_result.json');
  process.exit(1);
}

console.log('F115 visual menu smoke OK');
