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
const f230 = read(path.join('src', 'lib', 'f230PostF229CoverageGate.ts'));
const canvasArea = read(path.join('src', 'sections', 'CanvasArea.tsx'));
const update = read(path.join('src', 'sections', 'dialogs', 'UpdateAppDialog.tsx'));
const changelog = read('CHANGELOG.md');
const manual = read('MANUAL_USUARIO_v99.md');
const versions = read('MANUAL_VERSIONES_v50.md');
const control = read('CONTROL_DE_CAMBIOS_v99.md');
const htmlManual = read(path.join('public', 'manual_usuario.html'));
const prep = read(path.join('scripts', 'f230-post-f229-coverage-gate.mjs'));

const contracts = [
  ['package scripts', JSON.stringify(pkg.scripts ?? {}), ['prepare:f230:post-f229-gate', 'test:f230:post-f229-gate']],
  ['F230 lib', f230, ['radshield-mx.f230.post-f229-coverage-gate.v1', 'buildF230PostF229CoverageGate', 'rendererEventDecision', 'nextSafePhases']],
  ['CanvasArea', canvasArea, ['buildF230PostF229CoverageGate', 'f230-post-f229-coverage-gate', 'renderer/eventos: solo con flag y rollback']],
  ['Update Center', update, ['F230 Post-F229 coverage gate', 'renderer/eventos']],
  ['CHANGELOG', changelog, ['## F230', 'post-F229 coverage gate']],
  ['Manual usuario', manual, ['Addendum F230', 'renderer base y eventos']],
  ['Manual versiones', versions, ['## F230', 'post-f229-coverage-gate']],
  ['Control cambios', control, ['F230', 'renderer/eventos']],
  ['Manual HTML', htmlManual, ['F230', 'Post-F229 Coverage Gate', 'renderer/eventos']],
  ['F230 prep', prep, ['F198 menus/buttons smoke pass', 'F207 functional app QA pass', 'F229 canvas CAD E2E pass', 'F200 static release gate pass']],
];

for (const [label, text, tokens] of contracts) {
  for (const token of tokens) {
    if (!text.includes(token)) failures.push(`${label} missing token: ${token}`);
  }
}

const jsonPath = path.join(root, 'outputs', 'f230_post_f229_coverage_gate', 'f230_post_f229_coverage_gate.json');
if (!fs.existsSync(jsonPath)) {
  failures.push('Missing F230 output JSON');
} else {
  const payload = JSON.parse(fs.readFileSync(jsonPath, 'utf8'));
  if (payload.schema !== 'radshield-mx.f230.post-f229-coverage-gate.v1') failures.push('F230 schema mismatch');
  if (payload.status !== 'post-f229-coverage-ready') failures.push(`F230 status is ${payload.status}`);
  if (!Array.isArray(payload.remainingCoverageAfterF229) || payload.remainingCoverageAfterF229.length < 5) {
    failures.push('F230 remaining coverage list incomplete');
  }
}

if (failures.length > 0) {
  console.error('F230 post-F229 coverage gate contracts failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F230 post-F229 coverage gate contracts passed.');
