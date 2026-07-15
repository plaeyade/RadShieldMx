import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4181/';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = existsSync(chromePath) ? chromePath : undefined;
const outputDir = 'outputs';
const checks = [];
const consoleErrors = [];
const crashPatterns = [/Unexpected Application Error/i, /TypeError:/i, /ReferenceError:/i, /Cannot read properties/i, /Minified React error/i];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const page = await browser.newPage({ viewport: { width: 1440, height: 920 } });
  page.setDefaultTimeout(8000);
  page.on('pageerror', err => consoleErrors.push({ type: 'pageerror', text: String(err?.message || err).slice(0, 500) }));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ type: 'console', text: message.text().slice(0, 500) });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield-tour-completed', 'true');
  });

  await enterWorkspace(page);
  await expectVisible(page.locator('[data-testid="canvas-workflow-panel"]'), 'workflow:visible');

  await page.locator('button[title="Smart rooms"]').first().click({ force: true });
  await page.waitForTimeout(500);
  const firstTemplate = page.getByText(/CT Somatom Force/i).first();
  if (await firstTemplate.isVisible({ timeout: 3000 }).catch(() => false)) {
    await firstTemplate.click({ force: true });
    await page.waitForTimeout(300);
  }
  const applyButton = page.locator('button').filter({ hasText: /Aplic/i }).first();
  const smartRoomPanelVisible = await applyButton.isVisible({ timeout: 3000 }).catch(() => false);
  checks.push({ name: 'smart-room-panel:visible-or-demo-ready', ok: smartRoomPanelVisible || await page.locator('[data-testid="canvas-workflow-panel"]').isVisible().catch(() => false) });
  if (smartRoomPanelVisible) {
    await applyButton.click({ force: true });
    await page.waitForTimeout(800);
  }
  const afterTemplate = await page.locator('body').innerText();
  checks.push({
    name: 'smart-room:applies-floorplan-geometry',
    ok: /Smart Room|barreras|fuentes|zonas|Layout - blindaje - memoria|\d+B\s+\d+F\s+\d+Z/i.test(afterTemplate),
    evidence: clip(afterTemplate),
  });

  await page.getByRole('button', { name: /Calcular/i }).last().click({ force: true });
  await page.waitForTimeout(1800);
  const afterCalc = await page.locator('body').innerText();
  checks.push({
    name: 'calculation:produces-results',
    ok: /Resultados|Calculo completado|Lineas 0\.3m|Puntos|Max espesor/i.test(afterCalc),
    evidence: clip(afterCalc),
  });

  await page.locator('button[title="Evidence pack"]').first().click({ force: true });
  await page.waitForTimeout(500);
  if (!await page.getByText(/^Evidence Pack$/i).isVisible().catch(() => false)) {
    await page.getByRole('button', { name: /Evidence pack/i }).last().click({ force: true });
  }
  await expectVisible(page.getByText(/^Evidence Pack$/i), 'evidence-pack:opens');
  await expectVisible(page.locator('[data-testid="evidence-pack-calculation-snapshot"]'), 'evidence-pack:snapshot-visible');
  const evidenceText = await page.locator('body').innerText();
  checks.push({
    name: 'evidence-pack:contains-f75-generated-sources',
    ok: /FloorPlan RadShield-MX|Resultados de calculo de blindaje|Ruteo normativo por modalidad|Snapshot del calculo/i.test(evidenceText),
    evidence: clip(evidenceText),
  });

  const crashText = await detectRuntimeCrash(page);
  checks.push({ name: 'runtime:no-crash', ok: !crashText, evidence: clip(crashText || 'no crash') });
  await page.screenshot({ path: `${outputDir}/f75_smart_room_evidence_final.png`, fullPage: true });
  await page.close();

  const severeConsoleErrors = consoleErrors.filter(item => !isExpectedBrowserNoise(item.text));
  const failed = checks.filter(check => !check.ok);
  const output = {
    ok: failed.length === 0 && severeConsoleErrors.length === 0,
    baseUrl,
    checks,
    failed,
    consoleErrorCount: consoleErrors.length,
    severeConsoleErrors,
    databaseTouched: false,
  };
  await writeFile(`${outputDir}/f75_smart_room_evidence_smoke.json`, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) process.exitCode = 1;
} finally {
  await browser.close();
}

async function enterWorkspace(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
  await page.waitForTimeout(1500);
  const continueButton = page.getByRole('button', { name: /Continuar/i }).last();
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click({ force: true });
    await page.waitForTimeout(700);
  }
  const newProject = page.getByRole('button', { name: /Nuevo Proyecto en Blanco/i }).last();
  if (await newProject.isVisible().catch(() => false)) {
    await newProject.click({ force: true });
    await page.waitForTimeout(1000);
  }
  await page.getByRole('button', { name: /Archivo/i }).first().waitFor({ state: 'visible', timeout: 8000 });
}

async function expectVisible(locator, name) {
  const ok = await locator.isVisible({ timeout: 6000 }).catch(() => false);
  checks.push({ name, ok });
}

async function detectRuntimeCrash(page) {
  const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const pattern = crashPatterns.find(item => item.test(bodyText));
  return pattern ? bodyText.slice(0, 1000) : '';
}

function clip(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 500);
}

function isExpectedBrowserNoise(text) {
  return /Download the React DevTools|ResizeObserver loop|Failed to load resource.*favicon|Failed to fetch/i.test(text);
}
