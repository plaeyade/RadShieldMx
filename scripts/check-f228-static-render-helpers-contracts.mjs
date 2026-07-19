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

const pkg = JSON.parse(read('package.json') || '{}');
const helper = read(path.join('src', 'lib', 'canvas', 'renderStaticHelpers.ts'));
const useCanvas = read(path.join('src', 'hooks', 'useCanvas.ts'));
const f228 = read(path.join('src', 'lib', 'f228StaticRendererHelpers.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const updateCenter = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');

const contracts = [
  ['package scripts', JSON.stringify(pkg.scripts ?? {}), ['prepare:f228:static-render-helpers', 'test:f228:static-render-helpers']],
  ['helper file', helper, ['drawCanvasBackgroundGrid', 'drawFloorPlanImageLayer', 'drawCanvasScaleHud', 'getF228StaticHelperSummary']],
  ['useCanvas migration', useCanvas, ['drawCanvasBackgroundGrid(ctx', 'drawFloorPlanImageLayer(ctx', 'drawCanvasScaleHud(ctx', 'findGripAtScreen', 'lassoPath']],
  ['f228 lib', f228, ['buildF228StaticRendererHelpers', 'static-render-helpers-ready']],
  ['CanvasArea UI', canvasArea, ['f228-static-renderer-helpers', 'f228-calibration-ready', 'grid/imagen/HUD extraidos']],
  ['Update Center', updateCenter, ['F228 Static render helpers', 'grid/imagen/HUD']],
  ['CHANGELOG', changelog, ['## F228', 'renderStaticHelpers']],
  ['Manual usuario', manual, ['Addendum F228', 'drawCanvasBackgroundGrid']],
  ['Manual versiones', versions, ['## F228', 'static-render-helpers']],
];

for (const [label, text, tokens] of contracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f228_static_render_helpers', 'f228_static_render_helpers.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F228 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f228.static-render-helpers.v1') failures.push('F228 JSON schema mismatch');
  if (payload.status !== 'static-render-helpers-ready') failures.push(`F228 status is ${payload.status}`);
  if (!payload.guardedStillInUseCanvas?.cadOverlays || !payload.guardedStillInUseCanvas?.selectionGrips) {
    failures.push('F228 guardrail failed: overlays/grips must remain in useCanvas');
  }
}

if (failures.length > 0) {
  console.error('F228 static render helpers contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F228 static render helpers contracts passed.');
