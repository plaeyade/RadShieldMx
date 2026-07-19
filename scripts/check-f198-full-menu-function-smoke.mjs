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
  console.error('F198 smoke requires dist/index.html. Run vite build first.');
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
  console.error('F198 smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const groups = [
  {
    id: 'design',
    trigger: 'f96-migrated-design-dropdown',
    menu: 'f96-migrated-design-menu',
    labels: ['3D Bunker Viewer', 'Floor Plan Features', 'Medical 3D Floor Plan', 'DXF Viewer', 'Point Cloud (LiDAR)', 'Auto-Barrier Detection', 'Real-Time 3D Exploration'],
  },
  {
    id: 'equipment',
    trigger: 'f97-migrated-equipment-dropdown',
    menu: 'f97-migrated-equipment-menu',
    labels: ['Equipment Library', 'Source Library', 'Cyclone KIUBE'],
  },
  {
    id: 'shielding',
    trigger: 'f107-migrated-shielding-dropdown',
    menu: 'f107-migrated-shielding-menu',
    labels: ['Calcular', 'Multi-layer / Laminated', 'Neutrones', 'Skyshine', 'AAPM TG 108 PET Shielding', 'Therapy Radionuclide Shielding'],
  },
  {
    id: 'verification',
    trigger: 'f108-migrated-verification-dropdown',
    menu: 'f108-migrated-verification-menu',
    labels: ['NCRP Validation Suite', 'NCRP 147 vs 151 Cross-Val', 'Shielding Verification', 'Sensitivity Analysis', 'Uncertainty / GUM', 'Performance Dashboard'],
  },
  {
    id: 'reports',
    trigger: 'f109-migrated-reports-dropdown',
    menu: 'f109-migrated-reports-menu',
    labels: ['Memoria IA', 'PDF analitico', 'Reporte CNSNS', 'Annual Dose Report', 'Evidence Pack bridge'],
  },
  {
    id: 'evidence',
    trigger: 'f110-migrated-evidence-dropdown',
    menu: 'f110-migrated-evidence-menu',
    labels: ['Evidence Pack', 'RAG deep dive', 'Reference Library', 'Bibliografia', 'Audit Trail', 'Audit Log', 'AI source review'],
  },
  {
    id: 'integrations',
    trigger: 'f116-migrated-integrations-dropdown',
    menu: 'f116-migrated-integrations-menu',
    labels: ['Performance Dashboard', 'Benchmarks Suite', 'Function Profiler', 'CPU & Memory Profile', 'Technical Audit', 'Code Quality Audit', 'Algorithm Analyzer', 'CATIA-GDML & CAD to ROOT', 'Shielding Design Agent'],
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
  phase: 'F198',
  generatedAt: new Date().toISOString(),
  ok: false,
  url: '',
  checks: [],
  screenshot: 'outputs/f198_full_menu_function_smoke.png',
};

function record(name, ok, detail = '') {
  result.checks.push({ name, ok, detail });
}

async function ensureCanvasGuards(page, suffix = '') {
  const sidebar = await page.getByTestId('f186-sidebar-stable-width').isVisible().catch(() => false);
  const canvas = await page.getByTestId('f100-main-floorplan-canvas').isVisible().catch(() => false);
  const toolbar = await page.getByTestId('f191-pyrate-inspired-toolbar').isVisible().catch(() => false);
  record(`canvas guards ${suffix}`.trim(), sidebar && canvas && toolbar, `sidebar=${sidebar} canvas=${canvas} toolbar=${toolbar}`);
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
  await page.waitForTimeout(1200);
  await ensureCanvasGuards(page, 'initial');

  for (const group of groups) {
    await page.getByTestId(group.trigger).click();
    const menu = page.getByTestId(group.menu);
    record(`${group.id} menu visible`, await menu.isVisible().catch(() => false));
    for (const label of group.labels) {
      record(`${group.id} function ${label}`, await menu.getByText(label, { exact: false }).first().isVisible().catch(() => false));
    }
    await page.keyboard.press('Escape');
    await page.waitForTimeout(100);
    await ensureCanvasGuards(page, `after ${group.id}`);
  }

  const legacyText = await page.getByTestId('f114-deduped-legacy-menu-zone').innerText().catch(() => '');
  record('only Archivo legacy retained', legacyText.includes('Archivo') && !/Calcular|Fisica|Física|Med\. Nuclear|Normativa|Herramientas|Eficiencia/.test(legacyText), legacyText.replace(/\s+/g, ' ').trim());

  await page.screenshot({ path: result.screenshot, fullPage: false });
  result.ok = result.checks.every((check) => check.ok);
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f198_full_menu_function_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F198 - Resultado smoke de menus canonicos',
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
writeFileSync(join(outputsDir, 'fase_198_full_menu_function_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F198 full menu function smoke failed. See outputs/f198_full_menu_function_smoke_result.json');
  process.exit(1);
}

console.log('F198 full menu function smoke OK');
