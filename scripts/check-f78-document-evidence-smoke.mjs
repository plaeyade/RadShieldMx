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
  page.setDefaultTimeout(9000);
  page.on('pageerror', err => consoleErrors.push({ type: 'pageerror', text: String(err?.message || err).slice(0, 700) }));
  page.on('console', message => {
    if (message.type() === 'error') consoleErrors.push({ type: 'console', text: message.text().slice(0, 700) });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield-tour-completed', 'true');
    window.localStorage.setItem('radshield-e2e-controls', 'true');
  });

  await enterWorkspace(page);
  await expectVisible(page.locator('[data-testid="canvas-workflow-panel"]'), 'workspace:workflow-visible');
  await seedSmartRoomAndCalculate(page);

  await openE2EDialog(page, 'e2e-open-evidence-pack');
  await expectVisible(page.getByText(/^Evidence Pack$/i), 'evidence-pack:opens');
  await expectVisible(page.locator('[data-testid="evidence-pack-calculation-snapshot"]'), 'evidence-pack:f76-snapshot-visible');
  const evidenceText = await page.locator('body').innerText();
  const evidenceFormContainsSources = await page.evaluate(() =>
    Array.from(document.querySelectorAll('input, textarea')).some((node) =>
      /FloorPlan RadShield-MX|Resultados de c[aá]lculo de blindaje|Ruteo normativo/i.test((node instanceof HTMLInputElement || node instanceof HTMLTextAreaElement) ? node.value : '')
    )
  );
  checks.push({
    name: 'evidence-pack:mentions-generated-sources',
    ok: evidenceFormContainsSources || /FloorPlan RadShield-MX|Resultados de c[aá]lculo de blindaje|Ruteo normativo/i.test(evidenceText),
    evidence: clip(evidenceText),
  });
  await page.screenshot({ path: `${outputDir}/f78_evidence_pack.png`, fullPage: true });
  await closeEvidencePack(page);

  await openE2EDialog(page, 'e2e-open-regulatory-report');
  await expectVisible(page.locator('[data-testid="regulatory-report-dialog"]'), 'regulatory-report:opens');
  await expectVisible(page.locator('[data-testid="regulatory-report-evidence-f76"]'), 'regulatory-report:f76-visible');
  const regulatoryText = await page.locator('body').innerText();
  checks.push({
    name: 'regulatory-report:uses-live-floorplan-evidence',
    ok: /Evidencia F76|Barreras:\s*[1-9]|Fuentes:\s*[1-9]|NCRP|TG108|canvas local/i.test(regulatoryText),
    evidence: clip(regulatoryText),
  });
  await page.screenshot({ path: `${outputDir}/f78_regulatory_report.png`, fullPage: true });
  await closeDialog(page);

  await openE2EDialog(page, 'e2e-open-pdf-report');
  await expectVisible(page.locator('[data-testid="pdf-report-dialog"]'), 'pdf-report:opens');
  await expectVisible(page.locator('[data-testid="pdf-report-evidence-f76"]'), 'pdf-report:f76-visible');
  const pdfText = await page.locator('body').innerText();
  checks.push({
    name: 'pdf-report:uses-live-floorplan-evidence',
    ok: /Evidencia F76|Canvas:\s*[1-9].*barreras|fuentes/i.test(pdfText),
    evidence: clip(pdfText),
  });
  await page.screenshot({ path: `${outputDir}/f78_pdf_report.png`, fullPage: true });
  await closeDialog(page);

  await openE2EDialog(page, 'e2e-open-memoria-ai');
  await expectVisible(page.locator('[data-testid="memoria-evidence-snapshot"]'), 'memoria-ai:f76-snapshot-visible');
  const memoryText = await page.locator('body').innerText();
  checks.push({
    name: 'memoria-ai:shows-f76-evidence',
    ok: /Evidence Pack F76|Lineas 0\.3m|Barreras|Fuentes/i.test(memoryText),
    evidence: clip(memoryText),
  });
  await page.screenshot({ path: `${outputDir}/f78_memoria_ai.png`, fullPage: true });
  await closeDialog(page);

  const crashText = await detectRuntimeCrash(page);
  checks.push({ name: 'runtime:no-crash', ok: !crashText, evidence: clip(crashText || 'no crash') });
  await page.close();

  const severeConsoleErrors = consoleErrors.filter(item => !isExpectedBrowserNoise(item.text));
  const failed = checks.filter(check => !check.ok);
  const output = {
    ok: failed.length === 0 && severeConsoleErrors.length === 0,
    phase: 'F78',
    baseUrl,
    checks,
    failed,
    consoleErrorCount: consoleErrors.length,
    severeConsoleErrors,
    screenshots: [
      'outputs/f78_evidence_pack.png',
      'outputs/f78_memoria_ai.png',
      'outputs/f78_regulatory_report.png',
      'outputs/f78_pdf_report.png',
    ],
    databaseTouched: false,
  };
  await writeFile(`${outputDir}/f78_document_evidence_smoke.json`, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
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

async function seedSmartRoomAndCalculate(page) {
  await page.locator('button[title="Smart rooms"]').first().click({ force: true });
  await page.waitForTimeout(500);
  const firstTemplate = page.getByText(/CT Somatom Force/i).first();
  if (await firstTemplate.isVisible({ timeout: 3000 }).catch(() => false)) {
    await firstTemplate.click({ force: true });
    await page.waitForTimeout(300);
  }
  const applyButton = page.locator('button').filter({ hasText: /Aplic/i }).first();
  const canApply = await applyButton.isVisible({ timeout: 3000 }).catch(() => false);
  checks.push({ name: 'smart-room:apply-control-visible', ok: canApply });
  if (canApply) {
    await applyButton.click({ force: true });
    await page.waitForTimeout(800);
  }

  await page.getByRole('button', { name: /Calcular/i }).last().click({ force: true });
  await page.waitForTimeout(1800);
  const afterCalc = await page.locator('body').innerText();
  checks.push({
    name: 'calculation:produces-results-before-export-smoke',
    ok: /Resultados|Calculo completado|Lineas 0\.3m|Puntos|Max espesor/i.test(afterCalc),
    evidence: clip(afterCalc),
  });
}

async function openE2EDialog(page, testId) {
  const button = page.locator(`[data-testid="${testId}"]`).first();
  await button.waitFor({ state: 'visible', timeout: 8000 });
  await button.evaluate((node) => {
    if (node instanceof HTMLElement) node.click();
  });
  await page.waitForTimeout(900);
}

async function closeEvidencePack(page) {
  const closeButton = page.getByRole('button', { name: /Cerrar Evidence Pack/i }).first();
  if (await closeButton.isVisible({ timeout: 3000 }).catch(() => false)) {
    await closeButton.click({ force: true });
    await page.waitForTimeout(600);
    return;
  }
  await closeDialog(page);
}

async function closeDialog(page) {
  await page.keyboard.press('Escape');
  await page.waitForTimeout(500);
}

async function expectVisible(locator, name) {
  const ok = await locator.isVisible({ timeout: 7000 }).catch(() => false);
  checks.push({ name, ok });
}

async function detectRuntimeCrash(page) {
  const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const pattern = crashPatterns.find(item => item.test(bodyText));
  return pattern ? bodyText.slice(0, 1000) : '';
}

function clip(text) {
  return String(text || '').replace(/\s+/g, ' ').trim().slice(0, 700);
}

function isExpectedBrowserNoise(text) {
  return /Download the React DevTools|ResizeObserver loop|Failed to load resource.*favicon|Failed to fetch|net::ERR_ABORTED/i.test(text);
}
