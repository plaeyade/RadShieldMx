import { existsSync } from 'node:fs';
import { chromium } from 'playwright';

const baseUrl = process.env.PLAYWRIGHT_TEST_BASE_URL || 'http://127.0.0.1:4181/';
const chromePath = 'C:/Program Files/Google/Chrome/Application/chrome.exe';
const executablePath = existsSync(chromePath) ? chromePath : undefined;
const menuLabels = ['Archivo', 'Diseno', 'Calcular', 'Fisica', 'Med. Nuclear', 'Normativa', 'Reportes', 'Herramientas', 'Eficiencia'];

const browser = await chromium.launch({
  headless: true,
  ...(executablePath ? { executablePath } : {}),
});

try {
  const firstRun = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  firstRun.setDefaultTimeout(4000);
  await enterWorkspace(firstRun);
  await firstRun.waitForTimeout(3200);
  const deadOverlay = await firstRun.evaluate(() => {
    const bodyText = document.body.innerText || '';
    const button = [...document.querySelectorAll('button')].find((item) => item.textContent?.includes('Archivo'));
    if (!button) return { blocked: true, reason: 'archivo-button-missing' };
    const rect = button.getBoundingClientRect();
    const top = document.elementFromPoint(rect.left + rect.width / 2, rect.top + rect.height / 2);
    const blocked = Boolean(top?.closest?.('#react-joyride-portal'));
    const validTourVisible = /Toolbar Principal|Area de Trabajo|Herramientas/.test(bodyText);
    return {
      blocked,
      validTourVisible,
      reason: blocked && !validTourVisible ? 'react-joyride-dead-overlay' : 'clear-or-valid-tour',
      topTag: top?.tagName || null,
      topText: top?.textContent?.trim().slice(0, 80) || '',
    };
  });
  await firstRun.screenshot({ path: 'outputs/f67_first_run_tour_overlay_check.png', fullPage: true });
  await firstRun.close();

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });
  page.setDefaultTimeout(4000);
  await page.addInitScript(() => {
    window.localStorage.setItem('radshield-tour-completed', 'true');
  });
  await enterWorkspace(page);

  const results = [];
  for (const label of menuLabels) {
    const button = page.locator('button').filter({ hasText: label }).first();
    const visible = await button.isVisible().catch(() => false);
    let expanded = null;
    let opened = false;
    let sample = '';
    let error = null;

    if (visible) {
      try {
        await button.click({ timeout: 4000 });
        await page.waitForTimeout(300);
        expanded = await button.getAttribute('aria-expanded').catch(() => null);
        const texts = await page.$$eval(
          '[data-radix-popper-content-wrapper], [role="menu"], [role="dialog"]',
          (nodes) => nodes.map((node) => node.innerText.trim()).filter(Boolean),
        );
        sample = texts.join('\n---\n').slice(0, 600);
        opened = expanded === 'true' || sample.length > 15;
        await page.screenshot({ path: `outputs/f67_menu_validated_${label.replace(/[^a-zA-Z0-9]/g, '_')}.png`, fullPage: false });
      } catch (err) {
        error = String(err?.message || err).slice(0, 350);
      } finally {
        await page.keyboard.press('Escape').catch(() => {});
        await page.waitForTimeout(100);
      }
    }

    results.push({ label, visible, expanded, opened, sample, error });
  }

  await page.screenshot({ path: 'outputs/f67_workspace_menu_validated_final.png', fullPage: true });
  await page.close();

  const failedMenus = results.filter((item) => !item.visible || !item.opened || item.error);
  const ok = !(deadOverlay.blocked && !deadOverlay.validTourVisible) && failedMenus.length === 0;
  const output = {
    ok,
    baseUrl,
    firstRunTourOverlay: deadOverlay,
    menuCount: results.length,
    failedMenus,
    results,
  };
  console.log(JSON.stringify(output, null, 2));
  if (!ok) process.exitCode = 1;
} finally {
  await browser.close();
}

async function enterWorkspace(page) {
  await page.goto(baseUrl, { waitUntil: 'domcontentloaded', timeout: 10000 });
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
}
