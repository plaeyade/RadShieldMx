import { existsSync } from "node:fs";
import { mkdir, writeFile } from "node:fs/promises";
import { chromium } from "playwright";

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || "http://127.0.0.1:4181/";
const chromePath = "C:/Program Files/Google/Chrome/Application/chrome.exe";
const executablePath = existsSync(chromePath) ? chromePath : undefined;
const outputDir = "outputs";
const crashPatterns = [
  /Unexpected Application Error/i,
  /TypeError:/i,
  /ReferenceError:/i,
  /Cannot read properties/i,
  /is not a function/i,
  /Minified React error/i,
];

await mkdir(outputDir, { recursive: true });

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

const consoleErrors = [];
const checks = [];

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  page.setDefaultTimeout(6000);
  page.on("pageerror", (err) => {
    consoleErrors.push({ type: "pageerror", text: String(err?.message || err).slice(0, 500) });
  });
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push({ type: "console", text: message.text().slice(0, 500) });
  });
  await page.addInitScript(() => {
    window.localStorage.setItem("radshield-tour-completed", "true");
  });

  await enterWorkspace(page);
  await expectVisible(page.getByText(/Herramientas de Dibujo/i), "sidebar:drawing-tools-visible");
  await expectVisible(page.locator("canvas").first(), "canvas:visible");

  await clickToolAndExpect(page, "Sel", /Seleccionar/i, "tool:select");
  await clickToolAndExpect(page, "Barr", /Dibujar Barrera/i, "tool:barrier");
  await clickToolAndExpect(page, "Fte", /Colocar Fuente/i, "tool:source");
  await clickToolAndExpect(page, "Pan", /Pan/i, "tool:pan");
  await clickToolAndExpect(page, "Med", /Medir/i, "tool:measure");

  await clickAndAssertResponsive(page.getByRole("button", { name: /Lineas 0\.3m/i }).first(), "overlay:sample-lines-toggle");
  await clickAndAssertResponsive(page.getByRole("button", { name: /Puntos/i }).first(), "overlay:points-toggle");
  await clickAndAssertResponsive(page.getByRole("button", { name: /Maximos/i }).first(), "overlay:maxima-toggle");

  await clickTitleAndExpect(page, "Zoom in", /1[12]0%|120%|Zoom/i, "floating:zoom-in");
  await clickTitleAndExpect(page, "Zoom out", /\d+%|Zoom/i, "floating:zoom-out");
  await clickTitleAndExpect(page, "Toggle snap", /\+Snap|Ctrl\+rueda zoom/i, "floating:snap");
  await clickTitleAndExpect(page, "Zoom to fit", /\d+%|Ctrl\+rueda zoom/i, "floating:zoom-to-fit");

  await page.locator('button[title="Calcular blindaje (F5)"]').first().click({ force: true });
  await page.waitForTimeout(900);
  const statusText = await page.locator("body").innerText({ timeout: 3000 });
  checks.push({
    name: "sidebar:quick-calculate",
    ok: /PASS|Resultados|Sample lines|Points|Calculo completado/i.test(statusText),
    evidence: clip(statusText),
  });

  await page.getByRole("button", { name: /Calcular/i }).last().click({ force: true }).catch(() => {});
  await page.waitForTimeout(900);
  const afterBottomCalc = await page.locator("body").innerText({ timeout: 3000 });
  checks.push({
    name: "canvas:bottom-calculate-button",
    ok: /Resultados|Sample lines|Points|Calculo completado|PASS/i.test(afterBottomCalc),
    evidence: clip(afterBottomCalc),
  });

  const crashText = await detectRuntimeCrash(page);
  checks.push({ name: "runtime:no-crash", ok: !crashText, evidence: clip(crashText || "no crash") });

  await page.screenshot({ path: `${outputDir}/f69_canvas_buttons_final.png`, fullPage: true });
  await page.close();

  const severeConsoleErrors = consoleErrors.filter((item) => !isExpectedBrowserNoise(item.text));
  const failed = checks.filter((check) => !check.ok);
  const output = {
    ok: failed.length === 0,
    baseUrl,
    checks,
    failed,
    consoleErrorCount: consoleErrors.length,
    severeConsoleErrors,
    databaseTouched: false,
  };

  await writeFile(`${outputDir}/f69_canvas_buttons_smoke.json`, `${JSON.stringify(output, null, 2)}\n`, "utf8");
  console.log(JSON.stringify(output, null, 2));
  if (!output.ok) process.exitCode = 1;
} finally {
  await browser.close();
}

async function enterWorkspace(page) {
  await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 15000 });
  await page.waitForTimeout(1500);

  const continueButton = page.getByRole("button", { name: /Continuar/i }).last();
  if (await continueButton.isVisible().catch(() => false)) {
    await continueButton.click({ force: true });
    await page.waitForTimeout(700);
  }

  const newProject = page.getByRole("button", { name: /Nuevo Proyecto en Blanco/i }).last();
  if (await newProject.isVisible().catch(() => false)) {
    await newProject.click({ force: true });
    await page.waitForTimeout(1000);
  }

  await page.getByRole("button", { name: /Archivo/i }).first().waitFor({ state: "visible", timeout: 8000 });
}

async function expectVisible(locator, name) {
  const ok = await locator.isVisible({ timeout: 5000 }).catch(() => false);
  checks.push({ name, ok });
}

async function clickToolAndExpect(page, label, expectedText, name) {
  await page.getByRole("button", { name: new RegExp(`^${label}$`, "i") }).first().click({ force: true });
  await page.waitForTimeout(200);
  const bodyText = await page.locator("body").innerText({ timeout: 2000 });
  checks.push({ name, ok: expectedText.test(bodyText), evidence: clip(bodyText) });
}

async function clickAndAssertResponsive(locator, name) {
  const beforeCrash = await detectRuntimeCrash(locator.page());
  await locator.click({ force: true });
  await locator.page().waitForTimeout(150);
  const afterCrash = await detectRuntimeCrash(locator.page());
  checks.push({ name, ok: !beforeCrash && !afterCrash, evidence: clip(afterCrash || "responsive") });
}

async function clickTitleAndExpect(page, title, expectedText, name) {
  await page.locator(`button[title="${title}"]`).first().click({ force: true });
  await page.waitForTimeout(200);
  const bodyText = await page.locator("body").innerText({ timeout: 2000 });
  checks.push({ name, ok: expectedText.test(bodyText), evidence: clip(bodyText) });
}

async function detectRuntimeCrash(page) {
  const bodyText = await page.locator("body").innerText({ timeout: 3000 }).catch(() => "");
  const pattern = crashPatterns.find((item) => item.test(bodyText));
  return pattern ? bodyText.slice(0, 1000) : "";
}

function clip(text) {
  return String(text || "").replace(/\s+/g, " ").trim().slice(0, 500);
}

function isExpectedBrowserNoise(text) {
  return /Download the React DevTools|ResizeObserver loop|Failed to load resource.*favicon|Failed to fetch/i.test(text);
}
