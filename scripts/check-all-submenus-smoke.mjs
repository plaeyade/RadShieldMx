import { existsSync } from 'node:fs';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4181/';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = existsSync(chromePath) ? chromePath : undefined;
const outputDir = 'outputs';
const menuLabels = ['Archivo', 'Diseno', 'Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Reportes', 'Herramientas', 'Eficiencia'];
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

try {
  const page = await browser.newPage({
    viewport: { width: 1440, height: 900 },
    acceptDownloads: true,
  });
  page.setDefaultTimeout(5000);
  page.on('pageerror', (err) => {
    consoleErrors.push({ type: 'pageerror', text: String(err?.message || err).slice(0, 500) });
  });
  page.on('console', (message) => {
    if (message.type() === 'error') {
      consoleErrors.push({ type: 'console', text: message.text().slice(0, 500) });
    }
  });
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield-tour-completed', 'true');
  });
  await enterWorkspace(page);

  const discovered = [];
  for (const label of menuLabels) {
    const items = await discoverItems(page, label);
    console.log(`[discover] ${label}: ${items.length} submenus`);
    discovered.push({ label, itemCount: items.length, items });
  }

  const results = [];
  for (const menu of discovered) {
    for (const item of menu.items) {
      const result = await exerciseSubmenu(page, menu.label, item.index, item.text);
      results.push(result);
      console.log(`[submenu] ${result.ok ? 'ok' : 'fail'} ${menu.label} > ${item.text} (${result.elapsedMs} ms)`);
      if (!result.ok) {
        await page.screenshot({
          path: `${outputDir}/f68_submenu_failure_${safeName(menu.label)}_${item.index}_${safeName(item.text)}.png`,
          fullPage: true,
        }).catch(() => {});
      }
    }
  }

  await page.screenshot({ path: `${outputDir}/f68_all_submenus_final.png`, fullPage: true });
  await page.close();

  const failedItems = results.filter((item) => !item.ok);
  const severeConsoleErrors = consoleErrors.filter((item) => !isExpectedBrowserNoise(item.text));
  const output = {
    ok: failedItems.length === 0,
    baseUrl,
    menuCount: discovered.length,
    submenuCount: results.length,
    discovered,
    failedItems,
    consoleErrorCount: consoleErrors.length,
    severeConsoleErrors,
    results,
  };

  await writeFile(`${outputDir}/f68_all_submenus_smoke.json`, `${JSON.stringify(output, null, 2)}\n`, 'utf8');
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

async function discoverItems(page, menuLabel) {
  await openMenu(page, menuLabel);
  await page.waitForTimeout(150);
  const items = await page.locator('[role="menuitem"]').evaluateAll((nodes) =>
    nodes
      .map((node, index) => ({ index, text: (node.textContent || '').replace(/\s+/g, ' ').trim() }))
      .filter((item) => item.text.length > 0),
  );
  await page.keyboard.press('Escape').catch(() => {});
  await page.waitForTimeout(100);
  return items;
}

async function exerciseSubmenu(page, menuLabel, itemIndex, itemText) {
  const startedAt = Date.now();
  const result = {
    menu: menuLabel,
    index: itemIndex,
    item: itemText,
    ok: false,
    openedDialog: false,
    fileChooser: false,
    download: false,
    crashText: '',
    postActionResponsive: false,
    error: null,
    elapsedMs: 0,
  };

  try {
    await closeFloatingUi(page);
    await openMenu(page, menuLabel);
    const item = page.locator('[role="menuitem"]').nth(itemIndex);
    await item.waitFor({ state: 'visible', timeout: 5000 });

    const fileChooserPromise = page.waitForEvent('filechooser', { timeout: 350 }).catch(() => null);
    const downloadPromise = page.waitForEvent('download', { timeout: 350 }).catch(() => null);
    await item.evaluate((node) => node.click());

    const [fileChooser, download] = await Promise.all([fileChooserPromise, downloadPromise]);
    result.fileChooser = Boolean(fileChooser);
    result.download = Boolean(download);
    await page.waitForTimeout(200);

    const crashText = await detectRuntimeCrash(page);
    result.crashText = crashText;
    result.openedDialog = await hasDialog(page);
    await closeFloatingUi(page);
    result.postActionResponsive = await isToolbarResponsive(page);
    result.ok = !crashText && result.postActionResponsive;
  } catch (err) {
    result.error = String(err?.message || err).slice(0, 700);
    await closeFloatingUi(page).catch(() => {});
    result.postActionResponsive = await isToolbarResponsive(page).catch(() => false);
  } finally {
    result.elapsedMs = Date.now() - startedAt;
  }

  return result;
}

