import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const checks = [];
const expect = (condition, label) => checks.push({ ok: Boolean(condition), label });

const canvas = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const useCanvas = read('src/hooks/useCanvas.ts');
const e2e = read('e2e/f191-pyrate-toolbar.spec.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

expect(canvas.includes('onUpdateSelected?:'), 'CanvasArea exposes optional update callback');
expect(canvas.includes('inspectorEditOpen'), 'F191E keeps editor closed by default');
expect(canvas.includes('f191e-action-edit'), 'F191E edit action exists');
expect(canvas.includes('f191e-inline-editor'), 'F191E inline editor exists');
expect(canvas.includes('f191e-editor-name'), 'F191E edits name');
expect(canvas.includes('f191e-editor-material'), 'F191E edits barrier material');
expect(canvas.includes('f191e-editor-workload'), 'F191E edits source workload');
expect(canvas.includes('f191e-editor-occupancy'), 'F191E edits occupancy');
expect(canvas.includes('f191e-editor-design-goal'), 'F191E edits design goal');
expect(canvas.includes('applyInspectorTextUpdate'), 'F191E text update helper exists');
expect(canvas.includes('applyInspectorNumberUpdate'), 'F191E numeric update helper exists');
expect(canvas.includes('Acciones destructivas siguen fuera de F191E'), 'F191E communicates destructive action guardrail');
expect(!canvas.includes('deleteSelected') && !canvas.includes('duplicateSelected'), 'CanvasArea F191E avoids destructive delete/duplicate wiring');
expect(designer.includes('onUpdateSelected={handleUpdateSelected}'), 'ShieldingDesigner wires update callback to CanvasArea');
expect(designer.includes('OccupiedRegion'), 'ShieldingDesigner update type includes occupied regions');
expect(useCanvas.includes('const region = floorPlan.occupiedRegions.find'), 'useCanvas updateSelected handles occupied regions');
expect(e2e.includes("getByTestId('f191e-action-edit')"), 'F191 smoke validates F191E edit action');
expect(pkg.scripts?.['test:f191e:inline-editor'] === 'node scripts/check-f191e-inline-editor-contracts.mjs', 'package exposes F191E test');
expect(changelog.includes('F191E'), 'changelog documents F191E');
expect(manual.includes('F191E'), 'manual documents F191E');
expect(update.includes('F191E Inline editor'), 'Update Center documents F191E');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}
if (failed.length) {
  console.error(`F191E contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}
console.log('F191E inline editor contracts passed.');
