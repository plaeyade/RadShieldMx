import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'radshield-mx.f436-f438.renderer-v2-bridge.v1'],
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'F436VisualBaselineViewport'],
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'F437PdfEvidenceLiveLink'],
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'F438RendererGeometryCoreEntity'],
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'VITE_CANVAS_HIGH_RISK_CAD'],
  ['src/lib/f436ToF438RendererV2Bridge.ts', 'VITE_CANVAS_EVENT_CONTROLLER_V2'],
  ['src/sections/CanvasArea.tsx', 'buildF436ToF438RendererV2Bridge'],
  ['src/sections/CanvasArea.tsx', 'f436-f438-renderer-v2-bridge'],
  ['src/sections/CanvasArea.tsx', 'f436-visual-baseline'],
  ['src/sections/CanvasArea.tsx', 'f437-pdf-evidence-live-link'],
  ['src/sections/CanvasArea.tsx', 'f438-renderer-geometry-core'],
  ['src/sections/CanvasArea.tsx', 'f438-feature-flag-policy'],
  ['src/sections/CanvasArea.tsx', 'f436-f438-renderer-v2-bridge-row'],
  ['e2e/f436-f438-renderer-v2-bridge.spec.ts', 'renderer-v2-bridge-ui-ready'],
  ['CHANGELOG.md', 'F436-F438'],
  ['MANUAL_VERSIONES_v50.md', 'F436-F438'],
  ['MANUAL_USUARIO_v99.md', 'F436-F438'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F436-F438 Renderer v2 bridge'],
  ['package.json', 'prepare:f436-f438:renderer-v2'],
  ['package.json', 'test:f436-f438:renderer-v2'],
  ['package.json', 'test:f436-f438:renderer-v2:e2e'],
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
  console.error('F436-F438 renderer v2 bridge audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F436-F438 renderer v2 bridge audit passed.');
