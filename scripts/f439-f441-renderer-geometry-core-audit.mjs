import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f439ToF441RendererGeometryCore.ts', 'radshield-mx.f439-f441.renderer-geometry-core.v1'],
  ['src/lib/f439ToF441RendererGeometryCore.ts', 'F439NormalizedGeometryEntity'],
  ['src/lib/f439ToF441RendererGeometryCore.ts', 'F440OverlayRenderPlan'],
  ['src/lib/f439ToF441RendererGeometryCore.ts', 'F441RendererCorePreflight'],
  ['src/lib/f439ToF441RendererGeometryCore.ts', 'eventControllerTouched: false'],
  ['src/sections/CanvasArea.tsx', 'buildF439ToF441RendererGeometryCore'],
  ['src/sections/CanvasArea.tsx', 'f439-f441-renderer-geometry-core'],
  ['src/sections/CanvasArea.tsx', 'f439-normalized-entities'],
  ['src/sections/CanvasArea.tsx', 'f440-overlay-render-plan'],
  ['src/sections/CanvasArea.tsx', 'f441-renderer-core-preflight'],
  ['src/sections/CanvasArea.tsx', 'f441-renderer-core-decision'],
  ['src/sections/CanvasArea.tsx', 'f439-f441-renderer-geometry-core-row'],
  ['e2e/f439-f441-renderer-geometry-core.spec.ts', 'renderer-geometry-core-ui-ready'],
  ['CHANGELOG.md', 'F439-F441'],
  ['MANUAL_VERSIONES_v50.md', 'F439-F441'],
  ['MANUAL_USUARIO_v99.md', 'F439-F441'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F439-F441 Renderer geometry core'],
  ['package.json', 'prepare:f439-f441:renderer-geometry'],
  ['package.json', 'test:f439-f441:renderer-geometry'],
  ['package.json', 'test:f439-f441:renderer-geometry:e2e'],
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
  console.error('F439-F441 renderer geometry core audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F439-F441 renderer geometry core audit passed.');
