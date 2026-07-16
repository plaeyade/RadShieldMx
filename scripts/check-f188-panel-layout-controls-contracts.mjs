import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');

const checks = [];
const expect = (condition, label) => {
  checks.push({ label, ok: Boolean(condition) });
};

const sidebar = read('src/sections/Sidebar.tsx');
const canvas = read('src/sections/CanvasArea.tsx');
const packageJson = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const updateCenter = read('src/sections/dialogs/UpdateAppDialog.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');

expect(sidebar.includes('radshield_sidebar_width_f188'), 'sidebar persists adjustable width');
expect(sidebar.includes('f188-sidebar-width-controls'), 'sidebar exposes width controls');
expect(sidebar.includes('data-f188-sidebar-resizable="true"'), 'sidebar keeps F188 resizable marker');
expect(sidebar.includes('f186-sidebar-stable-width'), 'sidebar preserves F186 stable test id');
expect(sidebar.includes('f186-sidebar-collapsed-stable'), 'sidebar preserves collapsed stable width');

expect(canvas.includes('radshield_canvas_panels_f188'), 'canvas persists panel visibility');
expect(canvas.includes('radshield_canvas_workflow_dock_f188'), 'canvas persists workflow dock');
expect(canvas.includes('f188-canvas-panel-controls'), 'canvas exposes panel visibility controls');
expect(canvas.includes('f188-hidden-panel-restore'), 'canvas exposes hidden panel restore controls');
expect(canvas.includes('f188-workflow-dock-button'), 'canvas exposes safe move/dock control');
expect(canvas.includes("setPanelVisible('workflow', false)"), 'workflow panel can close');
expect(canvas.includes("setPanelVisible('qa', false)"), 'QA panel can close');
expect(canvas.includes("setPanelVisible('continuity', false)"), 'continuity panel can close');
expect(canvas.includes("workflowDock === 'right'"), 'workflow panel can move to right dock');

expect(packageJson.scripts?.['test:f188:panel-layout'] === 'node scripts/check-f188-panel-layout-controls-contracts.mjs', 'package exposes F188 contract test');
expect(changelog.includes('F188'), 'changelog documents F188');
expect(manual.includes('F188'), 'manual de versiones documents F188');
expect(updateCenter.includes('F188 Panel layout controls'), 'Update Center documents F188');
expect(designer.includes('Demo - R&F Room (RadShield Fig.6)'), 'demo R&F room remains available');
expect(designer.includes('Tutorial: R&F Room cargado'), 'demo R&F loader toast remains available');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}

if (failed.length > 0) {
  console.error(`F188 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F188 panel layout controls contracts passed.');
