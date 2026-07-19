import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const failures = [];

function read(relPath) {
  const fullPath = path.join(root, relPath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`Missing ${relPath}`);
    return '';
  }
  return fs.readFileSync(fullPath, 'utf8');
}

const packageJson = JSON.parse(read('package.json') || '{}');
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const hardening = read(path.join('src', 'lib', 'f222ToF226CanvasHardening.ts'));
const useCanvas = read(path.join('src', 'hooks', 'useCanvas.ts'));
const renderer = read(path.join('src', 'lib', 'canvas', 'CanvasRenderer.ts'));
const sceneBuilder = read(path.join('src', 'lib', 'medical3D', 'sceneBuilder.ts'));
const updateCenter = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');

const contracts = [
  ['package scripts', JSON.stringify(packageJson.scripts ?? {}), ['prepare:f222-f226:canvas-hardening', 'test:f222-f226:canvas-hardening']],
  ['CanvasArea UI', canvasArea, ['buildF222ToF226CanvasHardening', 'f222-f226-canvas-hardening', 'f222-f226-${item.phase.toLowerCase()}-${item.id}', 'renderer/helpers, events flag, E2E, iso/3D']],
  ['hardening lib', hardening, ['F222', 'F223', 'F224', 'F225', 'F226', 'VITE_CANVAS_EVENT_CONTROLLER_V2', 'canvas-hardening-bridge']],
  ['renderer tokens', renderer, ['drawEquipmentFootprint', 'drawBarrier', 'drawSource']],
  ['useCanvas event tokens', useCanvas, ['DragMode', 'snapAdvanced', 'selection-lasso', 'source-rotate']],
  ['3D scene tokens', sceneBuilder, ['medicalSceneToOBJ', 'footprint_m', 'zones']],
  ['Update Center', updateCenter, ['F222-F226 Canvas hardening', 'renderer helpers']],
  ['CHANGELOG', changelog, ['## F222-F226', 'feature flag']],
  ['manual usuario', manual, ['Addendum F222-F226', 'VITE_CANVAS_EVENT_CONTROLLER_V2']],
  ['manual versiones', versions, ['## F222-F226', 'canvas-hardening']],
];

for (const [label, text, tokens] of contracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f222_f226_canvas_hardening', 'f222_f226_canvas_hardening.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F222-F226 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f222-f226.canvas-hardening.v1') failures.push('F222-F226 JSON schema mismatch');
  if (!['canvas-hardening-ready', 'canvas-hardening-partial'].includes(payload.status)) failures.push(`Unexpected F222-F226 status ${payload.status}`);
  if ((payload.phases ?? []).length !== 5) failures.push('F222-F226 must contain exactly five phases');
}

if (failures.length > 0) {
  console.error('F222-F226 canvas hardening contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F222-F226 canvas hardening contracts passed.');
