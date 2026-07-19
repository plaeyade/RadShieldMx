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
const spec = read(path.join('e2e', 'canvas-cad-e2e-harness.spec.ts'));
const f229 = read(path.join('src', 'lib', 'f229CanvasCadE2EHarness.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const updateCenter = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');

const contracts = [
  ['package scripts', JSON.stringify(pkg.scripts ?? {}), ['prepare:f229:canvas-e2e', 'test:f229:canvas-e2e-contracts', 'test:f229:canvas-e2e']],
  ['E2E spec', spec, ['F229 Canvas CAD E2E Harness', 'assertCanvasShell', 'dragCanvas', 'f191-tool-barrier', 'f191-tool-select', 'f191-visual-mode-heat', 'f217-prepare-scene-structure']],
  ['F229 lib', f229, ['radshield-mx.f229.canvas-cad-e2e-harness.v1', 'buildF229CanvasCadE2EHarness', 'nextCoverage', 'draw-barrier', 'visual-modes']],
  ['CanvasArea UI', canvasArea, ['buildF229CanvasCadE2EHarness', 'f229-canvas-cad-e2e-harness', 'f229-canvas-e2e-ready-count', 'Playwright dedicado']],
  ['Update Center', updateCenter, ['F229 Canvas CAD E2E Harness', 'Playwright dedicado']],
  ['CHANGELOG', changelog, ['## F229', 'canvas-cad-e2e-harness.spec.ts']],
  ['Manual usuario', manual, ['Addendum F229', 'Canvas CAD E2E Harness']],
  ['Manual versiones', versions, ['## F229', 'canvas-cad-e2e-harness']],
];

for (const [label, text, tokens] of contracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f229_canvas_cad_e2e_harness', 'f229_canvas_cad_e2e_harness.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F229 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f229.canvas-cad-e2e-harness.v1') failures.push('F229 JSON schema mismatch');
  if (payload.status !== 'canvas-cad-e2e-harness-ready') failures.push(`F229 status is ${payload.status}`);
  if (!Array.isArray(payload.stillToCover) || payload.stillToCover.length < 4) failures.push('F229 stillToCover must list remaining gaps');
}

if (failures.length > 0) {
  console.error('F229 canvas CAD E2E harness contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F229 canvas CAD E2E harness contracts passed.');
