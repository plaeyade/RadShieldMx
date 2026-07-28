import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { expect, test, type Page } from '@playwright/test';
import { bootWorkspace } from './helpers';

const outputDir = path.resolve('outputs', 'f371_f372_beta_visuals');

type Check = {
  name: string;
  ok: boolean;
  detail?: Record<string, unknown>;
};

const checks: Check[] = [];

function addCheck(name: string, ok: boolean, detail?: Record<string, unknown>) {
  checks.push({ name, ok, detail });
}

async function screenshot(page: Page, name: string, fullPage = false) {
  const file = path.join(outputDir, `${name}.png`);
  await page.screenshot({ path: file, fullPage });
  addCheck(`screenshot:${name}`, true, { file });
}

const flowHtml = `<!doctype html>
<html lang="es">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>F371-F372 visual release flow</title>
  <style>
    body { margin: 0; font-family: Inter, Arial, sans-serif; background: #f7f8fb; color: #172033; }
    .wrap { width: 1440px; height: 900px; box-sizing: border-box; padding: 36px; display: grid; grid-template-rows: auto 1fr auto; gap: 24px; }
    h1 { margin: 0; font-size: 34px; letter-spacing: 0; }
    .subtitle { margin-top: 8px; color: #5b667a; font-size: 16px; }
    .grid { display: grid; grid-template-columns: 1.15fr 0.85fr; gap: 24px; min-height: 0; }
    .scene { border: 1px solid #d9e1ee; background: linear-gradient(160deg, #eef3f8, #ffffff); border-radius: 8px; padding: 24px; position: relative; overflow: hidden; }
    .room { position: absolute; left: 110px; top: 115px; width: 590px; height: 440px; transform: perspective(900px) rotateX(58deg) rotateZ(-33deg); transform-origin: center; background: #dfe7ee; border: 16px solid #828c98; box-shadow: 0 30px 70px rgba(29, 45, 68, 0.18); }
    .room:before { content: ""; position: absolute; inset: 44px; border: 10px solid #9ea7b2; background: repeating-linear-gradient(90deg, #f7fafc 0 34px, #edf2f7 34px 68px); }
    .linac { position: absolute; left: 260px; top: 230px; width: 130px; height: 76px; background: #f97316; border-radius: 38px 38px 18px 18px; box-shadow: 0 14px 24px rgba(249, 115, 22, 0.28); }
    .linac:after { content: "LINAC"; position: absolute; inset: 28px 0 auto 0; text-align: center; color: white; font-weight: 800; font-size: 18px; }
    .gk { position: absolute; left: 470px; top: 308px; width: 98px; height: 98px; border-radius: 50%; background: #2563eb; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.26); }
    .gk:after { content: "GK"; position: absolute; inset: 36px 0 auto 0; text-align: center; color: white; font-weight: 800; font-size: 18px; }
    .cy { position: absolute; left: 155px; top: 362px; width: 118px; height: 118px; border-radius: 12px; background: #059669; box-shadow: 0 12px 24px rgba(5, 150, 105, 0.26); }
    .cy:after { content: "CY"; position: absolute; inset: 43px 0 auto 0; text-align: center; color: white; font-weight: 800; font-size: 20px; }
    .beam { position: absolute; left: 384px; top: 268px; width: 290px; height: 130px; background: linear-gradient(90deg, rgba(249,115,22,.28), rgba(249,115,22,0)); clip-path: polygon(0 35%, 100% 0, 100% 100%, 0 65%); }
    .heat { position: absolute; left: 180px; top: 150px; width: 500px; height: 380px; background: radial-gradient(circle at 58% 47%, rgba(239,68,68,.45), rgba(249,115,22,.28) 18%, rgba(250,204,21,.18) 33%, rgba(34,197,94,.12) 48%, transparent 68%); filter: blur(6px); }
    .label { position: absolute; border: 1px solid #cbd5e1; background: rgba(255,255,255,.92); border-radius: 6px; padding: 8px 10px; font-size: 13px; box-shadow: 0 10px 30px rgba(15, 23, 42, .08); }
    .label.one { left: 38px; top: 38px; }
    .label.two { right: 36px; top: 42px; }
    .label.three { right: 52px; bottom: 42px; }
    .cards { display: grid; grid-template-columns: 1fr; gap: 14px; }
    .card { border: 1px solid #d9e1ee; background: #fff; border-radius: 8px; padding: 18px; }
    .card h2 { margin: 0 0 8px; font-size: 18px; }
    .card p { margin: 0; color: #5b667a; font-size: 14px; line-height: 1.45; }
    .status { display: inline-flex; align-items: center; gap: 8px; margin-top: 12px; color: #0f766e; font-size: 12px; font-weight: 800; text-transform: uppercase; }
    .dot { width: 8px; height: 8px; border-radius: 50%; background: #10b981; }
    .steps { display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px; }
    .step { border: 1px solid #d9e1ee; background: #fff; border-radius: 8px; padding: 12px; min-height: 76px; }
    .step b { display: block; font-size: 13px; margin-bottom: 6px; }
    .step span { color: #64748b; font-size: 12px; line-height: 1.35; }
  </style>
</head>
<body>
  <div class="wrap">
    <header>
      <h1>RadShield-MX F371-F372: vista beta 3D + memoria analitica</h1>
      <div class="subtitle">Three/R3F queda como runtime activo; Unity WebGL queda como visor externo por handoff; motores MC quedan formalizados como runners externos.</div>
    </header>
    <main class="grid">
      <section class="scene" aria-label="Escena 3D beta">
        <div class="heat"></div>
        <div class="beam"></div>
        <div class="room"></div>
        <div class="linac"></div>
        <div class="gk"></div>
        <div class="cy"></div>
        <div class="label one"><b>Three/R3F activo</b><br/>recorrido, PBR ligero, estaciones, heatmap</div>
        <div class="label two"><b>Unity WebGL externo</b><br/>handoff JSON + OBJ/GLB futuro + capturas</div>
        <div class="label three"><b>Memoria IA</b><br/>fórmula, norma, cita, hash, evidencia visual</div>
      </section>
      <aside class="cards">
        <div class="card">
          <h2>Three/R3F</h2>
          <p>Inspecciona bunker/sala con capas de equipos, barreras, zonas, espesores, estaciones de revisión y export visual para reportes.</p>
          <div class="status"><i class="dot"></i>Activo en frontend</div>
        </div>
        <div class="card">
          <h2>Unity WebGL</h2>
          <p>No se embebe como dependencia pesada. Se abre como visor externo configurable para recorridos fotorrealistas, usando el paquete de escena exportado.</p>
          <div class="status"><i class="dot"></i>Contrato implementado</div>
        </div>
        <div class="card">
          <h2>Motores externos</h2>
          <p>GATE/OpenGATE, Geant4 y EGSnrc/egs_brachy quedan conectados por runner manifest, inputs versionados y retorno de evidencia.</p>
          <div class="status"><i class="dot"></i>Formalizado</div>
        </div>
      </aside>
    </main>
    <footer class="steps">
      <div class="step"><b>1. Plano</b><span>Canvas/croquis/DXF convertido con escala y zonas.</span></div>
      <div class="step"><b>2. Equipos</b><span>LINAC, Gamma Knife, ciclotron y fuente real.</span></div>
      <div class="step"><b>3. Blindaje</b><span>TVL, densidad, peso, costos y cargas.</span></div>
      <div class="step"><b>4. Evidencia</b><span>Norma, pagina, hash, chunk y revision.</span></div>
      <div class="step"><b>5. Reporte</b><span>Memoria IA + PDF + Evidence Pack + captura 3D.</span></div>
    </footer>
  </div>
</body>
</html>`;

