import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = file => fs.readFileSync(path.join(root, file), 'utf8');

const checks = [];
function check(name, pass, details = '') {
  checks.push({ name, pass: Boolean(pass), details });
}

const canvasArea = read('src/sections/CanvasArea.tsx');
const designer = read('src/pages/ShieldingDesigner.tsx');
const pkg = JSON.parse(read('package.json'));

check(
  'canvas workflow panel exists',
  canvasArea.includes('data-testid="canvas-workflow-panel"') &&
    canvasArea.includes('Flujo layout blindaje memoria') &&
    canvasArea.includes('workflowSteps'),
  'Expected visible layout -> shielding -> memory workflow overlay.'
);

check(
  'workflow routes core actions',
  ['onImportFloorPlan', 'onOpenRoomTemplates', 'onOpenControlPoints', 'onRunCalculations', 'onOpenEvidencePack']
    .every(token => canvasArea.includes(token)),
  'Expected import, smart rooms, control points, calculate and evidence pack actions.'
);

check(
  'smart room applies geometry',
  designer.includes('applyRoomTemplateToFloorPlan') &&
    designer.includes('template.walls.map') &&
    designer.includes('template.equipment.map') &&
    designer.includes('template.controlledAreas.map'),
  'Expected template-to-floorplan conversion for barriers, sources and regions.'
);

check(
  'template creates calculation-compatible objects',
  ['barrierType', 'designGoal_mSv_per_wk', 'materialCode', 'workloadValue', 'isocenterHeight_m', 'occupiedRegions', 'regions: occupiedRegions']
    .every(token => designer.includes(token)),
  'Expected FloorPlan fields used by canvas, calculations and reports.'
);

check(
  'direct canvas panels render from F70 buttons',
  designer.includes('showLayersPanel &&') &&
    designer.includes('data-testid="f74-canvas-layers-panel"') &&
    designer.includes('showRoomTemplates &&') &&
    designer.includes('onApply={applyRoomTemplateToFloorPlan}'),
  'Expected visible layer/template panels, not only lazy dialog state.'
);

check(
  'control points generated from template zones',
  designer.includes('setControlPoints(occupiedRegions.map') &&
    designer.includes('Control point generated from F74 Smart Room template'),
  'Expected controlled-area centroids to become review/control points.'
);

check(
  'package exposes F74 test',
  pkg.scripts?.['test:f74:floorplan'] === 'node scripts/check-f74-floorplan-workflow-contracts.mjs',
  'Expected npm script for repeatable F74 validation.'
);

const passed = checks.filter(c => c.pass).length;
const outPath = path.join(root, 'outputs', 'f74_floorplan_workflow_contracts.json');
fs.mkdirSync(path.dirname(outPath), { recursive: true });
fs.writeFileSync(outPath, JSON.stringify({ passed, total: checks.length, checks }, null, 2));

if (passed !== checks.length) {
  console.error(`F74 floorplan workflow contracts failed: ${passed}/${checks.length}`);
  for (const c of checks.filter(c => !c.pass)) {
    console.error(`- ${c.name}: ${c.details}`);
  }
  process.exit(1);
}

console.log(`F74 floorplan workflow contracts passed: ${passed}/${checks.length}`);
