import { existsSync, readFileSync } from 'node:fs';

const files = [
  'src/lib/f173CanvasLowRiskPolish.ts',
  'src/sections/CanvasArea.tsx',
  'scripts/f173-canvas-low-risk-polish.mjs',
  'scripts/check-f173-canvas-low-risk-polish-contracts.mjs',
  'outputs/f173_canvas_low_risk_polish/f173_canvas_low_risk_polish.json',
  'outputs/fase_173_canvas_low_risk_polish.md',
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
  if (manifest.phase !== 'F173') failures.push('F173 manifest phase mismatch');
  if (manifest.schema !== 'radshield-mx.canvas-low-risk-polish.f173.v1') failures.push('F173 schema mismatch');
  if (manifest.status !== 'canvas-low-risk-polish-ready') failures.push(`F173 status not ready: ${manifest.status}`);
  if (!manifest.gates?.f172ControlledReady) failures.push('F173 requires F172 controlled/public ready');
}

const joined = files.filter((file) => existsSync(file)).map((file) => read(file)).join('\n');
for (const token of [
  'F173',
  'buildF173CanvasLowRiskPolish',
  'f173-canvas-hud',
  'f173-hud-${signal.id}',
  'prepare:f173:canvas-polish',
  'test:f173:canvas-polish',
  'canvas-low-risk-polish-ready',
]) {
  if (!joined.includes(token)) failures.push(`Missing token: ${token}`);
}

for (const signal of ['selection', 'snap', 'objects', 'evidence', 'heatmap', 'export']) {
  if (!joined.includes(`id: '${signal}'`)) failures.push(`Missing signal: ${signal}`);
}

if (failures.length) {
  console.error('F173 canvas low-risk polish contracts failed:');
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log('F173 canvas low-risk polish contracts OK.');
