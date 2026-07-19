import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const requiredFiles = [
  path.join(root, 'src', 'lib', 'f221CanvasRealConnections.ts'),
  path.join(root, 'src', 'sections', 'CanvasArea.tsx'),
  path.join(root, 'src', 'hooks', 'useCanvas.ts'),
  path.join(root, 'src', 'pages', 'ShieldingDesigner.tsx'),
  path.join(root, 'outputs', 'f221_canvas_real_connections', 'f221_canvas_real_connections.json'),
  path.join(root, 'outputs', 'fase_221_canvas_real_connections.md'),
];

const failures = [];

for (const file of requiredFiles) {
  if (!fs.existsSync(file)) failures.push(`Missing file: ${path.relative(root, file)}`);
}

function read(relPath) {
  const file = path.join(root, relPath);
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

const useCanvas = read(path.join('src', 'hooks', 'useCanvas.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const designer = read(path.join('src', 'pages', 'ShieldingDesigner.tsx'));
const updateApp = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const pkg = JSON.parse(read('package.json') || '{}');

const tokenContracts = [
  ['useCanvas grip drag', useCanvas, ['findGripAtScreen', 'barrier-start', 'barrier-mid', 'barrier-end', 'source-move', 'source-rotate']],
  ['useCanvas advanced snap', useCanvas, ['snapAdvanced', 'endpoint', 'midpoint', 'perpendicular', 'intersection', 'equipment-center', 'angle15']],
  ['useCanvas window/lasso', useCanvas, ['selection-window', 'selection-lasso', 'lassoPath', 'selectionWindow', 'pointInPolygon']],
  ['CanvasArea f221 UI', canvasArea, ['buildF221CanvasRealConnections', 'f221-canvas-real-connections', 'f221-real-${connection.id}', 'Renderer: capas primero, eventos con flag']],
  ['Designer handoff', designer, ['onOpenMedical3D', 'onUpdateSelected={handleUpdateSelected}', 'onDuplicateSelected={handleDuplicateSelected}', 'onDeleteSelected={deleteSelected}']],
  ['Update Center F221', updateApp, ['F221 Canvas real connections', 'grips, snap, lasso']],
  ['CHANGELOG F221', changelog, ['## F221', 'renderer/eventos base']],
  ['Manual F221', manual, ['Addendum F221', 'Ctrl/Meta+arrastre']],
  ['Versiones F221', versions, ['## F221', 'canvas-real-connections']],
];

for (const [label, text, tokens] of tokenContracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

for (const scriptName of ['prepare:f221:canvas-real-connections', 'test:f221:canvas-real-connections']) {
  if (!pkg.scripts?.[scriptName]) failures.push(`package.json missing script ${scriptName}`);
}

const jsonPath = path.join(root, 'outputs', 'f221_canvas_real_connections', 'f221_canvas_real_connections.json');
if (fs.existsSync(jsonPath)) {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f221.canvas-real-connections.v1') failures.push('F221 JSON schema mismatch');
  if (payload.status !== 'canvas-real-connections-ready') failures.push(`F221 status is ${payload.status}`);
  if ((payload.summary?.missingCount ?? 1) !== 0) failures.push('F221 missingCount is not zero');
}

if (failures.length > 0) {
  console.error('F221 canvas real connections contract failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F221 canvas real connections contracts passed.');
