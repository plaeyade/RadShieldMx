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

expect(canvas.includes('f191d-context-actions'), 'F191D context action rail exists');
expect(canvas.includes('selectedInspectorFocusPoint'), 'F191D computes selected object focus point');
expect(canvas.includes('focusSelectedInspectorEntity'), 'F191D can center selected entity');
expect(canvas.includes('clearInspectorSelection'), 'F191D can clear selection safely');
expect(canvas.includes('f191d-action-material'), 'F191D material action exists');
expect(canvas.includes('f191d-action-calculate'), 'F191D calculate action exists');
expect(canvas.includes('f191d-action-evidence'), 'F191D evidence action exists');
expect(canvas.includes('f191d-action-focus'), 'F191D focus action exists');
expect(canvas.includes('f191d-action-clear'), 'F191D clear action exists');
expect(canvas.includes('hidden 2xl:flex'), 'F191D actions are width-gated to avoid canvas crowding');
expect(!canvas.includes('deleteSelected') && !canvas.includes('duplicateSelected'), 'F191D avoids destructive delete/duplicate wiring');
expect(e2e.includes("getByTestId('f191d-context-actions')"), 'F191 smoke validates F191D actions');
expect(pkg.scripts?.['test:f191d:context-actions'] === 'node scripts/check-f191d-context-actions-contracts.mjs', 'package exposes F191D test');
expect(changelog.includes('F191D'), 'changelog documents F191D');
expect(manual.includes('F191D'), 'manual documents F191D');
expect(update.includes('F191D Context actions'), 'Update Center documents F191D');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}
if (failed.length) {
  console.error(`F191D contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}
console.log('F191D context action contracts passed.');