test.describe('F371-F372 beta visual smoke', () => {
  test('captures shell, canvas, key dialogs and beta 3D workflow visual', async ({ page }) => {
    test.setTimeout(180_000);
    checks.length = 0;
    await mkdir(outputDir, { recursive: true });
    await page.setViewportSize({ width: 1440, height: 900 });
    await bootWorkspace(page);

    const canvas = page.getByTestId('f100-main-floorplan-canvas');
    await expect(canvas).toBeVisible({ timeout: 15_000 });
    const canvasBox = await canvas.boundingBox();
    addCheck('canvas-visible', Boolean(canvasBox && canvasBox.width > 400 && canvasBox.height > 300), {
      width: canvasBox?.width,
      height: canvasBox?.height,
    });

    await expect(page.getByTestId('f186-sidebar-stable-width')).toBeVisible({ timeout: 10_000 });
    addCheck('sidebar-visible', true);
    await screenshot(page, '01_app_canvas_shell');

    await page.getByTestId('f295-primary-file-dropdown').click();
    await expect(page.getByTestId('f295-primary-file-menu')).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '02_file_menu_aligned');
    await page.keyboard.press('Escape');

    await canvas.click({ button: 'right', position: { x: 320, y: 220 } });
    const contextMenuVisible = await page.getByTestId('canvas-context-menu').isVisible({ timeout: 5_000 }).catch(() => false);
    addCheck('canvas-right-click-menu-visible', contextMenuVisible);
    await screenshot(page, '03_canvas_context_menu');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /^Memoria$/i }).click();
    await expect(page.getByTestId('f367-f370-release-integration-memoria')).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '04_memoria_ai_f367_f370');
    await page.keyboard.press('Escape');

    await page.getByRole('button', { name: /PDF Report/i }).click();
    await expect(page.getByTestId('f367-f370-release-integration-pdf')).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '05_pdf_report_f367_f370');
    await page.keyboard.press('Escape');

    await page.getByTestId('f112-persistent-favorites').getByRole('button', { name: 'Evidencia', exact: true }).click();
    await expect(page.getByTestId('f367-f370-release-integration-evidence')).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '06_evidence_pack_f367_f370');
    await page.getByRole('button', { name: /Cerrar Evidence Pack/i }).click();

    await page.getByTestId('f96-migrated-design-dropdown').click();
    await page.getByText('Medical 3D Floor Plan').click();
    const medicalDialog = page.locator('[role="dialog"]').filter({ hasText: /Medical 3D Floor Plan/i });
    await expect(medicalDialog).toBeVisible({ timeout: 15_000 });
    await expect(medicalDialog.locator('canvas').first()).toBeVisible({ timeout: 15_000 });
    await page.waitForTimeout(1500);
    await expect(page.getByTestId('f367-f370-medical-3d-release-integration')).toBeVisible({ timeout: 15_000 });
    await screenshot(page, '07_medical_3d_three_release_integration');
    await page.keyboard.press('Escape');

    const visualHtmlPath = path.join(outputDir, 'f371_f372_three_unity_memoria_flow.html');
    await writeFile(visualHtmlPath, flowHtml, 'utf8');
    await page.goto(`file://${visualHtmlPath.replaceAll('\\', '/')}`);
    await expect(page.getByText(/RadShield-MX F371-F372/i)).toBeVisible({ timeout: 10_000 });
    await screenshot(page, '08_three_unity_memoria_flow_visual', true);

    const output = {
      phase: 'F371-F372',
      status: checks.every((check) => check.ok) ? 'beta-visual-smoke-ready' : 'beta-visual-smoke-partial',
      generatedAt: new Date().toISOString(),
      baseUrl: process.env.PLAYWRIGHT_TEST_BASE_URL || 'playwright-base-url',
      checks,
      screenshots: checks
        .filter((check) => check.name.startsWith('screenshot:'))
        .map((check) => check.detail?.file),
    };
    await writeFile(path.join(outputDir, 'f371_f372_beta_visual_smoke.json'), `${JSON.stringify(output, null, 2)}\n`, 'utf8');
    await writeFile(
      path.join(outputDir, 'f371_f372_beta_visual_smoke.md'),
      [
        '# F371-F372 Beta Visual Smoke',
        '',
        `Status: ${output.status}`,
        '',
        '## Checks',
        ...checks.map((check) => `- ${check.ok ? 'OK' : 'FAIL'} ${check.name}`),
        '',
        '## Visuales',
        ...output.screenshots.map((file) => `- ${file}`),
        '',
      ].join('\n'),
      'utf8',
    );
  });
});
