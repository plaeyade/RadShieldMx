import { existsSync, readFileSync } from 'node:fs';

const failures = [];
const requiredFiles = [
  'src/lib/f163CanvasClosure.ts',
  'outputs/f163_canvas_release_closure/f163_canvas_release_closure.json',
  'src/sections/dialogs/UpdateAppDialog.tsx',
  'package.json',
];

const read = (file) => readFileSync(file, 'utf8');
for (const file of requiredFiles) {
  if (!existsSync(file)) failures.push(`Missing ${file}`);
}

const lib = existsSync(requiredFiles[0]) ? read(requiredFiles[0]) : '';
for (const token of [
  'buildF163CanvasClosureSummary',
  '511keV RS Designer',
  'floor plan image',
  'ambient dose distribution',
  'remainingBacklog',
  'canvas-release-closed',
]) {
  if (!lib.includes(token)) failures.push(`F163 lib missing ${token}`);
}

const report = existsSync(requiredFiles[1]) ? JSON.parse(read(requiredFiles[1])) : null;
if (report) {
  if (report.phase !== 'F163') failures.push('F163 report phase mismatch');
  if (report.status !== 'canvas-release-closed') failures.push('F163 report not closed');
  for (const token of ['Floorplan image/import workflow', 'Sources/equipment/apparatus', 'Ambient dose heatmap/isocontour']) {
    if (!report.acceptanceGates.join(' ').includes(token)) failures.push(`F163 report missing gate ${token}`);
  }
  if (!report.externalReview.some((item) => item.source.includes('511kev.com/rs-designer'))) failures.push('F163 report missing RS Designer source');
}

const updateApp = existsSync(requiredFiles[2]) ? read(requiredFiles[2]) : '';
for (const token of ['buildF163CanvasClosureSummary', 'f163-canvas-release-closure', 'F163 Canvas/floorplan cierre']) {
  if (!updateApp.includes(token)) failures.push(`UpdateAppDialog missing ${token}`);
}

const pkg = existsSync(requiredFiles[3]) ? read(requiredFiles[3]) : '';
for (const token of ['prepare:f163:canvas-closure', 'test:f163:canvas-closure']) {
  if (!pkg.includes(token)) failures.push(`package.json missing ${token}`);
}

if (failures.length > 0) {
  console.error('F163 canvas release closure contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F163 canvas release closure contracts OK.');
