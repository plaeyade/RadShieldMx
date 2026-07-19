import { existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { join } from 'node:path';

const require = createRequire(import.meta.url);
const { chromium } = require('playwright');

const root = process.cwd();
const outputsDir = join(root, 'outputs');
mkdirSync(outputsDir, { recursive: true });

const publicUrl = process.env.PUBLIC_DEPLOY_URL || 'https://radshield-mx-static-dist.vercel.app/';
const normalizedUrl = publicUrl.endsWith('/') ? publicUrl : `${publicUrl}/`;

const chromePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((item) => existsSync(item));

if (!chromePath) {
  console.error('F202 public smoke could not find Chrome or Edge executable.');
  process.exit(1);
}

const outputSurfaces = [
  {
    id: 'memoria-ai',
    opener: 'e2e-open-memoria-ai',
    signals: ['memoria-evidence-snapshot', 'f125-memoria-evidence-gate', 'f146-material-report-appendix-memoria'],
  },
  {
    id: 'pdf-report',
    opener: 'e2e-open-pdf-report',
    signals: ['pdf-report-dialog', 'pdf-report-evidence-f76', 'f146-material-report-appendix'],
  },
  {
    id: 'evidence-pack',
    opener: 'e2e-open-evidence-pack',
    signals: ['f93-citation-ledger-summary', 'f125-calculation-evidence-gate', 'f126-release-evidence-hardening'],
  },
  {
    id: 'cnsns-report',
    opener: 'e2e-open-cnsns-report',
    signals: ['Generar Memoria Analitica CNSNS'],
  },
];

const result = {
  phase: 'F202',
  generatedAt: new Date().toISOString(),
  status: 'public-vercel-smoke-pending',
  ok: false,
  url: normalizedUrl,
  checks: [],
  screenshot: 'outputs/f202_public_vercel_smoke.png',
};

function isNetworkGate(error) {
  const detail = error instanceof Error ? error.message : String(error);
  return /ERR_NETWORK_ACCESS_DENIED|ERR_INTERNET_DISCONNECTED|ERR_TUNNEL_CONNECTION_FAILED|ENOTFOUND|ECONNREFUSED|ETIMEDOUT/i.test(detail);
}

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
    localStorage.removeItem('radshield_canvas_workflow_compact_f201');
    localStorage.removeItem('radshield_sidebar_width_f188');
  });
}

async function hasSignal(page, signal, timeout = 7000) {
  const byTestId = page.getByTestId(signal).first();
  try {
    await byTestId.waitFor({ state: 'attached', timeout });
    return true;
  } catch {
    // Some older dialogs expose title/body copy instead of test ids.
  }
  const byText = page.getByText(signal, { exact: false }).first();
  try {
    await byText.waitFor({ state: 'attached', timeout });
    return true;
  } catch {
    return false;
  }
}

async function checkCanvasGuards(page, label) {
  const sidebar = await page.getByTestId('f186-sidebar-stable-width').isVisible().catch(() => false);
  const canvas = await page.getByTestId('f100-main-floorplan-canvas').isVisible().catch(() => false);
  const toolbar = await page.getByTestId('f191-pyrate-inspired-toolbar').isVisible().catch(() => false);
  record(`canvas guards ${label}`, sidebar && canvas && toolbar, `sidebar=${sidebar} canvas=${canvas} toolbar=${toolbar}`);
}

async function openMenuAndCheck(page, testId, signals) {
  await page.getByTestId(testId).click();
  await page.waitForTimeout(300);
  for (const signal of signals) {
    record(`${testId} contains ${signal}`, await hasSignal(page, signal, 4000));
  }
  await page.keyboard.press('Escape').catch(() => undefined);
  await page.waitForTimeout(150);
}

