import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f221_canvas_real_connections');
const jsonPath = path.join(outDir, 'f221_canvas_real_connections.json');
const mdPath = path.join(root, 'outputs', 'fase_221_canvas_real_connections.md');

const files = {
  useCanvas: path.join(root, 'src', 'hooks', 'useCanvas.ts'),
  canvasArea: path.join(root, 'src', 'sections', 'CanvasArea.tsx'),
  designer: path.join(root, 'src', 'pages', 'ShieldingDesigner.tsx'),
  f220: path.join(root, 'src', 'lib', 'f220CanvasCadPriorityActions.ts'),
  f221: path.join(root, 'src', 'lib', 'f221CanvasRealConnections.ts'),
};

function read(file) {
  return fs.existsSync(file) ? fs.readFileSync(file, 'utf8') : '';
}

function hasAll(text, tokens) {
  return tokens.every((token) => text.includes(token));
}

const useCanvas = read(files.useCanvas);
const canvasArea = read(files.canvasArea);
const designer = read(files.designer);
const f220 = read(files.f220);
const f221 = read(files.f221);

const checks = [
  {
    id: 'grip-drag',
    status: hasAll(useCanvas, ['findGripAtScreen', 'barrier-start', 'barrier-mid', 'barrier-end', 'source-move', 'source-rotate']) ? 'ready' : 'missing',
    evidence: 'Detecta y arrastra grips de barrera/fuente desde useCanvas.',
  },
  {
    id: 'advanced-snapping',
    status: hasAll(useCanvas, ['snapAdvanced', 'endpoint', 'midpoint', 'perpendicular', 'intersection', 'equipment-center', 'angle15']) ? 'ready' : 'missing',
    evidence: 'Snap avanzado cubre geometria, centros de equipo y bloqueo angular.',
  },
  {
    id: 'window-lasso-selection',
    status: hasAll(useCanvas, ['selection-window', 'selection-lasso', 'lassoPath', 'selectionWindow', 'pointInPolygon']) ? 'ready' : 'missing',
    evidence: 'Seleccion por ventana/lasso existe con geometria de poligono.',
  },
  {
    id: 'inline-edit',
    status: hasAll(canvasArea + designer, ['onUpdateSelected', 'handleUpdateSelected', 'applyInspectorTextUpdate', 'applyInspectorNumberUpdate']) ? 'ready' : 'missing',
    evidence: 'Inspector inline esta conectado al estado del floorplan.',
  },
  {
    id: 'medical-3d',
    status: hasAll(canvasArea + designer, ['onOpenMedical3D', 'medicalFloorPlan3D']) ? 'partial' : 'missing',
    evidence: 'Handoff al visor 3D medico existe; falta sync bidireccional completa.',
  },
  {
    id: 'f220-real-language',
    status: hasAll(f220, ['Endpoint, midpoint, perpendicular', 'ventana/lasso disponibles', 'Footprints y rotacion']) ? 'ready' : 'missing',
    evidence: 'F220 ya no describe como pendiente lo que existe en useCanvas.',
  },
  {
    id: 'f221-ui',
    status: hasAll(canvasArea + f221, ['f221-canvas-real-connections', 'buildF221CanvasRealConnections', 'rendererUpgradeDecision']) ? 'ready' : 'missing',
    evidence: 'El canvas expone chips auditables de conexiones reales.',
  },
];

const readyCount = checks.filter((check) => check.status === 'ready').length;
const missingCount = checks.filter((check) => check.status === 'missing').length;
const partialCount = checks.filter((check) => check.status === 'partial').length;

const payload = {
  schema: 'radshield-mx.f221.canvas-real-connections.v1',
  phase: 'F221',
  generatedAt: new Date().toISOString(),
  status: missingCount === 0 ? 'canvas-real-connections-ready' : 'canvas-real-connections-blocked',
  summary: {
    readyCount,
    partialCount,
    missingCount,
  },
  checks,
  rendererUpgradeDecision:
    'Se puede mejorar renderer/eventos base despues de F221, pero en dos pasos: extraer render/layers primero y luego event controller con feature flag y smoke de drag/snap/lasso.',
  nextPhases: [
    'F222 renderer helpers/layers: extraer dibujo de grid, objetos, overlays, heatmap y grips sin cambiar eventos.',
    'F223 event controller behind flag: normalizar pointer events, drag state y snapping con rollback.',
    'F224 canvas interaction e2e: Playwright para grip drag, snap endpoint/midpoint/interseccion, lasso y export.',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    '# F221 Canvas Real Connections',
    '',
    `Estado: ${payload.status}`,
    '',
    '## Verificacion',
    ...checks.map((check) => `- ${check.id}: ${check.status} - ${check.evidence}`),
    '',
    '## Decision renderer/eventos',
    payload.rendererUpgradeDecision,
    '',
    '## Siguientes fases seguras',
    ...payload.nextPhases.map((phase) => `- ${phase}`),
    '',
  ].join('\n'),
);

console.log(`F221 canvas real connections: ${payload.status}`);
console.log(jsonPath);
