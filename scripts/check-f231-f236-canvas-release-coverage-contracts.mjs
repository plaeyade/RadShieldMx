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
const lib = read(path.join('src', 'lib', 'f231ToF236CanvasReleaseCoverage.ts'));
const canvas = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const update = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const control = read('CONTROL_DE_CAMBIOS_v99.md');
const html = read(path.join('public', 'manual_usuario.html'));
const script = read(path.join('scripts', 'f231-f236-canvas-release-coverage.mjs'));

const phaseTokens = ['F231', 'F232', 'F233', 'F234', 'F235', 'F236'];
const contracts = [
  ['package scripts', JSON.stringify(pkg.scripts ?? {}), ['prepare:f231-f236:canvas-release-coverage', 'test:f231-f236:canvas-release-coverage']],
  ['lib', lib, ['radshield-mx.f231-f236.canvas-release-coverage.v1', 'buildF231ToF236CanvasReleaseCoverage', 'calculationEngineRecommendations']],
  ['canvas', canvas, ['f231-f236-canvas-release-coverage', 'cierre visual/DXF/grips/iso/3D/deploy']],
  ['script', script, ['pixel-diff visual baseline', 'DXF/DWG fixture gate', 'grip/snap coordinate harness', 'numeric isocontour export gate', '2D/3D sync handoff gate', 'post-deploy public smoke package']],
  ['Update Center', update, ['F231-F236 Canvas release coverage']],
  ['CHANGELOG', changelog, ['## F231-F236', 'pixel-diff']],
  ['Manual usuario', manual, ['Addendum F231-F236', 'Motor de calculo']],
  ['Manual versiones', versions, ['## F231-F236', 'canvas-release-coverage']],
  ['Control cambios', control, ['F231-F236', 'DXF/DWG']],
  ['Manual HTML', html, ['F231-F236', 'Canvas Release Coverage']],
];

for (const [label, text, tokens] of contracts) {
  const expectedTokens = ['package scripts', 'canvas'].includes(label) ? tokens : [...tokens, ...phaseTokens];
  for (const token of expectedTokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f231_f236_canvas_release_coverage', 'f231_f236_canvas_release_coverage.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F231-F236 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f231-f236.canvas-release-coverage.v1') failures.push('schema mismatch');
  if (payload.status !== 'f231-f236-complete') failures.push(`status is ${payload.status}`);
  if (!Array.isArray(payload.calculationEngineRecommendations) || payload.calculationEngineRecommendations.length < 5) {
    failures.push('calculation recommendations incomplete');
  }
}

if (failures.length) {
  console.error('F231-F236 contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F231-F236 canvas release coverage contracts passed.');
