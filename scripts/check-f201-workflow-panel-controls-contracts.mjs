import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const canvas = read('src/sections/CanvasArea.tsx');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const userManual = read('MANUAL_USUARIO_v99.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, ok: Boolean(condition) });

expect('F201 compact state key persists', canvas.includes('radshield_canvas_workflow_compact_f201'));
expect('F201 dock supports bottom', canvas.includes("type F188WorkflowDock = 'top' | 'right' | 'bottom'"));
expect('F201 loads bottom dock', canvas.includes("stored === 'right' || stored === 'bottom'"));
expect('F201 cycles dock top/right/bottom', canvas.includes("dock === 'top' ? 'right' : dock === 'right' ? 'bottom' : 'top'"));
expect('F201 exposes compact button', canvas.includes('data-testid="f201-workflow-compact-button"'));
expect('F201 exposes close button', canvas.includes('data-testid="f201-workflow-close-button"'));
expect('F201 reuses dock button', canvas.includes('data-testid="f188-workflow-dock-button"'));
expect('F201 panel can close workflow', canvas.includes("setPanelVisible('workflow', false)"));
expect('F201 panel can compact body', canvas.includes('{!workflowCompact && ('));
expect('F201 bottom dock class exists', canvas.includes("workflowDock === 'bottom'"));
expect('F201 right dock avoids legend overlap', canvas.includes('top-14 right-2'));
expect('F201 workflow panel stays above legend', canvas.includes('shadow-sm z-30'));
expect('Package exposes F201 contract', pkg.scripts?.['test:f201:workflow-panel'] === 'node scripts/check-f201-workflow-panel-controls-contracts.mjs');
expect('Package exposes F201 smoke', pkg.scripts?.['test:f201:workflow-panel-smoke'] === 'node scripts/check-f201-workflow-panel-smoke.mjs');
expect('Changelog documents F201', changelog.includes('F201'));
expect('Manual versions documents F201', manual.includes('F201'));
expect('User manual documents F201', userManual.includes('F201'));
expect('Update Center documents F201', update.includes('F201 Workflow panel controls'));

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}

if (failed.length > 0) {
  console.error(`F201 workflow panel controls contracts failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F201 workflow panel controls contracts passed.');
