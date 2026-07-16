import fs from 'node:fs';

const read = (path) => fs.readFileSync(path, 'utf8');
const checks = [];
const expect = (condition, label) => checks.push({ ok: Boolean(condition), label });

const canvas = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

expect(canvas.includes('f191-pyrate-inspired-toolbar'), 'F191 toolbar exists');
expect(canvas.includes('f191-cad-tool-group'), 'CAD tool group exists');
expect(canvas.includes('f191-clinical-action-group'), 'clinical action group exists');
expect(canvas.includes('f191-visual-mode-switcher'), 'visual mode switcher exists');
expect(canvas.includes('F191_VISUAL_MODE_KEY'), 'visual mode persists');
expect(canvas.includes("type F191VisualMode = 'plan' | 'heat' | 'isocontours' | 'structure'"), 'visual modes are explicit');
expect(canvas.includes('applyVisualMode'), 'visual mode handler exists');
expect(canvas.includes('activateCanvasTool'), 'tool activation handler exists');
for (const token of ["['select', 'Sel'", "['barrier', 'Muro'", "['source', 'Fuente'", "['region', 'Zona'", "['measure', 'Medir'", "['pan', 'Pan'"]) {
  expect(canvas.includes(token), `${token} exists`);
}
expect(canvas.includes('data-testid={`f191-tool-${tool}`}'), 'tool data-testid template exists');
for (const token of ["['plan', 'Plano'", "['heat', 'Heat'", "['isocontours', 'Iso'", "['structure', 'Estruct'"]) {
  expect(canvas.includes(token), `${token} exists`);
}
expect(canvas.includes('data-testid={`f191-visual-mode-${mode}`}'), 'visual mode data-testid template exists');
expect(designer.includes('setActiveTool={(tool) => setActiveTool(tool as Tool)}'), 'ShieldingDesigner passes setActiveTool to CanvasArea');
expect(pkg.scripts?.['test:f191:pyrate-toolbar'] === 'node scripts/check-f191-pyrate-toolbar-contracts.mjs', 'package exposes F191 test');
expect(changelog.includes('F191'), 'changelog documents F191');
expect(manual.includes('F191'), 'manual documents F191');
expect(update.includes('F191 pyrateShield-inspired toolbar'), 'Update Center documents F191');

const failed = checks.filter((check) => !check.ok);
for (const check of checks) {
  console.log(`${check.ok ? 'OK' : 'FAIL'} ${check.label}`);
}
if (failed.length) {
  console.error(`F191 contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}
console.log('F191 pyrateShield-inspired toolbar contracts passed.');
