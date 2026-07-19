import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const outDir = path.join(root, 'outputs', 'f229_canvas_cad_e2e_harness');
const jsonPath = path.join(outDir, 'f229_canvas_cad_e2e_harness.json');
const mdPath = path.join(root, 'outputs', 'fase_229_canvas_cad_e2e_harness.md');

function read(relPath) {
  const fullPath = path.join(root, relPath);
  return fs.existsSync(fullPath) ? fs.readFileSync(fullPath, 'utf8') : '';
}

const spec = read(path.join('e2e', 'canvas-cad-e2e-harness.spec.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const f229 = read(path.join('src', 'lib', 'f229CanvasCadE2EHarness.ts'));
const pkg = JSON.parse(read('package.json') || '{}');

const checks = [
  {
    id: 'playwright-shell',
    ready: spec.includes('assertCanvasShell') && spec.includes('f100-main-floorplan-canvas') && spec.includes('f186-sidebar-stable-width'),
    evidence: 'Spec valida canvas, sidebar y toolbar CAD.',
  },
  {
    id: 'draw-select-lasso',
    ready: spec.includes('dragCanvas') && spec.includes('f191-tool-barrier') && spec.includes('f191-tool-select') && spec.includes('shiftKey') && spec.includes('ctrlKey'),
    evidence: 'Spec ejercita dibujo de muro, seleccion y gestos ventana/lasso.',
  },
  {
    id: 'visual-export',
    ready: spec.includes('f191-visual-mode-heat') && spec.includes('f217-prepare-scene-structure'),
    evidence: 'Spec recorre modos visuales y superficie F217 de export.',
  },
  {
    id: 'canvas-row',
    ready: canvasArea.includes('buildF229CanvasCadE2EHarness') && canvasArea.includes('f229-canvas-cad-e2e-harness'),
    evidence: 'Canvas muestra fila F229 auditable.',
  },
  {
    id: 'contracts',
    ready: Boolean(pkg.scripts?.['prepare:f229:canvas-e2e'] && pkg.scripts?.['test:f229:canvas-e2e-contracts'] && pkg.scripts?.['test:f229:canvas-e2e']),
    evidence: 'package.json expone prepare, contrato y E2E dedicado.',
  },
  {
    id: 'typed-summary',
    ready: f229.includes('radshield-mx.f229.canvas-cad-e2e-harness.v1') && f229.includes('nextCoverage'),
    evidence: 'Resumen tipado declara cobertura y pendientes posteriores.',
  },
];

const payload = {
  schema: 'radshield-mx.f229.canvas-cad-e2e-harness.v1',
  phase: 'F229',
  generatedAt: new Date().toISOString(),
  status: checks.every((check) => check.ready) ? 'canvas-cad-e2e-harness-ready' : 'canvas-cad-e2e-harness-blocked',
  checks,
  coveredNow: [
    'shell/sidebar/toolbar',
    'renderer rows F221-F229',
    'nonblank canvas surface',
    'draw barrier',
    'select inspector',
    'window/lasso gestures',
    'visual modes plan/heat/isocontours/structure',
    'F217 export scene controls',
  ],
  stillToCover: [
    'pixel-diff baseline por viewport',
    'fixture DXF/DWG dedicado dentro del E2E CAD',
    'assert exacto de grip drag y snap target por coordenada',
    'validacion numerica de isocontornos/interpolacion regulatoria',
    'sincronizacion bidireccional 2D/3D',
    'post-deploy F154-F158 contra URL publica final',
  ],
};

fs.mkdirSync(outDir, { recursive: true });
fs.writeFileSync(jsonPath, `${JSON.stringify(payload, null, 2)}\n`);
fs.writeFileSync(
  mdPath,
  [
    '# F229 Canvas CAD E2E Harness',
    '',
    `Estado: ${payload.status}`,
    '',
    '## Cobertura actual',
    ...payload.coveredNow.map((item) => `- ${item}`),
    '',
    '## Checks',
    ...checks.map((check) => `- ${check.id}: ${check.ready ? 'ready' : 'missing'} - ${check.evidence}`),
    '',
    '## Falta cubrir',
    ...payload.stillToCover.map((item) => `- ${item}`),
    '',
  ].join('\n'),
);

console.log(`F229 canvas CAD E2E harness: ${payload.status}`);
console.log(jsonPath);
