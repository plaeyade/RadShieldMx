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
const registry = read(path.join('src', 'lib', 'canvas', 'renderLayerRegistry.ts'));
const f227 = read(path.join('src', 'lib', 'f227CanvasRendererLayerExtraction.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const updateCenter = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');

const contracts = [
  ['package scripts', JSON.stringify(pkg.scripts ?? {}), ['prepare:f227:renderer-layers', 'test:f227:renderer-layers']],
  ['registry', registry, ['CANVAS_RENDER_LAYER_REGISTRY', 'background-grid', 'floorplan-image', 'selection-grips', 'cad-overlays', 'summarizeCanvasRenderLayerRegistry']],
  ['f227 lib', f227, ['buildF227CanvasRendererLayerExtraction', 'safeFirstLayers', 'guardedLayers', 'renderer-layer-extraction-ready']],
  ['CanvasArea', canvasArea, ['buildF227CanvasRendererLayerExtraction', 'f227-renderer-layer-extraction', 'f227-layer-count', 'overlays/grips siguen protegidos']],
  ['Update Center', updateCenter, ['F227 Renderer layer extraction', 'render layer registry']],
  ['CHANGELOG', changelog, ['## F227', 'renderLayerRegistry']],
  ['Manual usuario', manual, ['Addendum F227', 'background-grid']],
  ['Manual versiones', versions, ['## F227', 'renderer-layer-extraction']],
];

for (const [label, text, tokens] of contracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f227_renderer_layer_extraction', 'f227_renderer_layer_extraction.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F227 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f227.renderer-layer-extraction.v1') failures.push('F227 JSON schema mismatch');
  if (payload.status !== 'renderer-layer-extraction-ready') failures.push(`F227 status is ${payload.status}`);
  if ((payload.missingLayers ?? []).length !== 0) failures.push('F227 has missing layers');
}

if (failures.length > 0) {
  console.error('F227 renderer layer extraction contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F227 renderer layer extraction contracts passed.');
