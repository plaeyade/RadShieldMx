import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();

const checks = [
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'radshield-mx.f431-f435.renderer-release-gate.v1'],
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'F431VisualSmokeSurface'],
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'F432EvidenceMemoryManifestItem'],
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'F433ReleaseBlockReview'],
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'F434RendererBaseDecision'],
  ['src/lib/f431ToF435RendererReleaseGate.ts', 'F435NextPhaseHandoff'],
  ['src/sections/CanvasArea.tsx', 'buildF431ToF435RendererReleaseGate'],
  ['src/sections/CanvasArea.tsx', 'f431-f435-renderer-release-gate'],
  ['src/sections/CanvasArea.tsx', 'f431-visual-smoke-surfaces'],
  ['src/sections/CanvasArea.tsx', 'f432-evidence-memory-manifest'],
  ['src/sections/CanvasArea.tsx', 'f433-release-block-review'],
  ['src/sections/CanvasArea.tsx', 'f434-renderer-base-decision'],
  ['src/sections/CanvasArea.tsx', 'f435-next-phase-handoff'],
  ['e2e/f431-f435-renderer-release-gate.spec.ts', 'renderer-release-gate-ui-ready'],
  ['CHANGELOG.md', 'F431-F435'],
  ['MANUAL_VERSIONES_v50.md', 'F431-F435'],
  ['MANUAL_USUARIO_v99.md', 'F431-F435'],
  ['src/sections/dialogs/UpdateAppDialog.tsx', 'F431-F435 Renderer release gate'],
  ['package.json', 'prepare:f431-f435:renderer-release'],
  ['package.json', 'test:f431-f435:renderer-release'],
  ['package.json', 'test:f431-f435:renderer-release:e2e'],
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
  console.error('F431-F435 renderer release gate audit failed:');
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log('F431-F435 renderer release gate audit passed.');
