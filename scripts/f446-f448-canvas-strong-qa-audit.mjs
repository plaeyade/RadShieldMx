import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f446ToF448CanvasStrongQa.ts', 'radshield-mx.f446-f448.canvas-strong-qa.v1'],
  ['src/lib/f446ToF448CanvasStrongQa.ts', 'F446CanvasSurfaceCheck'],
  ['src/lib/f446ToF448CanvasStrongQa.ts', 'F447CanvasInteractionCheck'],
  ['src/lib/f446ToF448CanvasStrongQa.ts', 'F448CanvasRegressionGate'],
  ['src/sections/CanvasArea.tsx', 'buildF446ToF448CanvasStrongQa'],
  ['src/sections/CanvasArea.tsx', 'f446-f448-canvas-strong-qa'],
  ['src/sections/CanvasArea.tsx', 'f446-surface-checks'],
  ['src/sections/CanvasArea.tsx', 'f447-interaction-checks'],
  ['src/sections/CanvasArea.tsx', 'f448-regression-gates'],
  ['src/sections/CanvasArea.tsx', 'canvas-context-action-barrier'],
  ['src/sections/CanvasArea.tsx', 'canvas-context-action-calc'],
  ['src/sections/CanvasArea.tsx', 'f446-f448-canvas-strong-qa-row'],
  ['e2e/f446-f448-canvas-strong-qa.spec.ts', 'canvas-strong-qa-ui-ready'],
  ['CHANGELOG.md', 'F446-F448'],
  ['MANUAL_VERSIONES_v50.md', 'F446-F448'],
  ['MANUAL_USUARIO_v99.md', 'F446-F448'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F446-F448 Canvas strong QA'],
  ['package.json', 'prepare:f446-f448:canvas-qa'],
  ['package.json', 'test:f446-f448:canvas-qa'],
  ['package.json', 'test:f446-f448:canvas-qa:e2e'],
];

const failures = [];

for (const [relativePath, marker] of checks) {
  const fullPath = path.join(root, relativePath);
  if (!fs.existsSync(fullPath)) {
    failures.push(`${relativePath}: missing file`);
    continue;
  }
  const text = fs.readFileSync(fullPath, 'utf8');
  if (!text.includes(marker)) failures.push(`${relativePath}: missing marker "${marker}"`);
}

if (failures.length) {
  console.error('F446-F448 canvas strong QA audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F446-F448 canvas strong QA audit passed.');