async function openMenu(page, menuLabel) {
  const button = page.getByRole('button', { name: new RegExp(escapeRegex(menuLabel), 'i') }).first();
  await button.waitFor({ state: 'visible', timeout: 6000 });
  await button.click({ timeout: 5000 });
  await page.locator('[role="menu"]').first().waitFor({ state: 'visible', timeout: 5000 });
}

async function closeFloatingUi(page) {
  for (let i = 0; i < 4; i += 1) {
    await page.keyboard.press('Escape').catch(() => {});
    await page.waitForTimeout(100);
  }

  const closeButtons = [
    page.getByRole('button', { name: /Close|Cerrar|Cancelar/i }),
    page.locator('button[aria-label*="Close"], button[aria-label*="Cerrar"], [data-slot="dialog-close"]'),
  ];

  for (const locator of closeButtons) {
    const count = await locator.count().catch(() => 0);
    for (let i = 0; i < Math.min(count, 3); i += 1) {
      const button = locator.nth(i);
      if (await button.isVisible().catch(() => false)) {
        await button.click({ force: true, timeout: 1000 }).catch(() => {});
        await page.waitForTimeout(150);
      }
    }
  }

  const legacyCloseButtons = page.locator('button[aria-label*="Cerrar"], button[aria-label*="Close"]');
  const legacyCount = await legacyCloseButtons.count().catch(() => 0);
  for (let i = legacyCount - 1; i >= 0; i -= 1) {
    const button = legacyCloseButtons.nth(i);
    if (await button.isVisible().catch(() => false)) {
      await button.click({ force: true, timeout: 1000 }).catch(() => {});
      await page.waitForTimeout(150);
    }
  }

  await page.evaluate(() => {
    const legacyFullscreenOverlays = [...document.querySelectorAll('div')].filter((node) => {
      const style = window.getComputedStyle(node);
      const rect = node.getBoundingClientRect();
      return (
        style.position === 'fixed' &&
        rect.width >= window.innerWidth * 0.8 &&
        rect.height >= window.innerHeight * 0.8 &&
        Number(style.zIndex || 0) >= 40
      );
    });
    const overlays = [
      ...document.querySelectorAll('[role="dialog"], [data-slot="dialog-content"]'),
      ...legacyFullscreenOverlays,
    ];
    for (const overlay of overlays.reverse()) {
      const overlayRect = overlay.getBoundingClientRect();
      const buttons = [...overlay.querySelectorAll('button')];
      const closeLike = buttons.find((button) => {
        const rect = button.getBoundingClientRect();
        const label = `${button.getAttribute('aria-label') || ''} ${button.textContent || ''}`;
        const isNamedClose = /close|cerrar|cancel/i.test(label);
        const isSmallTopRight =
          rect.width > 0 &&
          rect.height > 0 &&
          rect.width <= 56 &&
          rect.height <= 56 &&
          rect.top <= overlayRect.top + 96 &&
          rect.left >= overlayRect.right - 160;
        return isNamedClose || isSmallTopRight;
      });
      closeLike?.click();
    }
  }).catch(() => {});
  await page.waitForTimeout(150);

  await page.evaluate(() => {
    document.querySelectorAll('[data-state="open"][data-slot="dialog-overlay"]').forEach((node) => node.remove());
  }).catch(() => {});
}

async function hasDialog(page) {
  const formalDialog = await page.locator('[role="dialog"], [data-radix-dialog-content], [data-slot="dialog-content"]').first().isVisible().catch(() => false);
  if (formalDialog) return true;
  const bodyText = await page.locator('body').innerText({ timeout: 1000 }).catch(() => '');
  return /Wizard de Blindaje|Barrera Rapida|Optimizador|Estimador de Costos|Uncertainty/i.test(bodyText);
}

async function detectRuntimeCrash(page) {
  const bodyText = await page.locator('body').innerText({ timeout: 3000 }).catch(() => '');
  const pattern = crashPatterns.find((item) => item.test(bodyText));
  return pattern ? bodyText.slice(0, 1000) : '';
}

async function isToolbarResponsive(page) {
  const button = page.getByRole('button', { name: /Archivo/i }).first();
  if (!(await button.isVisible().catch(() => false))) return false;
  await button.click({ timeout: 3000 });
  const opened = await page.locator('[role="menu"]').first().isVisible({ timeout: 2500 }).catch(() => false);
  await page.keyboard.press('Escape').catch(() => {});
  return opened;
}

function escapeRegex(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function safeName(value) {
  return value.replace(/[^a-z0-9]+/gi, '_').replace(/^_+|_+$/g, '').slice(0, 70) || 'item';
}

function isExpectedBrowserNoise(text) {
  return /Download the React DevTools|ResizeObserver loop|Failed to load resource.*favicon/i.test(text);
}
