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
  console.error('F120 runtime profile smoke requires dist/index.html. Run vite build first.');
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

const profiles = [
  { id: 'dx', label: 'DX', template: 'cnsns-dx-ncrp147', text: /DX|diagnostica|NCRP 147/i },
  { id: 'tx', label: 'TX', template: 'cnsns-tx-ncrp151', text: /TX|terapia|NCRP 151/i },
  { id: 'nm', label: 'NM', template: 'cnsns-nm-tg108', text: /NM|medicina nuclear|TG-108|TG108/i },
  { id: 'cy', label: 'CY', template: 'cnsns-cy-iaea-srs47', text: /CY|ciclotron|SRS-47/i },
];

const surfaces = [
  {
    id: 'memoria',
    label: 'Memoria IA',
    openTestId: 'e2e-open-memoria-ai',
    requiredTestIds: ['f117-modality-handoff-memoria', 'f118-apply-suggested-equipment'],
  },
  {
    id: 'pdf',
    label: 'PDF Report',
    openTestId: 'e2e-open-pdf-report',
    requiredTestIds: ['f117-modality-handoff-report', 'f118-report-template-preselection', 'f118-apply-suggested-report-template'],
  },
  {
    id: 'evidence',
    label: 'Evidence Pack',
    openTestId: 'e2e-open-evidence-pack',
    requiredTestIds: ['f117-modality-handoff-evidence', 'f118-apply-evidence-objective'],
  },
];

const chromePath = [
  'C:/Program Files/Google/Chrome/Application/chrome.exe',
  'C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe',
].find((item) => existsSync(item));

if (!chromePath) {
  console.error('F120 runtime profile smoke could not find Chrome or Edge executable.');
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

function record(checks, name, ok, detail = '') {
  checks.push({ name, ok, detail: clip(detail) });
}

function clip(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 800);
}

function isExpectedBrowserNoise(text) {
  return /Download the React DevTools|ResizeObserver loop|Failed to load resource.*favicon|Failed to fetch|Content Security Policy|127\.0\.0\.1:3000\/auth\.me|Refused to connect/i.test(text);
}

async function enterWorkspace(page, url) {
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield-tour-completed', 'true');
    window.localStorage.setItem('radshield-e2e-controls', 'true');
  });
  await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
  await page.waitForTimeout(1200);

  const continueButton = page.getByText('Continuar', { exact: false });
  if (await continueButton.count()) {
    await continueButton.first().click({ force: true });
    await page.waitForTimeout(500);
  }

  const newProject = page.getByText('Nuevo Proyecto en Blanco', { exact: false });
  if (await newProject.count()) {
    await newProject.first().click({ force: true });
    await page.waitForTimeout(1200);
  }

  await page.getByTestId('e2e-dialog-controls').waitFor({ state: 'visible', timeout: 12000 });
}

async function closeDialogs(page) {
  for (let i = 0; i < 3; i += 1) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(250);
    const hasDialog = await page.locator('[role="dialog"]').count().catch(() => 0);
    if (hasDialog === 0) return;
    const closeButton = page.locator('[role="dialog"] button[aria-label="Close"], [role="dialog"] button').filter({ hasText: /^$/ }).last();
    if (await closeButton.isVisible().catch(() => false)) {
      await closeButton.click({ force: true }).catch(() => {});
      await page.waitForTimeout(250);
    }
  }
}

const result = {
  phase: 'F120',
  generatedAt: new Date().toISOString(),
  ok: false,
  checks: [],
  profileResults: [],
  screenshots: [],
  consoleErrors: [],
};

let browser;

