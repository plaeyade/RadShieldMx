import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f171CanvasPolishPredeploy.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/f171-canvas-polish-predeploy.mjs',
  'scripts/check-f171-canvas-polish-predeploy-contracts.mjs',
  'outputs/f171_canvas_polish_predeploy/f171_canvas_polish_predeploy.json',
  'outputs/fase_171_canvas_polish_predeploy.md',
  'package.json',
  'CHANGELOG.md',
  'MANUAL_VERSIONES_v50.md',
];

const failures = [];
const read = (file) => readFileSync(file, 'utf8');
for (const file of files) {
  if (!existsSync(file)) failures.push(`Missing required file: ${file}`);
}

const manifest = existsSync(files[4]) ? JSON.parse(read(files[4])) : null;
if (manifest) {
  if (manifest.phase !== 'F171') failures.push('F171 manifest phase mismatch');
  if (manifest.status !== 'canvas-polish-predeploy-ready') failures.push(`F171 status not ready: ${manifest.status}`);
  if (manifest.schema !== 'radshield-mx.canvas-polish-predeploy.f171.v1') failures.push('F171 schema mismatch');
  if (!manifest.gates?.f170Ready || !manifest.gates?.f170NoWarnings) failures.push('F171 requires F170 ready without warnings');
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
for (const token of [
  'F171',
  'canvas-polish-predeploy-ready',
  'f171-canvas-polish-predeploy',
  'f171-polish-${item.id}',
  'buildF171CanvasPolishPredeploy',
  'prepare:f171:canvas-polish',
  'test:f171:canvas-polish',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const capability of ['grips', 'dimensions', 'snap', 'selection', 'heatmap', 'properties', 'export']) {
  if (!joined.includes(`id: '${capability}'`)) failures.push(`Missing F171 capability: ${capability}`);
}

if (failures.length) {
  console.error('F171 canvas polish predeploy contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F171 canvas polish predeploy contracts OK.');