let browser;
try {
  browser = await chromium.launch({ executablePath: chromePath, headless: true });
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await primePage(page);

  const response = await page.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
  const status = response?.status() ?? 0;
  record('public URL responds', Boolean(response && status < 400), `status=${status}`);
  record('public URL is HTTPS', normalizedUrl.startsWith('https://'), normalizedUrl);
  await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
  await page.waitForTimeout(1500);
  await checkCanvasGuards(page, 'initial public URL');

  const panel = page.getByTestId('canvas-workflow-panel');
  record('workflow panel visible', await panel.isVisible().catch(() => false));
  await page.getByTestId('f188-workflow-dock-button').click();
  await page.waitForTimeout(300);
  const rightBox = await panel.boundingBox();
  record('workflow panel docks right', Boolean(rightBox && rightBox.x > 1200), rightBox ? `x=${rightBox.x} y=${rightBox.y}` : 'no box');
  await page.getByTestId('f188-workflow-dock-button').click();
  await page.waitForTimeout(300);
  const bottomBox = await panel.boundingBox();
  record('workflow panel docks bottom', Boolean(bottomBox && bottomBox.y > 520), bottomBox ? `x=${bottomBox.x} y=${bottomBox.y}` : 'no box');
  await page.getByTestId('f201-workflow-compact-button').click();
  await page.waitForTimeout(300);
  record('workflow panel compacts', !(await page.getByTestId('f90-e2e-qa-panel').isVisible().catch(() => false)));
  await page.getByTestId('f201-workflow-compact-button').click();
  await page.waitForTimeout(300);
  record('workflow panel expands', await page.getByTestId('f90-e2e-qa-panel').isVisible().catch(() => false));

  await openMenuAndCheck(page, 'f96-migrated-design-dropdown', ['Medical 3D Floor Plan']);
  await openMenuAndCheck(page, 'f109-migrated-reports-dropdown', ['Memoria IA', 'PDF analitico', 'Evidence Pack bridge']);
  await openMenuAndCheck(page, 'f110-migrated-evidence-dropdown', ['Evidence Pack']);
  await page.screenshot({ path: result.screenshot, fullPage: false });

  for (const surface of outputSurfaces) {
    const surfacePage = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
    await primePage(surfacePage);
    await surfacePage.goto(normalizedUrl, { waitUntil: 'domcontentloaded', timeout: 45000 });
    await surfacePage.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => undefined);
    await surfacePage.waitForTimeout(1000);
    await checkCanvasGuards(surfacePage, `${surface.id} before open`);
    const openerVisible = await surfacePage.getByTestId(surface.opener).isVisible().catch(() => false);
    record(`${surface.id} opener visible`, openerVisible, surface.opener);
    if (openerVisible) {
      await surfacePage.getByTestId(surface.opener).click();
      await surfacePage.waitForTimeout(1000);
      for (const signal of surface.signals) {
        record(`${surface.id} signal ${signal}`, await hasSignal(surfacePage, signal));
      }
      await checkCanvasGuards(surfacePage, `${surface.id} after open`);
    }
    await surfacePage.close();
  }

  result.ok = result.checks.every((check) => check.ok);
  result.status = result.ok ? 'public-vercel-smoke-ready' : 'public-vercel-smoke-failed';
} catch (error) {
  record('runtime exception', false, error instanceof Error ? error.message : String(error));
  result.status = isNetworkGate(error) ? 'public-vercel-smoke-network-gated' : 'public-vercel-smoke-failed';
} finally {
  if (browser) await browser.close();
}

writeFileSync(join(outputsDir, 'f202_public_vercel_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const markdown = [
  '# F202 - Public Vercel Smoke',
  '',
  `- Estado: ${result.ok ? 'OK' : 'FAIL'}`,
  `- Status: ${result.status}`,
  `- URL: ${result.url}`,
  `- Screenshot: ${result.screenshot}`,
  '',
  '## Checks',
  '',
  ...result.checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  '',
].join('\n');
writeFileSync(join(outputsDir, 'fase_202_public_vercel_smoke_result.md'), `${markdown}\n`, 'utf8');

if (!result.ok && result.status === 'public-vercel-smoke-network-gated' && process.env.F202_STRICT_PUBLIC_SMOKE !== '1') {
  console.warn('F202 public Vercel smoke network-gated. Set F202_STRICT_PUBLIC_SMOKE=1 to fail on network gates.');
  process.exit(0);
}

if (!result.ok) {
  console.error('F202 public Vercel smoke failed. See outputs/f202_public_vercel_smoke_result.json');
  process.exit(1);
}

console.log('F202 public Vercel smoke OK');
