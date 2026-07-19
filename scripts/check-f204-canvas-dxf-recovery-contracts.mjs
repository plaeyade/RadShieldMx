import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(relativePath) {
  return fs.readFileSync(path.join(root, relativePath), 'utf8');
}

function expect(condition, message) {
  if (!condition) failures.push(message);
}

const designer = read('src/pages/ShieldingDesigner.tsx');
const dxfViewer = read('src/sections/dialogs/DXFViewerDialog.tsx');

expect(designer.includes("localStorage.getItem('radshield_force_welcome')"), 'Canvas should open by default unless welcome is forced');
expect(designer.includes("window.addEventListener('radshield:dxf-imported-floorplan'"), 'ShieldingDesigner must listen for DXF floorplan import event');
expect(designer.includes('resetFloorPlan(nextPlan)'), 'DXF event must reset the current floorplan');
expect(designer.includes('DXF aplicado al canvas'), 'DXF canvas import must notify the operator');

expect(dxfViewer.includes("importDXFToFloorPlan"), 'DXF viewer must use CAD/BIM bridge to map barriers');
expect(dxfViewer.includes("data-testid=\"dxf-apply-to-canvas\""), 'DXF viewer must expose apply-to-canvas button');
expect(dxfViewer.includes("radshield:dxf-imported-floorplan"), 'DXF viewer must dispatch floorplan import event');
expect(dxfViewer.includes("Aplicar al canvas"), 'DXF viewer must label the canvas action clearly');
expect(dxfViewer.includes("mappedBarriers"), 'DXF viewer must expose mapped barrier count');

const packageJson = read('package.json');
expect(packageJson.includes('test:f204:canvas-dxf-recovery'), 'package script missing for F204 canvas/DXF recovery');
expect(packageJson.includes('test:f204:canvas-dxf-smoke'), 'package smoke script missing for F204 canvas/DXF recovery');
expect(fs.existsSync(path.join(root, 'scripts/check-f204-canvas-dxf-recovery-smoke.mjs')), 'F204 smoke script missing');

if (failures.length) {
  console.error('F204 canvas/DXF recovery contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F204 canvas/DXF recovery contracts OK');
