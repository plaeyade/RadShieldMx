import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const checks = [];
const expect = (condition, label) => checks.push({ ok: Boolean(condition), label });

const spec = read('e2e/f191f-inline-editor-real-selection.spec.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

expect(spec.includes('F191F validates real selected-object inline editing'), 'F191F smoke spec exists');
expect(spec.includes('f100-main-floorplan-canvas'), 'F191F validates canvas visibility');
expect(spec.includes('Herramientas de Dibujo'), 'F191F validates sidebar visibility');
expect(spec.includes('f191-tool-select'), 'F191F switches to select tool');
expect(spec.includes('Agregar punto critico de evaluacion'), 'F191F creates/selects a real critical point object');
expect(spec.includes("toContainText('Punto')"), 'F191F verifies selected object type before editing');
expect(spec.includes('f191e-action-edit'), 'F191F opens F191E edit action');
expect(spec.includes('f191e-editor-name'), 'F191F edits selected object name');
expect(spec.includes('f191c-inspector-name'), 'F191F verifies inspector reflects edit');
expect(spec.includes('f191f-inline-editor-real-selection.png'), 'F191F stores visual evidence');
expect(pkg.scripts?.['test:f191f:inline-editor-smoke'] === 'playwright test e2e/f191f-inline-editor-real-selection.spec.ts --project=chromium', 'package exposes F191F smoke');
expect(pkg.scripts?.['test:f191f:inline-editor-contracts'] === 'node scripts/check-f191f-inline-editor-smoke-contracts.mjs', 'package exposes F191F contract');
expect(changelog.includes('F191F'), 'changelog documents F191F');
expect(manual.includes('F191F'), 'manual documents F191F');
expect(update.includes('F191F Inline editor smoke'), 'Update Center documents F191F');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}
if (failed.length) {
  console.error(`F191F contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}
console.log('F191F inline editor smoke contracts passed.');
