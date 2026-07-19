import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const toolbar = read('src/sections/Toolbar.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const canvas = read('src/sections/CanvasArea.tsx');
const sidebar = read('src/sections/Sidebar.tsx');
const qa = read('src/lib/f197OutputIntegrationQa.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

const archivoLabels = [
  "t('file.new')",
  "t('file.open')",
  "t('btn.save')",
  "t('file.import.csv')",
  "t('file.import.dxf')",
  "t('file.import.step')",
  "t('file.export.csv')",
  'Exportar PDF',
  'Compartir resultados',
  'Exportar Reporte CNSNS',
  "t('file.techSpecs')",
  "t('file.auditTrail')",
  "t('file.logAnalysis')",
  'Glosario',
  'Acerca de',
];

for (const label of archivoLabels) {
  expect(`Archivo menu contains ${label}`, toolbar.includes(label));
}

const requiredHandlers = [
  'onNewProject',
  'onProjects',
  'onSaveProject',
  'onBatchImport',
  'onDXFViewer',
  'onSTEPImporter',
  'onExport',
  'onPDF',
  'onShare',
  'onCNSNS',
  'onTechSpecs',
  'onAuditTrail',
  'onLogFileAnalysis',
  'onGlossary',
  'onAbout',
];

for (const handler of requiredHandlers) {
  expect(`Toolbar Archivo uses ${handler}`, toolbar.includes(`onClick={${handler}}`));
  expect(`ShieldingDesigner passes ${handler}`, designer.includes(`${handler}={`));
}

expect('Archivo is only retained visible legacy menu', toolbar.includes(".filter((menu) => [t('menu.file')].includes(String(menu.label)))"));
expect('Canvas exposes main floorplan test id', canvas.includes('data-testid="f100-main-floorplan-canvas"'));
expect('Canvas exposes F191 toolbar test id', canvas.includes('data-testid="f191-pyrate-inspired-toolbar"'));
expect('Canvas exposes workflow panel', canvas.includes('data-testid="canvas-workflow-panel"'));
expect('Canvas exposes hidden panel restore', canvas.includes('data-testid="f188-hidden-panel-restore"'));
expect('Canvas persists F188 panel state', canvas.includes('radshield_canvas_panels_f188'));
expect('Canvas persists F188 workflow dock', canvas.includes('radshield_canvas_workflow_dock_f188'));
expect('Sidebar exposes stable width test id', sidebar.includes('data-testid="f186-sidebar-stable-width"'));
expect('Sidebar exposes collapsed recovery test id', sidebar.includes('data-testid="f186-sidebar-collapsed-stable"'));
expect('Sidebar width key is bounded', sidebar.includes('MIN_SIDEBAR_WIDTH') && sidebar.includes('MAX_SIDEBAR_WIDTH') && sidebar.includes('clampSidebarWidth'));
expect('F197QA module links evidence gate', qa.includes('buildF125CalculationEvidenceGate'));
expect('F197QA module links comparison gate', qa.includes('buildF195CalculationComparisonGate'));
expect('F197QA module links F196 cache', qa.includes('CALCULATION_CACHE_VERSION'));
expect('Package exposes F197 contracts', pkg.scripts?.['test:f197:menu-canvas'] === 'node scripts/check-f197-menu-canvas-contracts.mjs');
expect('Package exposes F197 smoke', pkg.scripts?.['test:f197:menu-canvas-smoke'] === 'node scripts/check-f197-menu-canvas-smoke.mjs');
expect('Changelog documents F197', changelog.includes('F197'));
expect('Manual versions documents F197', manual.includes('F197'));
expect('User manual documents F197 recovery', userManual.includes('F197'));
expect('Update Center documents F197', update.includes('F197 Menu/canvas/output QA'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F197 menu/canvas contracts failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F197 menu/canvas contracts passed.');
