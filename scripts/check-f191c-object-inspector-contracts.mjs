import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const checks = [];
const expect = (condition, label) => checks.push({ ok: Boolean(condition), label });

const canvas = read('src/sections/CanvasArea.tsx');
const e2e = read('e2e/f191-pyrate-toolbar.spec.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

expect(canvas.includes('f191c-object-inspector'), 'F191C object inspector exists');
expect(canvas.includes('f191c-inspector-type'), 'F191C inspector type exists');
expect(canvas.includes('f191c-inspector-name'), 'F191C inspector name exists');
expect(canvas.includes('f191c-inspector-chip'), 'F191C inspector chips exist');
expect(canvas.includes('selectedBarrier'), 'F191C resolves selected barrier');
expect(canvas.includes('selectedSource'), 'F191C resolves selected source');
expect(canvas.includes('selectedCriticalPoint'), 'F191C resolves selected critical point');
expect(canvas.includes('selectedRegion'), 'F191C resolves selected region');
expect(canvas.includes('formatInspectorThickness'), 'F191C formats barrier thickness');
expect(canvas.includes('buildInspectorRows'), 'F191C builds contextual rows');
expect(canvas.includes('aria-label="Inspector contextual del objeto seleccionado en canvas"'), 'F191C exposes accessible label');
expect(e2e.includes("getByTestId('f191c-object-inspector')"), 'F191 smoke validates inspector visibility');
expect(pkg.scripts?.['test:f191c:object-inspector'] === 'node scripts/check-f191c-object-inspector-contracts.mjs', 'package exposes F191C test');
expect(changelog.includes('F191C'), 'changelog documents F191C');
expect(manual.includes('F191C'), 'manual documents F191C');
expect(update.includes('F191C Object inspector'), 'Update Center documents F191C');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}
if (failed.length) {
  console.error(`F191C contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}
console.log('F191C object inspector contracts passed.');