try {
  const port = await listen();
  const baseUrl = `http://127.0.0.1:${port}/`;
  browser = await chromium.launch({ executablePath: chromePath, headless: true });

  for (const profile of profiles) {
    const page = await browser.newPage({ viewport: { width: 1600, height: 1000 } });
    page.setDefaultTimeout(10000);
    page.on('pageerror', (err) => result.consoleErrors.push({ type: 'pageerror', text: clip(err?.message || err) }));
    page.on('console', (message) => {
      if (message.type() === 'error') result.consoleErrors.push({ type: 'console', text: clip(message.text()) });
    });

    await enterWorkspace(page, baseUrl);
    record(result.checks, `workspace:${profile.label}:e2e-controls-visible`, true);
    const profileResult = { profile: profile.label, checks: [] };
    const profileButton = page.getByTestId(`f113-profile-${profile.id}`);
    const profileButtonVisible = await profileButton.isVisible().catch(() => false);
    record(profileResult.checks, `profile:${profile.label}:button-visible`, profileButtonVisible);
    if (profileButtonVisible) {
      await profileButton.click({ force: true });
      await page.waitForFunction(
        (profileId) => window.localStorage.getItem('radshield:f113:active-modality-profile') === profileId,
        profile.id,
        { timeout: 3000 },
      ).catch(() => {});
      await page.waitForTimeout(400);
    }
    const storedProfile = await page.evaluate(() => window.localStorage.getItem('radshield:f113:active-modality-profile')).catch(() => null);
    record(profileResult.checks, `profile:${profile.label}:storage-updated`, storedProfile === profile.id, String(storedProfile));

    for (const surface of surfaces) {
      await closeDialogs(page);
      const openButton = page.getByTestId(surface.openTestId);
      const buttonVisible = await openButton.isVisible().catch(() => false);
      record(profileResult.checks, `${surface.id}:open-button-visible`, buttonVisible);
      if (!buttonVisible) continue;

      await openButton.click({ force: true });
      await page.waitForTimeout(1200);

      const surfaceText = await page.locator('body').innerText().catch(() => '');
      record(profileResult.checks, `${surface.id}:profile-text-visible`, profile.text.test(surfaceText), surfaceText);
      if (surface.id === 'pdf') {
        record(profileResult.checks, `${surface.id}:template-visible`, surfaceText.includes(profile.template), surfaceText);
      }

      for (const testId of surface.requiredTestIds) {
        const visible = await page.getByTestId(testId).isVisible().catch(() => false);
        record(profileResult.checks, `${surface.id}:${testId}:visible`, visible);
      }
    }

    const screenshot = `outputs/f120_runtime_profile_smoke_${profile.id}.png`;
    await page.screenshot({ path: screenshot, fullPage: false });
    result.screenshots.push(screenshot);
    profileResult.ok = profileResult.checks.every((check) => check.ok);
    result.profileResults.push(profileResult);
    await page.close();
  }

  const severeConsoleErrors = result.consoleErrors.filter((item) => !isExpectedBrowserNoise(item.text));
  result.severeConsoleErrors = severeConsoleErrors;
  result.ok = result.profileResults.every((item) => item.ok) && severeConsoleErrors.length === 0;
} catch (error) {
  record(result.checks, 'runtime:exception', false, error instanceof Error ? error.message : String(error));
} finally {
  if (browser) await browser.close();
  await closeServer();
}

writeFileSync(join(outputsDir, 'f120_runtime_profile_smoke_result.json'), `${JSON.stringify(result, null, 2)}\n`, 'utf8');

const md = [
  '# F120 Runtime Profile Smoke',
  '',
  `- Estado: ${result.ok ? 'OK' : 'FAIL'}`,
  `- Screenshots: ${result.screenshots.join(', ')}`,
  '',
  '## Perfiles',
  ...result.profileResults.map((profile) => `- ${profile.ok ? 'OK' : 'FAIL'} ${profile.profile}: ${profile.checks.filter((check) => check.ok).length}/${profile.checks.length}`),
  '',
  '## Checks globales',
  ...result.checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}${check.detail ? `: ${check.detail}` : ''}`),
  '',
].join('\n');
writeFileSync(join(outputsDir, 'fase_120_runtime_profile_smoke_result.md'), `${md}\n`, 'utf8');

if (!result.ok) {
  console.error('F120 runtime profile smoke failed. See outputs/f120_runtime_profile_smoke_result.json');
  process.exit(1);
}

console.log('F120 runtime profile smoke OK');
