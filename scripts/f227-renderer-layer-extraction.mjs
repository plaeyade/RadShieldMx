import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f227_renderer_layer_extraction');
const jsonPath = path.join(outDir, 'f227_renderer_layer_extraction.json');
const mdPath = path.join(root, 'outputs', 'fase_227_renderer_layer_extraction.md');

function read(relPath) {
  const fullPath = path.join(root, relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

const registry = read(path.join('src', 'lib', 'canvas', 'renderLayerRegistry.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const canvasRenderer = read(path.join('src', 'lib', 'canvas', 'CanvasRenderer.ts'));

const requiredLayers = [
  'background-grid',
  'floorplan-image',
  'regions-zones',
  'barriers',
  'equipment-sources',
  'heatmap',
  'sample-lines',
  'cad-overlays',
  'selection-grips',
  'hud-scale',
];

const layerPresence = requiredLayers.map((id) => ({ id, present: registry.includes(id) }));
const missingLayers = layerPresence.filter((layer) => !layer.present).map((layer) => layer.id);

const payload = {
  schema: 'radshield-mx.f227.renderer-layer-extraction.v1',
  phase: 'F227',
  generatedAt: new Date().toISOString(),
  status: missingLayers.length === 0 && canvasArea.includes('f227-renderer-layer-extraction')
    ? 'renderer-layer-extraction-ready'
    : 'renderer-layer-extraction-blocked',
  requiredLayers,
  missingLayers,
  evidence: {
    hasRegistry: registry.includes('CANVAS_RENDER_LAYER_REGISTRY'),
    hasSummary: registry.includes('summarizeCanvasRenderLayerRegistry'),
    canvasAreaWired: canvasArea.includes('buildF227CanvasRendererLayerExtraction') && canvasArea.includes('f227-renderer-layer-extraction'),
    existingCanvasRenderer: canvasRenderer.includes('class CanvasRenderer') && canvasRenderer.includes('drawEquipmentFootprint'),
    guardedLayers: ['cad-overlays', 'selection-grips'],
  },
  nextSafeStep:
    'F228 puede extraer background-grid y hud-scale como helpers puros. No migrar cad-overlays ni selection-grips hasta E2E.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    '# F227 Renderer Layer Extraction',
    '',
    `Estado: ${payload.status}`,
    '',
    '## Capas',
    ...layerPresence.map((layer) => `- ${layer.id}: ${layer.present ? 'present' : 'missing'}`),
    '',
    '## Evidencia',
    ...Object.entries(payload.evidence).map(([key, value]) => `- ${key}: ${Array.isArray(value) ? value.join(', ') : value}`),
    '',
    '## Siguiente paso seguro',
    payload.nextSafeStep,
    '',
  ].join('\n'),
);

console.log(`F227 renderer layer extraction: ${payload.status}`);
console.log(jsonPath);
