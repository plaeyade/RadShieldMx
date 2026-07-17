import fs from 'node:fs';

const read = (file) => fs.readFileSync(file, 'utf8');
const canvas = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const useCanvas = read('src/hooks/useCanvas.ts');
const spec = read('e2e/f191g-duplicate-delete-confirm.spec.ts');
const pkg = JSON.parse(read('package.json'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_VERSIONES_v50.md');
const update = read('src/sections/dialogs/UpdateAppDialog.tsx');

const checks = [];
const expect = (label, condition) => checks.push({ label, condition: Boolean(condition) });

expect('CanvasArea exposes duplicate callback', canvas.includes('onDuplicateSelected?: () => void'));
expect('CanvasArea exposes delete callback', canvas.includes('onDeleteSelected?: () => void'));
expect('CanvasArea has duplicate action test id', canvas.includes('f191g-action-duplicate'));
expect('CanvasArea has delete action test id', canvas.includes('f191g-action-delete'));
expect('CanvasArea confirms duplicate', canvas.includes('Duplicar') && canvas.includes('window.confirm'));
expect('CanvasArea confirms delete with undo hint', canvas.includes('Borrar') && canvas.includes('Ctrl+Z'));
expect('ShieldingDesigner implements duplication', designer.includes('const handleDuplicateSelected = useCallback'));
expect('ShieldingDesigner wires duplicate callback', designer.includes('onDuplicateSelected={handleDuplicateSelected}'));
expect('ShieldingDesigner wires delete callback', designer.includes('onDeleteSelected={deleteSelected}'));
expect('Duplication supports sources', designer.includes('sources: [...prev.sources, next]'));
expect('Duplication supports barriers', designer.includes('barriers: [...prev.barriers, next]'));
expect('Duplication supports critical points', designer.includes('criticalPoints: [...(prev.criticalPoints ?? []), next]'));
expect('Duplication supports occupied regions', designer.includes('occupiedRegions: [...prev.occupiedRegions, next]'));
expect('Region delete keeps alias in sync', useCanvas.includes('const newAliasRegions = floorPlan.regions?.filter') && useCanvas.includes('regions: newAliasRegions ?? floorPlan.regions'));
expect('F191G smoke spec exists', spec.includes('F191G duplicates and deletes selected object with confirmation'));
expect('F191G smoke validates canvas', spec.includes('f100-main-floorplan-canvas'));
expect('F191G smoke validates sidebar', spec.includes('Herramientas de Dibujo'));
expect('F191G smoke accepts duplicate confirm', spec.includes("expect(dialog.message()).toContain('Duplicar')"));
expect('F191G smoke accepts delete confirm', spec.includes("expect(dialog.message()).toContain('Borrar')"));
expect('F191G smoke stores evidence', spec.includes('f191g-duplicate-delete-confirm.png'));
expect('package exposes F191G contract', pkg.scripts?.['test:f191g:duplicate-delete-contracts'] === 'node scripts/check-f191g-duplicate-delete-contracts.mjs');
expect('package exposes F191G smoke', pkg.scripts?.['test:f191g:duplicate-delete-smoke'] === 'playwright test e2e/f191g-duplicate-delete-confirm.spec.ts --project=chromium');
expect('changelog documents F191G', changelog.includes('F191G'));
expect('manual documents F191G', manual.includes('F191G'));
expect('Update Center documents F191G', update.includes('F191G Duplicate/delete confirmed'));

const failed = checks.filter((check) => !check.condition);
if (failed.length) {
  console.error(`F191G contract failed: ${failed.map((check) => check.label).join(', ')}`);
  process.exit(1);
}

console.log('F191G duplicate/delete contracts passed.');
