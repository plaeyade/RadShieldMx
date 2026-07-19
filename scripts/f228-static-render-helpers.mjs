import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f228_static_render_helpers');
const jsonPath = path.join(outDir, 'f228_static_render_helpers.json');
const mdPath = path.join(root, 'outputs', 'fase_228_static_render_helpers.md');

function read(relPath) {
  const fullPath = path.join(root, relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

const helper = read(path.join('src', 'lib', 'canvas', 'renderStaticHelpers.ts'));
const useCanvas = read(path.join('src', 'hooks', 'useCanvas.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));

const helperNames = ['drawCanvasBackgroundGrid', 'drawFloorPlanImageLayer', 'drawCanvasScaleHud'];
const checks = helperNames.map((name) => ({
  id: name,
  helperDefined: helper.includes(`function ${name}`),
  usedInCanvas: useCanvas.includes(`${name}(`),
}));

const payload = {
  schema: 'radshield-mx.f228.static-render-helpers.v1',
  phase: 'F228',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.helperDefined && check.usedInCanvas) && canvasArea.includes('f228-static-renderer-helpers')
    ? 'static-render-helpers-ready'
    : 'static-render-helpers-blocked',
  checks,
  guardedStillInUseCanvas: {
    cadOverlays: useCanvas.includes('ghostPos') && useCanvas.includes('drawingState.isDrawing'),
    selectionGrips: useCanvas.includes('selectionWindow') && useCanvas.includes('lassoPath') && useCanvas.includes('findGripAtScreen'),
  },
  nextSafeStep:
    'F229: extraer helpers de regiones/zonas y etiquetas de barrera sin tocar drag state, lasso ni selection grips.',
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    '# F228 Static Render Helpers',
    '',
    `Estado: ${payload.status}`,
    '',
    '## Helpers',
    ...checks.map((check) => `- ${check.id}: defined=${check.helperDefined}, used=${check.usedInCanvas}`),
    '',
    '## Capas protegidas',
    `- cadOverlays: ${payload.guardedStillInUseCanvas.cadOverlays}`,
    `- selectionGrips: ${payload.guardedStillInUseCanvas.selectionGrips}`,
    '',
    '## Siguiente paso seguro',
    payload.nextSafeStep,
    '',
  ].join('\n'),
);

console.log(`F228 static render helpers: ${payload.status}`);
console.log(jsonPath);
