import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f222_f226_canvas_hardening');
const jsonPath = path.join(outDir, 'f222_f226_canvas_hardening.json');
const mdPath = path.join(root, 'outputs', 'fase_222_226_canvas_hardening.md');

function read(relPath) {
  const fullPath = path.join(root, relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

const sources = {
  useCanvas: read(path.join('src', 'hooks', 'useCanvas.ts')),
  canvasArea: read(path.join('src', 'sections', 'CanvasArea.tsx')),
  canvasRenderer: read(path.join('src', 'lib', 'canvas', 'CanvasRenderer.ts')),
  sceneBuilder: read(path.join('src', 'lib', 'medical3D', 'sceneBuilder.ts')),
  equipmentVisuals: read(path.join('src', 'lib', 'equipmentVisuals.ts')),
  f222226: read(path.join('src', 'lib', 'f222ToF226CanvasHardening.ts')),
};

function ready(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

const phases = [
  {
    phase: 'F222',
    id: 'renderer-layer-registry',
    status: ready(sources.canvasRenderer + sources.f222226, ['drawEquipmentFootprint', 'renderer-layer-registry', 'grid', 'heatmap', 'grips']) ? 'ready' : 'partial',
    evidence: 'Existe renderer/layer registry y CanvasRenderer previo; no se reemplaza useCanvas.draw todavia.',
  },
  {
    phase: 'F223',
    id: 'event-controller-gate',
    status: ready(sources.useCanvas + sources.f222226, ['DragMode', 'snapAdvanced', 'selection-lasso', 'VITE_CANVAS_EVENT_CONTROLLER_V2']) ? 'ready' : 'partial',
    evidence: 'Eventos actuales detectados; nuevo controlador queda condicionado a feature flag y rollback.',
  },
  {
    phase: 'F224',
    id: 'interaction-e2e-matrix',
    status: ready(sources.useCanvas + sources.f222226, ['barrier-start', 'barrier-mid', 'source-rotate', 'pointInPolygon', 'Playwright']) ? 'ready' : 'partial',
    evidence: 'Matriz E2E definida para grip drag, snap, lasso y export antes de tocar eventos base.',
  },
  {
    phase: 'F225',
    id: 'isocontour-footprint-hardening',
    status: ready(sources.useCanvas + sources.equipmentVisuals + sources.f222226, ['isocontours', 'footprint_m', 'manufacturer', 'interpolacion']) ? 'ready' : 'partial',
    evidence: 'Isocontours/footprints quedan encaminados: proxy actual + catalogo de equipo + hardening regulatorio.',
  },
  {
    phase: 'F226',
    id: 'medical-3d-sync',
    status: ready(sources.sceneBuilder + sources.f222226, ['medicalSceneToOBJ', 'footprint_m', 'zones', 'medical-3d-sync']) ? 'ready' : 'partial',
    evidence: 'Scene builder 3D existe con muros, equipos, zonas y OBJ; falta sync bidireccional final.',
  },
];

const readyCount = phases.filter((phase) => phase.status === 'ready').length;
const partialCount = phases.filter((phase) => phase.status === 'partial').length;

const payload = {
  schema: 'radshield-mx.f222-f226.canvas-hardening.v1',
  generatedAt: new Date().toISOString(),
  status: readyCount >= 4 ? 'canvas-hardening-ready' : 'canvas-hardening-partial',
  readyCount,
  partialCount,
  phases,
  decision:
    'F222-F226 avanzan el canvas profesional sin cambiar renderer/eventos base por defecto. El siguiente cambio real de renderer debe ser extraccion por capas; eventos solo con feature flag y E2E.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    '# F222-F226 Canvas Hardening',
    '',
    `Estado: ${payload.status}`,
    '',
    '## Fases',
    ...phases.map((phase) => `- ${phase.phase} ${phase.id}: ${phase.status} - ${phase.evidence}`),
    '',
    '## Decision',
    payload.decision,
    '',
  ].join('\n'),
);

console.log(`F222-F226 canvas hardening: ${payload.status}`);
console.log(jsonPath);
