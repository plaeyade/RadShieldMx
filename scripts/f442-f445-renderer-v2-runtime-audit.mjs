import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'radshield-mx.f442-f445.renderer-v2-runtime.v1'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'F442RendererInstruction'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'F443RendererPass'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'F444RuntimeGate'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'F445RendererRollbackPlan'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'drawF442ToF445RendererV2Overlay'],
  ['src/lib/f442ToF445RendererV2Runtime.ts', 'eventControllerTouched: false'],
  ['src/sections/CanvasArea.tsx', 'buildF442ToF445RendererV2Runtime'],
  ['src/sections/CanvasArea.tsx', 'drawF442ToF445RendererV2Overlay'],
  ['src/sections/CanvasArea.tsx', 'f442-f445-renderer-v2-overlay-canvas'],
  ['src/sections/CanvasArea.tsx', 'f442-f445-renderer-v2-runtime'],
  ['src/sections/CanvasArea.tsx', 'f442-render-instructions'],
  ['src/sections/CanvasArea.tsx', 'f443-render-passes'],
  ['src/sections/CanvasArea.tsx', 'f444-runtime-gates'],
  ['src/sections/CanvasArea.tsx', 'f445-rollback-plan'],
  ['src/sections/CanvasArea.tsx', 'f442-f445-renderer-v2-runtime-row'],
  ['e2e/f442-f445-renderer-v2-runtime.spec.ts', 'renderer-v2-runtime-ui-ready'],
  ['CHANGELOG.md', 'F442-F445'],
  ['MANUAL_VERSIONES_v50.md', 'F442-F445'],
  ['MANUAL_USUARIO_v99.md', 'F442-F445'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F442-F445 Renderer v2 runtime'],
  ['package.json', 'prepare:f442-f445:renderer-v2'],
  ['package.json', 'test:f442-f445:renderer-v2'],
  ['package.json', 'test:f442-f445:renderer-v2:e2e'],
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
  console.error('F442-F445 renderer v2 runtime audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F442-F445 renderer v2 runtime audit passed.');
